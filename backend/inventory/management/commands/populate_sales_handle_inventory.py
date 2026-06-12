import logging
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from inventory.models import Sale, SaleItem, Products, Customizables, RecipeItemProducts, RecipeItemCustomizables
from decimal import Decimal

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create a file handler for permanent logs (optional)
file_handler = logging.FileHandler('inventory_deductions.log')
file_handler.setLevel(logging.INFO)

# Create console handler for live output
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Formatting
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Add handlers to logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)


sample_order_json = {
    "customer": {
        "id": 7,
        "name": "Solomon Mensah Attipoe",
        "phone": "0240058926"
    },
    "order": {
        "total_amount": "100.00",
        "payment_method": "MoMo",
        "specific_description": "I want a lot of shito please",
        "prepared_by_id": 45,
        "processed_by_id": 23,
        "baskets": [
            {
                "product_id": 2,
                "product_name": "Waakye Jumbo",
                "product_price_sold": 10.00,
                "product_quantity": 4,
                "customizations": [
                    {
                        "custom_id": 1,
                        "custom_name": "Egg",
                        "custom_price_sold": 5.00,
                        "custom_quantity": 5
                    },
                    {
                        "custom_id": 2,
                        "custom_name": "Plantain",
                        "custom_price_sold": 2.00,
                        "custom_quantity": 1
                    }
                ]
            },
            {
                "product_id": 1,
                "product_name": "Waakye",
                "product_price_sold": 15.00,
                "product_quantity": 1,
                "customizations": []
            }
        ]
    }
}


class Command(BaseCommand):
    help = "Process sample order and log inventory deductions"

    def handle(self, *args, **options):
        order_data = sample_order_json['order']

        sale = Sale.objects.create(
            total_amount=order_data['total_amount'],
            payment_method=order_data['payment_method'],
            specific_description=order_data['specific_description']
        )
        logger.info(f"Created Sale ID: {sale.id} | Amount: {sale.total_amount}")

        for basket in order_data['baskets']:
            product = Products.objects.get(id=basket['product_id'])
            SaleItem.objects.create(
                sale=sale,
                item_type='PRODUCT',
                product=product,
                quantity=basket['product_quantity'],
                price_sold=basket['product_price_sold']
            )
            logger.info(f"Product Sold: {product.name} | Qty: {basket['product_quantity']} | Price: {basket['product_price_sold']}")

            # Handle self quantity
            if product.self_required_quantity and product.self_quantity_in_stock:
                quantity_to_deduct = Decimal(basket['product_quantity']) * Decimal(product.self_required_quantity)
                if product.self_quantity_in_stock >= quantity_to_deduct:
                    product.self_quantity_in_stock -= quantity_to_deduct
                    product.save()
                    logger.info(f"→ Deducted {quantity_to_deduct} from {product.name} self stock. Remaining: {product.self_quantity_in_stock}")
                else:
                    logger.warning(f"⚠️ Insufficient self stock for {product.name}")

            # Handle recipe raw items
            for recipe_item in RecipeItemProducts.objects.filter(product=product):
                quantity_to_deduct = Decimal(basket['product_quantity']) * Decimal(recipe_item.quantity_required)
                raw_item = recipe_item.raw_item

                if raw_item.quantity_in_stock >= quantity_to_deduct:
                    raw_item.quantity_in_stock -= quantity_to_deduct
                    raw_item.save()
                    logger.info(f"→ Deducted {quantity_to_deduct} of {raw_item.name} (raw) for {product.name}. Remaining: {raw_item.quantity_in_stock}")
                else:
                    logger.warning(f"⚠️ Insufficient raw stock for {raw_item.name}")

            # Handle customizations
            for custom in basket['customizations']:
                custom_item = Customizables.objects.get(id=custom['custom_id'])
                SaleItem.objects.create(
                    sale=sale,
                    item_type='CUSTOM',
                    custom=custom_item,
                    quantity=custom['custom_quantity'],
                    price_sold=custom['custom_price_sold']
                )
                logger.info(f"Customization Sold: {custom_item.name} | Qty: {custom['custom_quantity']}")

                # Deduct custom self stock
                if custom_item.self_required_quantity and custom_item.self_quantity_in_stock:
                    quantity_to_deduct = Decimal(custom['custom_quantity']) * Decimal(custom_item.self_required_quantity)
                    if custom_item.self_quantity_in_stock >= quantity_to_deduct:
                        custom_item.self_quantity_in_stock -= quantity_to_deduct
                        custom_item.save()
                        logger.info(f"→ Deducted {quantity_to_deduct} from {custom_item.name} self stock. Remaining: {custom_item.self_quantity_in_stock}")
                    else:
                        logger.warning(f"⚠️ Insufficient self stock for {custom_item.name}")

                # Deduct custom recipe items
                for custom_recipe_item in RecipeItemCustomizables.objects.filter(custom=custom_item):
                    quantity_to_deduct = Decimal(custom['custom_quantity']) * Decimal(custom_recipe_item.quantity_required)
                    raw_item = custom_recipe_item.raw_item
                    if raw_item.quantity_in_stock >= quantity_to_deduct:
                        raw_item.quantity_in_stock -= quantity_to_deduct
                        raw_item.save()
                        logger.info(f"→ Deducted {quantity_to_deduct} of {raw_item.name} (raw) for {custom_item.name}. Remaining: {raw_item.quantity_in_stock}")
                    else:
                        logger.warning(f"⚠️ Insufficient stock for {raw_item.name}")

        logger.info("✅ Sale processed successfully and inventory updated.")
