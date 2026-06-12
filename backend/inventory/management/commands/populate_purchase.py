from django.core.management.base import BaseCommand
from inventory.models import RawItems, Suppliers, Purchases

class Command(BaseCommand):
    help = "Populate Purchases table with realistic sample data"

    def handle(self, *args, **options):
        # Retrieve suppliers
        supplier_one = Suppliers.objects.get(name="Mwutor Ganyo")
        supplier_two = Suppliers.objects.get(name="Favor Agbesi")

        # Retrieve raw items
        oil = RawItems.objects.get(name="Oil")
        raw_eggs = RawItems.objects.get(name="Raw Eggs")
        cindy_rice = RawItems.objects.get(name="Cindy Rice")

        # Example purchases (showing varying quantities and total costs)
        Purchases.objects.create(raw_item=oil, supplier=supplier_one, quantity=200,total_cost=3500.00)
        oil.quantity_in_stock += 200
        oil.save()
        Purchases.objects.create(raw_item=raw_eggs, supplier=supplier_two, quantity=600, total_cost=1200.00)
        raw_eggs.quantity_in_stock += 600
        raw_eggs.save()
        Purchases.objects.create(raw_item=cindy_rice,supplier=supplier_one, quantity=1500, total_cost=12000.00)
        cindy_rice.quantity_in_stock += 1500
        cindy_rice.save()
        Purchases.objects.create(raw_item=cindy_rice, supplier=supplier_two, quantity=500, total_cost=4100.00)
        cindy_rice.quantity_in_stock += 500
        cindy_rice.save()
        self.stdout.write(self.style.SUCCESS("Sample purchase records added successfully!"))
