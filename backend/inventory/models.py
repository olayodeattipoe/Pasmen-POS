from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User  
import uuid


# Create your models here.
class RawItemsType(models.TextChoices):
    COUNTABLE = 'COUNTABLE', 'Countable'
    VOLUME = 'VOLUME', 'Volume'


class SaleStatus(models.TextChoices):
    INQUEUE = 'In Queue', 'In queue'
    PROCESSING = 'PROCESSING', 'Processing'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'

class ProductType(models.TextChoices):
    STANDALONE = 'STANDALONE', 'Standalone'
    PACKAGES = 'PACKAGES', 'Packages'
    DEFAULT = 'DEFAULT', 'default'
    
   
class PricingType(models.TextChoices):
    FIXED = 'FIX', 'Fixed'
    VARIABLE = 'VAR', 'Variable'
    FIXED_VARIABLE = 'FIX_VAR', 'Fixed & Variable'

class UnitType(models.TextChoices):
    GRAMS = 'GRAMS', 'g'
    LITRE = 'LITRE', 'litre'
    PIECES = 'PIECES', 'pieces'

class PaymentMethod(models.TextChoices):
    CASH = 'CASH', 'Cash'
    MOBILE_MONEY = 'MoMO', 'Mobile Money'

class AdjustmentType(models.TextChoices):
    WASTAGE = 'WASTAGE', 'Wastage'
    SPOILAGE = 'SPOILAGE', 'Spoilage'
    LEFTOVER = 'LEFTOVER', 'Leftover'
    CUSTOM_ADD = 'CUSTOM_ADD', 'Custom Addition'
    CUSTOM_DEDUCT = 'CUSTOM_DEDUCT', 'Custom Deduction'
    SYSTEM_CORRECTION_ADD = 'SYSTEM_CORRECTION_ADD', 'System Reconciliation (+)'
    SYSTEM_CORRECTION_DEDUCT = 'SYSTEM_CORRECTION_DEDUCT', 'System Reconciliation (-)'
    PRODUCTION_DEDUCT = 'PRODUCTION_DEDUCT', 'Production Deduction'
    PRODUCTION_REVERSAL = 'PRODUCTION_REVERSAL', 'Production Reversal (Undo)'
    DISBURSEMENT_IN = 'DISBURSEMENT_IN', 'Disbursement Received'
    DISBURSEMENT_OUT = 'DISBURSEMENT_OUT', 'Disbursement Sent'

class Category(models.Model):
    category_name = models.CharField(max_length=20)

class BatchName(models.Model):
    name = models.CharField(max_length=100)
    date_created = models.DateTimeField(auto_now_add=True)
    is_cooked = models.BooleanField(default=False)
    cooked_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class CustomizableHeaders(models.Model):
    header = models.CharField(max_length=50)

class AbstractFoodItems(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_available = models.BooleanField(default=True)
    unit =  models.CharField(max_length=20, choices=UnitType.choices, default=UnitType.PIECES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='food_images/', null=True, blank=True)
    quantity_if_package = models.PositiveIntegerField(null=True, blank=True, default=1) #this field is to store the quantity if the customizable is a package e.g: 1 dozen eggs, 1 bag of rice etc
    price_if_package = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True) #this field is to store the price if the customizable is a package
    adjustable = models.BooleanField(default=False) #this field is to indicate if the price of the customizable can be adjusted
    self_required_quantity = models.DecimalField(max_digits=10, decimal_places=2,null=True, blank=True)
    self_quantity_in_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True, blank=True)
    alias = models.CharField(max_length=100, blank=True, null=True) #this field is to store an alternative name for the product/customizable
    pricing_type = models.CharField(
        max_length=30,
        choices=PricingType.choices,
        default=PricingType.FIXED,
    )
    array_if_fixed_variable = models.JSONField(null=True, blank=True) #this field is to store the array of prices if the pricing type is fixed & variable
    should_read_alerts = models.BooleanField(default=True)

    class Meta:
        abstract = True

class Products(AbstractFoodItems):
    type = models.CharField(
        max_length=50,
        choices=ProductType.choices,
        default=ProductType.STANDALONE,
        )
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    products_customs = models.ManyToManyField('Customizables',blank=True)
    def __str__(self):
        return self.name
    
class Customizables(AbstractFoodItems):
    customizable_header = models.ForeignKey(CustomizableHeaders, on_delete=models.CASCADE, null=True)
    def __str__(self):
        return self.name
    
