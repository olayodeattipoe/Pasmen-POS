from rest_framework import serializers
from .models import BatchName, BatchProductionRecipes, BatchProductionLog, Category, Products, Customizables, CustomizableHeaders, RawItems, MainStoreRawItems, Sale, SaleItem, Suppliers, Purchases, StockAdjustment, Customer, Alert, ActivityLog
from django.contrib.auth.models import User, Group

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class BatchNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = BatchName
        fields = '__all__'

class BatchProductionLogSerializer(serializers.ModelSerializer):
    batch_name_display = serializers.SerializerMethodField()
    produced_by_name = serializers.SerializerMethodField()

    class Meta:
        model = BatchProductionLog
        fields = ['id', 'batch', 'batch_name_display', 'multiplier', 'produced_at', 'produced_by', 'produced_by_name', 'is_reversed']

    def get_batch_name_display(self, obj):
        return obj.batch.name if obj.batch else "Unknown"

    def get_produced_by_name(self, obj):
        return obj.produced_by.username if obj.produced_by else None


class ProductsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Products
        fields = '__all__'

class CustomizableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customizables
        fields = '__all__'

    
class CustomizableHeaderSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomizableHeaders
        fields = '__all__'

class SuppliersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Suppliers
        fields = '__all__'

class PurchasesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchases
        fields = '__all__'

class RawItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawItems
        fields = '__all__'

class MainStoreRawItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MainStoreRawItems
        fields = '__all__'
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class SaleSerializer(serializers.ModelSerializer):
    customer = serializers.SerializerMethodField()
    prepared_by = serializers.SerializerMethodField()
    processed_by = serializers.SerializerMethodField()

    class Meta:
        model = Sale

        fields = [
            'id',
            'sales_id',
            'sale_date',
            'total_amount',
            'payment_method',
            'daily_sequence_number',
            'specific_description',
            'customer',
            'prepared_by',
            'processed_by',
            'sale_status',
            'is_delivery',
            'delivery_number',
        ]

    def get_customer(self, obj):
        if obj.customer:
            return {
                "id": obj.customer.id,
                "username": obj.customer.name,
                "first_name": obj.customer.name,
                "last_name": "",
            }
        
        # Format daily sequence number as #001, #002, etc.
        seq_str = f"#{obj.daily_sequence_number:03d}" if obj.daily_sequence_number else "Guest"
        return {
            "id": None,
            "username": seq_str,
            "first_name": "Guest",
            "last_name": "",
        }


    def get_prepared_by(self, obj):
        if obj.prepared_by:
            return {
                "id": obj.prepared_by.id,
                "username": obj.prepared_by.username,
            }
        return None

    def get_processed_by(self, obj):
        if obj.processed_by:
            return {
                "id": obj.processed_by.id,
                "username": obj.processed_by.username,
            }
        return None

class SaleItemSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()
    pricing_type = serializers.SerializerMethodField()

    class Meta:
        model = SaleItem
        fields = [
            'id',
            'item_type',
            'product',
            'custom',
            'item_name',
            'pricing_type',
            'quantity',
            'price_sold',
        ]

    def get_item_name(self, obj):
        if obj.product:
            return obj.product.name
        if obj.custom:
            return obj.custom.name
        return None

    def get_pricing_type(self, obj):
        # Return the pricing type from the related product or custom item
        if obj.product:
            return obj.product.pricing_type
        if obj.custom:
            return obj.custom.pricing_type
        return None


class AdminCreateUserSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    group = serializers.CharField()

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            is_active=True
        )
        user.set_password(validated_data["password"])
        user.save()

        group = Group.objects.get(name=validated_data["group"])
        user.groups.add(group)

        return user

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'groups', 'date_joined', 'last_login']
    

class StockAdjustmentSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()
    adjusted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockAdjustment
        fields = '__all__'
        read_only_fields = ['created_at', 'adjusted_by']

    def get_item_name(self, obj):
        item = obj.product or obj.custom or obj.raw_item or obj.main_store_raw_item
        return item.name if item else None

    def get_adjusted_by_name(self, obj):
        return obj.adjusted_by.username if obj.adjusted_by else None

class AlertSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = '__all__'

    def get_item_name(self, obj):
        item = obj.raw_item or obj.main_store_raw_item
        return item.name if item else "Unknown"

class ActivityLogSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'action', 'endpoint', 'timestamp', 'details', 'ip_address']

    def get_user(self, obj):
        if obj.user:
            return obj.user.username
        return "System/Unknown"

class BatchProductionRecipesSerializer(serializers.ModelSerializer):
    batch_name_display = serializers.CharField(source='batch_name.name', read_only=True)
    raw_item_name_display = serializers.CharField(source='raw_item.name', read_only=True)
    unit_display = serializers.CharField(source='raw_item.unit', read_only=True)

    class Meta:
        model = BatchProductionRecipes
        fields = [
            'id',
            'batch_name',
            'batch_name_display',
            'raw_item',
            'raw_item_name_display',
            'unit_display',
            'quantity_required'
        ]
