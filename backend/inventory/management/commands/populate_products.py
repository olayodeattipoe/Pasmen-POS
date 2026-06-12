from django.core.management.base import BaseCommand
from inventory.models import Products, Customizables

class Command(BaseCommand):
    help = "Populate Products table with sample data"

   


    def handle(self, *args, **options):
        products_data = [
            {
                "name": "Waakye",
                "description": "Delicious Waakye",
                "price": 10.00,
                "pricing_type": "VAR",
                "type": "CUSTOMIZABLE",
                "category": "FastFood"
            },
            {
                "name": "Waakye Jumbo",
                "description": "Filled with all greatness",
                "price": 15.00,
                "pricing_type": "FIX",
                "type": "PACKAGES",
                "category": "Packs"
            },
            {
                "name": "Chicken Grilled",
                "description": "Fried & Dunked",
                "price": 20.00,
                "pricing_type": "FIXED_VARIABLE",
                "array_if_fixed_variable": [18.00, 20.00, 22.00],
                "type": "STANDALONE",
                "category": "Combos"
            }
        ]

        for pdata in products_data:
            p = Products.objects.create(**pdata)
            self.stdout.write(self.style.SUCCESS(f"Created product: {p.name}"))
        self.stdout.write(self.style.SUCCESS("Products table populated successfully!"))