class RawItems(models.Model):
    name = models.CharField(max_length=100)
    unit = models.CharField(max_length=20, choices=UnitType.choices, default=UnitType.PIECES)
    type = models.CharField(
        max_length=50,
        choices=RawItemsType.choices,
        default=RawItemsType.COUNTABLE,
        )
    description = models.TextField()
    quantity_in_stock = models.DecimalField(max_digits=10, decimal_places=2)
    unit_batch_quantity = models.DecimalField(max_digits=10, decimal_places=2) 
   # unit_batch_price = models.DecimalField(max_digits=10, decimal_places=2)#this field helps to estimate teh number of bags left of a produce, in the sense, e.g: If the unit of a bag of rice is 50kg we can divide it by the current in stock to tell the number of bags remaining. (if quantity remaining is 150, divided by 50kg means -> 3 bags of rice)
    supplied_by = models.ManyToManyField('Suppliers',related_name='supplied_raw_items', blank=True)
    reorder_level = models.PositiveIntegerField()
    should_read_alerts = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class MainStoreRawItems(models.Model):
    name = models.CharField(max_length=100)
    unit = models.CharField(max_length=20, choices=UnitType.choices, default=UnitType.PIECES)
    type = models.CharField(
        max_length=50,
        choices=RawItemsType.choices,
        default=RawItemsType.COUNTABLE,
        )
    description = models.TextField()
    quantity_in_stock = models.DecimalField(max_digits=10, decimal_places=2)
    unit_batch_quantity = models.DecimalField(max_digits=10, decimal_places=2) 
   # unit_batch_price = models.DecimalField(max_digits=10, decimal_places=2)#this field helps to estimate teh number of bags left of a produce, in the sense, e.g: If the unit of a bag of rice is 50kg we can divide it by the current in stock to tell the number of bags remaining. (if quantity remaining is 150, divided by 50kg means -> 3 bags of rice)
    supplied_by = models.ManyToManyField('Suppliers',related_name='supplied_main_store_items', blank=True)
    reorder_level = models.PositiveIntegerField()
    should_read_alerts = models.BooleanField(default=True)

    def __str__(self):
        return self.name
    
class BatchProductionRecipes(models.Model):
    batch_name = models.ForeignKey(BatchName, on_delete=models.CASCADE)
    raw_item = models.ForeignKey(RawItems, related_name="raw_item_recipes_products",  on_delete=models.CASCADE)
    quantity_required = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.batch_name.name} requires {self.quantity_required} {self.raw_item.unit} of {self.raw_item.name}"

class BatchProductionLog(models.Model):
    batch = models.ForeignKey(BatchName, on_delete=models.CASCADE, related_name='production_logs')
    multiplier = models.DecimalField(max_digits=10, decimal_places=2, help_text="Number of batches produced")
    produced_at = models.DateTimeField(auto_now_add=True)
    produced_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='batch_productions')
    is_reversed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.multiplier}x {self.batch.name} at {self.produced_at.strftime('%Y-%m-%d %H:%M')}"



class Suppliers(models.Model):
    name = models.CharField(max_length=100)
    contact_info = models.TextField()
    address = models.TextField()

    def __str__(self):
        return self.name
    

class Purchases(models.Model):
    raw_item = models.ForeignKey(MainStoreRawItems, on_delete=models.CASCADE, related_name='purchases') #We intentionally named it raw_items so as not to mess up teh frontend, in actual sense its main store raw items
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    supplier = models.ForeignKey(Suppliers, on_delete=models.SET_NULL, null=True, related_name='purchases')
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)
    purchase_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-purchase_date']

    def __str__(self):
        return f"Purchase of {self.raw_item.name} ({self.quantity} {self.raw_item.unit}) from {self.supplier.name if self.supplier else 'Unknown'} on {self.purchase_date.strftime('%Y-%m-%d')}"


