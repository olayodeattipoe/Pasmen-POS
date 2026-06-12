from django.core.management.base import BaseCommand
from inventory.models import Suppliers

class Command(BaseCommand):
    help = "Populate Products table with sample data"

   


    def handle(self, *args, **options):
        suppliers_data = [
            {
                "name": "Mwutor Ganyo",
                "contact_info": "0240058926",
                "address": "142 Helms Way Street",
            },
            {
                "name": "Favor Agbesi",
                "contact_info": "0242748566",
                "address": "142 Helms Way Street",
            },
            {
                "name": "Michael Amoako",
                "contact_info": "0551310230",
                "address": "142 Helms Way Street",
            },
        ]

        for pdata in suppliers_data:
            p = Suppliers.objects.create(**pdata)
            self.stdout.write(self.style.SUCCESS(f"Created product: {p.name}"))
        self.stdout.write(self.style.SUCCESS("Suppliers table populated successfully!"))
