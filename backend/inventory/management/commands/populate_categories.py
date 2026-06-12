from django.core.management.base import BaseCommand
from inventory.models import Category

class Command(BaseCommand):
    help = "Populate Products table with sample data"

   
    def handle(self, *args, **options):
        categories_data = [
            {
                "category_name": "Waakye",
            },
            {
                "category_name": "Desserts",
            },
            {
                "category_name": "Rich Flavours",
            }
        ]

        for pdata in categories_data:
            p = Category.objects.create(**pdata)
            self.stdout.write(self.style.SUCCESS(f"Created product: {p.category_name}"))
        self.stdout.write(self.style.SUCCESS("Category table populated successfully!"))
