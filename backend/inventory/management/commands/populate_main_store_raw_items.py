from django.core.management.base import BaseCommand
from inventory.models import MainStoreRawItems, Suppliers, UnitType, RawItemsType
import random
from decimal import Decimal

class Command(BaseCommand):
    help = 'Populates the database with 10 random MainStoreRawItems and related Suppliers.'

    def handle(self, *args, **kwargs):
        # Create a few suppliers first
        suppliers_data = [
            {"name": "Local Farms Co.", "contact_info": "555-0100", "address": "123 Farm Rd"},
            {"name": "Global Grocers", "contact_info": "555-0200", "address": "456 Market St"},
            {"name": "Fresh Catch Seafood", "contact_info": "555-0300", "address": "789 Dock Ave"},
        ]
        
        suppliers = []
        for s_data in suppliers_data:
            supplier, created = Suppliers.objects.get_or_create(name=s_data['name'], defaults=s_data)
            suppliers.append(supplier)
            
        items_data = [
            {"name": "Basmati Rice", "unit": UnitType.GRAMS, "type": RawItemsType.VOLUME, "desc": "High quality long grain rice"},
            {"name": "Chicken Breast", "unit": UnitType.GRAMS, "type": RawItemsType.VOLUME, "desc": "Fresh boneless chicken breast"},
            {"name": "Red Onions", "unit": UnitType.PIECES, "type": RawItemsType.COUNTABLE, "desc": "Fresh red onions"},
            {"name": "Vegetable Oil", "unit": UnitType.LITRE, "type": RawItemsType.VOLUME, "desc": "5L pure vegetable oil"},
            {"name": "Salt", "unit": UnitType.GRAMS, "type": RawItemsType.VOLUME, "desc": "Iodized table salt"},
            {"name": "Black Pepper", "unit": UnitType.GRAMS, "type": RawItemsType.VOLUME, "desc": "Ground black pepper"},
            {"name": "Tomatoes", "unit": UnitType.PIECES, "type": RawItemsType.COUNTABLE, "desc": "Fresh ripe tomatoes"},
            {"name": "Garlic", "unit": UnitType.GRAMS, "type": RawItemsType.VOLUME, "desc": "Fresh garlic cloves"},
            {"name": "Beef Steak", "unit": UnitType.GRAMS, "type": RawItemsType.VOLUME, "desc": "Premium cut beef steak"},
            {"name": "Wheat Flour", "unit": UnitType.GRAMS, "type": RawItemsType.VOLUME, "desc": "All-purpose wheat flour"},
        ]

        for data in items_data:
            item, created = MainStoreRawItems.objects.get_or_create(
                name=data["name"],
                defaults={
                    "unit": data["unit"],
                    "type": data["type"],
                    "description": data["desc"],
                    "quantity_in_stock": Decimal(random.randint(100, 5000)),
                    "unit_batch_quantity": Decimal(random.randint(10, 100)),
                    "reorder_level": random.randint(20, 100),
                    "should_read_alerts": True
                }
            )
            
            # Add random suppliers
            if created:
                item.supplied_by.add(*random.sample(suppliers, random.randint(1, 2)))
                item.save()

        self.stdout.write(self.style.SUCCESS(f'Successfully populated 10 MainStoreRawItems and 3 Suppliers!'))