class Sale(models.Model):
    sales_id = models.UUIDField(
        primary_key=False,
        default=uuid.uuid4,
        editable=False
    )
    sale_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH
    )
    specific_description = models.TextField(blank=True, null=True)
    daily_sequence_number = models.PositiveIntegerField(null=True, blank=True)
    customer = models.ForeignKey('Customer', null= True, blank=True, on_delete=models.SET_NULL, related_name='customer_sales')
    prepared_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='prepared_sales')
    processed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='processed_sales') 
    sale_status = models.CharField(
        max_length=50,
        choices=SaleStatus.choices,
        default= SaleStatus.INQUEUE
        )
    is_delivery = models.BooleanField(default=False)
    delivery_number = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"Sale #{self.id} - {self.sale_date.strftime('%Y-%m-%d %H:%M')}"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    item_type = models.CharField(max_length=20, choices=[('PRODUCT', 'Product'), ('CUSTOM', 'Custom')])
    product = models.ForeignKey(Products, null=True, blank=True, on_delete=models.SET_NULL)
    custom = models.ForeignKey(Customizables, null=True, blank=True, on_delete=models.SET_NULL)
    quantity = models.PositiveIntegerField()
    price_sold = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        constraints = [
            # Ensures no duplicate items of the same type in a sale
            models.UniqueConstraint(fields=['sale', 'product', 'custom'], name='unique_sale_item')
        ]

    def clean(self):
        # Ensure only one of product or custom is set
        if (self.product is None and self.custom is None) or (self.product and self.custom):
            raise ValidationError("Exactly one of 'product' or 'custom' must be set.")

    def save(self, *args, **kwargs):
        # Call clean() before saving
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.product or self.custom} @ {self.price_sold}"
    

class Customer(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.name


class StockAdjustment(models.Model):
    item_type = models.CharField(max_length=20, choices=[
        ('PRODUCT', 'Product'), 
        ('CUSTOM', 'Custom'), 
        ('RAW', 'Raw Item'),
        ('MAIN_STORE_RAW', 'Main Store Raw Item')
    ])
    product = models.ForeignKey(Products, null=True, blank=True, on_delete=models.CASCADE, related_name='stock_adjustments')
    custom = models.ForeignKey(Customizables, null=True, blank=True, on_delete=models.CASCADE, related_name='stock_adjustments')
    raw_item = models.ForeignKey(RawItems, null=True, blank=True, on_delete=models.CASCADE, related_name='stock_adjustments')
    main_store_raw_item = models.ForeignKey(MainStoreRawItems, null=True, blank=True, on_delete=models.CASCADE, related_name='stock_adjustments')

    adjustment_type = models.CharField(max_length=30, choices=AdjustmentType.choices)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField(blank=True, null=True)
    
    adjusted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='stock_adjustments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def clean(self):
        # Ensure only one of product, custom, or raw_item is set
        count = sum([
            self.product is not None,
            self.custom is not None,
            self.raw_item is not None,
            self.main_store_raw_item is not None
        ])
        if count != 1:
            raise ValidationError("Exactly one of 'product', 'custom', 'raw_item', or 'main_store_raw_item' must be set.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        item = self.product or self.custom or self.raw_item or self.main_store_raw_item
        return f"{self.adjustment_type} - {item} ({self.quantity})"

class Alert(models.Model):
    ALERT_TYPES = (
        ("LOW_STOCK", "Low stock"),
        ("OUT_OF_STOCK", "Out of stock"),
    )

    SEVERITY = (
        ("WARN", "Warning"),
        ("CRITICAL", "Critical"),
    )

    item_type = models.CharField(
        max_length=20, 
        choices=[
            ('PRODUCT', 'Product'), 
            ('CUSTOM', 'Custom'), 
            ('RAW', 'Raw Item'),
            ('MAIN_STORE_RAW', 'Main Store Raw Item')
        ],
        default='RAW'
    )
    raw_item = models.ForeignKey(RawItems, null=True, blank=True, on_delete=models.CASCADE, related_name='alerts')
    main_store_raw_item = models.ForeignKey(MainStoreRawItems, null=True, blank=True, on_delete=models.CASCADE, related_name='alerts')

    alert_type = models.CharField(
        max_length=20,
        choices=ALERT_TYPES
    )

    severity = models.CharField(
        max_length=10,
        choices=SEVERITY
    )

    message = models.TextField()

    # state flags
    is_active = models.BooleanField(default=True)   # problem still exists
    is_read = models.BooleanField(default=False)    # user has seen it

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_whatsapp_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def clean(self):
        # Ensure only one of product, custom, or raw_item is set
        count = sum([
            self.raw_item is not None,
            self.main_store_raw_item is not None
        ])
        if count != 1:
            raise ValidationError("Exactly one of 'raw_item', or 'main_store_raw_item' must be set.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        item = self.raw_item or self.main_store_raw_item
        return f"{self.alert_type} - {item} ({self.severity})"

class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    action = models.CharField(max_length=10) # POST, PATCH, DELETE
    endpoint = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user} - {self.action} {self.endpoint} at {self.timestamp}"
