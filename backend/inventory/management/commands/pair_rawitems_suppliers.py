from django.core.management.base import BaseCommand
from inventory.models import RawItems, Suppliers

class Command(BaseCommand):
    help = "Populate Products table with sample data"

   


    def handle(self, *args, **options):
        # retrieving respective products
        oil = RawItems.objects.get(name="Oil")
        raw_eggs = RawItems.objects.get(name="Raw Eggs")
        cindy_rice = RawItems.objects.get(name="Cindy Rice")

        
        #retrieving respective customizables
        supplier_one = Suppliers.objects.get(name="Mwutor Ganyo")
        supplier_two = Suppliers.objects.get(name="Favor Agbesi")

        # Associating customizables with products
        oil.supplied_by.add(supplier_one, supplier_two)
        raw_eggs.supplied_by.add(supplier_one)
        cindy_rice.supplied_by.add(supplier_two)
        self.stdout.write(self.style.SUCCESS("Associated Raw Items with suppliers successfully!"))

