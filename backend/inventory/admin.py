from django.contrib import admin
from .models import Customer, Sale, SaleItem, Products, Customizables, RawItems, Category

# Register your models here.
admin.site.register(Customer)
admin.site.register(Sale)
admin.site.register(SaleItem)
admin.site.register(Products)
admin.site.register(Customizables)
admin.site.register(RawItems)
admin.site.register(Category)
