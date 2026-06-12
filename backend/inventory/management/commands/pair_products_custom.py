from django.core.management.base import BaseCommand
from inventory.models import Products, Customizables

class Command(BaseCommand):
    help = "Populate Products table with sample data"

   


    def handle(self, *args, **options):
        # retrieving respective products
        waakye = Products.objects.get(name="Waakye")
        waakye_jumbo = Products.objects.get(name="Waakye Jumbo")
        chicken_grilled = Products.objects.get(name="Chicken Grilled")

        
        #retrieving respective customizables
        egg = Customizables.objects.get(name="Egg")
        plantain = Customizables.objects.get(name="Plantain")

        # Associating customizables with products
        waakye.products_customs.add(egg, plantain)
        waakye_jumbo.products_customs.add(egg)
        chicken_grilled.products_customs.add(plantain)
        self.stdout.write(self.style.SUCCESS("Associated customizables with products successfully!"))

