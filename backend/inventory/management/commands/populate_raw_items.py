from django.core.management.base import BaseCommand
from inventory.models import RawItems

class Command(BaseCommand):
    help = "Populate Products table with sample data"

   


    def handle(self, *args, **options):
        custom_data = [
            {
                "name": "Cindy Rice",
                "unit" : "GRAMS",
                "type": "VOLUME",
                "description": "For cooking Jollof",
                "quantity_in_stock": 5000,
                "unit_batch_quantity": 50.00,
                "reorder_level": 1000,
            },
            {
                "name": "Raw Eggs",
                "unit" : "PIECES",
                "type": "COUNTABLE",
                "description": "For cooking Jollof",
                "quantity_in_stock": 600,
                "unit_batch_quantity": 1.00,
                "reorder_level": 100,
            },
            {
                "name": "Oil",
                "unit" : "LITERS",
                "type": "VOLUME",
                "description": "For day in day out cooking",
                "quantity_in_stock": 5000,
                "unit_batch_quantity": 45.00,
                "reorder_level": 500,
            },
        ]


        for pdata in custom_data:
            p = RawItems.objects.create(**pdata)
            self.stdout.write(self.style.SUCCESS(f"Created customizable: {p.name}"))

        self.stdout.write(self.style.SUCCESS("RawItems table populated successfully!"))
