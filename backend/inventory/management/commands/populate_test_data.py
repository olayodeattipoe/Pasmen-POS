import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from inventory.models import (
    Category, CustomizableHeaders, Products, Customizables, RawItems, MainStoreRawItems, 
    RecipeItemProducts, RecipeItemCustomizables, Suppliers, Purchases, Sale, SaleItem, 
    Customer, UnitType, RawItemsType, ProductType, PricingType, PaymentMethod, SaleStatus
)

class Command(BaseCommand):
    help = 'Populates the entire database with ~10 random sample records per table for testing purposes.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting database population process...")

        # 1. Categories
        categories_data = ["Rice Dishes", "Soups & Stews", "Beverages", "Snacks", "Grills", "Pasta", "Salads", "Desserts", "Breakfast", "Specials"]
        categories = []
        for name in categories_data:
            cat, _ = Category.objects.get_or_create(category_name=name)
            categories.append(cat)
        self.stdout.write("✅ Categories created")

        # 2. Customizable Headers
        headers_data = ["Add Meat", "Add Fish", "Extra Spices", "Side Options", "Sauces", "Beverage Size", "Milk Options", "Sugar Level", "Egg Prep", "Packaging"]
        headers = []
        for name in headers_data:
            header, _ = CustomizableHeaders.objects.get_or_create(header=name)
            headers.append(header)
        self.stdout.write("✅ Customizable Headers created")

        # 3. Suppliers
        suppliers = []
        for i in range(1, 11):
            supplier, _ = Suppliers.objects.get_or_create(
                name=f"Supplier {i}",
                defaults={"contact_info": f"555-00{i:02d}", "address": f"Warehouse {i}, Industrial Lane"}
            )
            suppliers.append(supplier)
        self.stdout.write("✅ Suppliers created")

        # 4. Customers
        customers = []
        for i in range(1, 11):
            customer, _ = Customer.objects.get_or_create(
                name=f"Customer {i}",
                defaults={"phone": f"555-90{i:02d}"}
            )
            customers.append(customer)
        self.stdout.write("✅ Customers created")

        # 5. MainStoreRawItems
        main_raw_items = []
        raw_materials = ["Rice (Bulk)", "Chicken (Bulk)", "Beef (Bulk)", "Tomatoes (Crate)", "Onions (Bag)", "Oil (Drum)", "Salt (Bag)", "Pepper (Bag)", "Fish (Carton)", "Flour (Bag)"]
        for rm in raw_materials:
            mri, created = MainStoreRawItems.objects.get_or_create(
                name=rm,
                defaults={
                    "unit": UnitType.GRAMS,
                    "type": RawItemsType.VOLUME,
                    "description": f"Bulk {rm} for main store",
                    "quantity_in_stock": Decimal(random.randint(5000, 20000)),
                    "unit_batch_quantity": Decimal(random.randint(50, 100)),
                    "reorder_level": random.randint(100, 500)
                }
            )
            if created:
                mri.supplied_by.add(*random.sample(suppliers, 2))
                mri.save()
            main_raw_items.append(mri)
        self.stdout.write("✅ MainStoreRawItems created")

        # 6. Branch RawItems
        branch_raw_items = []
        for mri in main_raw_items:
            # strip "(Bulk)" etc for the branch name
            name = mri.name.split(" ")[0]
            bri, _ = RawItems.objects.get_or_create(
                name=name,
                defaults={
                    "unit": mri.unit,
                    "type": mri.type,
                    "description": f"Branch stock for {name}",
                    "quantity_in_stock": Decimal(random.randint(100, 1000)),
                    "unit_batch_quantity": mri.unit_batch_quantity,
                    "reorder_level": random.randint(10, 50)
                }
            )
            branch_raw_items.append(bri)
        self.stdout.write("✅ Branch RawItems created")

        # 7. Purchases (Linked to MainStoreRawItems)
        for i in range(15):
            main_item = random.choice(main_raw_items)
            qty = Decimal(random.randint(50, 500))
            Purchases.objects.create(
                raw_item=main_item,
                quantity=qty,
                supplier=random.choice(suppliers),
                total_cost=qty * Decimal(random.uniform(2.0, 15.0))
            )
            # Update stock for the purchase (simplified)
            main_item.quantity_in_stock += qty
            main_item.save()
        self.stdout.write("✅ Purchases recorded for Main Store")

        # 8. Customizables
        customizables = []
        custom_names = ["Extra Chicken", "Extra Beef", "Fried Egg", "Boiled Egg", "Chili Sauce", "Ketchup", "Coleslaw", "Fried Plantain", "Extra Cheese", "Bacon"]
        for name in custom_names:
            custom, _ = Customizables.objects.get_or_create(
                name=name,
                defaults={
                    "customizable_header": random.choice(headers),
                    "description": f"Optional {name}",
                    "price": Decimal(random.uniform(5.0, 25.0)),
                    "pricing_type": PricingType.FIXED
                }
            )
            customizables.append(custom)
        self.stdout.write("✅ Customizables created")

        # 9. Products
        products = []
        product_names = ["Jollof Rice", "Fried Rice", "Banku & Tilapia", "Fufu & Light Soup", "Waakye", "Grilled Chicken", "Beef Burger", "Chicken Wrap", "Caesar Salad", "Ice Cream"]
        for idx, name in enumerate(product_names):
            product, created = Products.objects.get_or_create(
                name=name,
                defaults={
                    "category": categories[idx % len(categories)],
                    "type": ProductType.STANDALONE,
                    "description": f"Delicious {name}",
                    "price": Decimal(random.uniform(50.0, 300.0)),
                    "pricing_type": PricingType.FIXED,
                    "adjustable": True
                }
            )
            if created:
                # Add 2-3 random customizables to the product
                product.products_customs.add(*random.sample(customizables, random.randint(2, 3)))
            products.append(product)
        self.stdout.write("✅ Products created")

        # 10. Recipes
        for product in products:
            RecipeItemProducts.objects.get_or_create(
                product=product,
                raw_item=random.choice(branch_raw_items),
                defaults={"quantity_required": Decimal(random.uniform(0.5, 5.0))}
            )
        
        for custom in customizables:
            RecipeItemCustomizables.objects.get_or_create(
                custom=custom,
                raw_item=random.choice(branch_raw_items),
                defaults={"quantity_required": Decimal(random.uniform(0.1, 2.0))}
            )
        self.stdout.write("✅ Recipes (Products & Customizables) created")

        # 11. Sales & SaleItems
        admin_user = User.objects.filter(is_superuser=True).first()
        for i in range(15):
            sale = Sale.objects.create(
                total_amount=Decimal(0), # We'll calculate this in a bit
                payment_method=random.choice([PaymentMethod.CASH, PaymentMethod.MOBILE_MONEY]),
                customer=random.choice(customers),
                prepared_by=admin_user,
                sale_status=random.choice(SaleStatus.choices)[0]
            )
            
            total = Decimal(0)
            # Add 1-4 random products/customs
            for _ in range(random.randint(1, 4)):
                is_prod = random.choice([True, False])
                quantity = random.randint(1, 3)
                if is_prod:
                    item = random.choice(products)
                    price = item.price * quantity
                    SaleItem.objects.create(sale=sale, item_type='PRODUCT', product=item, quantity=quantity, price_sold=price)
                else:
                    item = random.choice(customizables)
                    price = item.price * quantity
                    SaleItem.objects.create(sale=sale, item_type='CUSTOM', custom=item, quantity=quantity, price_sold=price)
                total += price
                
            sale.total_amount = total
            sale.save()
        self.stdout.write("✅ Sales and SaleItems created")

        self.stdout.write(self.style.SUCCESS('🎉 Successfully populated the entire database with sample data!'))
