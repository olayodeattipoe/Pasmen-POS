from django.core.management.base import BaseCommand
from inventory.models import Products, Customizables

class Command(BaseCommand):
    help = "Populate Products table with sample data"

   


    def handle(self, *args, **options):
        custom_data = [
            {
                "name": "Egg",
                "description": "Add Egg to your meals",
                "price": 5.00,
                "pricing_type": "FIX",
            },
            {
                "name": "Plantain",
                "description": "Make it sweet!",
                "price": 2.00,
                "pricing_type": "VAR",
            }
        ]


        for pdata in custom_data:
            p = Customizables.objects.create(**pdata)
            self.stdout.write(self.style.SUCCESS(f"Created customizable: {p.name}"))

        self.stdout.write(self.style.SUCCESS("Customizable table populated successfully!"))
