from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import BatchProductionRecipes, Category, Products, CustomizableHeaders, Customizables, RawItems, Sale, SaleItem, SaleStatus, Suppliers, Purchases, StockAdjustment, Alert, AdjustmentType, ActivityLog, Customer, MainStoreRawItems, BatchName, BatchProductionLog
from rest_framework import status
from django.db import transaction
from django.utils.dateparse import parse_date
from django.db.models.functions import Cast, TruncDay
from django.db.models import CharField, F, Sum, Q, Count, Case, When, DecimalField
from rest_framework.pagination import PageNumberPagination
from .serializers import BatchProductionRecipesSerializer, CategorySerializer, ProductsSerializer, CustomizableHeaderSerializer, CustomizableSerializer, RawItemsSerializer, MainStoreRawItemsSerializer, SaleSerializer, SaleItemSerializer, SuppliersSerializer, PurchasesSerializer, UserSerializer, AdminCreateUserSerializer, StockAdjustmentSerializer, AlertSerializer, ActivityLogSerializer, BatchNameSerializer, BatchProductionLogSerializer
from django.contrib.auth.models import User
from datetime import timedelta, date
import uuid
import requests

import logging
from decimal import Decimal
from datetime import datetime, time
from django.utils.timezone import make_aware, now
from .tasks import send_event_notification

# Configure logging for inventory deductions
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# File handler for inventory deduction logs
file_handler = logging.FileHandler('inventory_deductions.log')
file_handler.setLevel(logging.INFO)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Formatting
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Add handlers to logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Create your views here.
LOCAL_BRANCH_URL = "api.frontline-management.ngrok.pizza"

def deduct_inventory_for_sale(sale):
    """
    Deduct inventory for all items in a sale.
    Handles:
    - Products with self-stock
    - Products with recipe-based raw materials
    - Customizations with self-stock
    - Customizations with recipe-based raw materials
    """
    logger.info(f"Starting inventory deduction for Sale ID: {sale.id}")
    
    # Get all sale items for this sale
    sale_items = SaleItem.objects.filter(sale=sale).select_related('product', 'custom')
    
    for sale_item in sale_items:
        if sale_item.item_type == 'PRODUCT' and sale_item.product:
            product = sale_item.product
            quantity_sold = sale_item.quantity
            
            logger.info(f"Processing Product: {product.name} | Qty: {quantity_sold}")
            
            # Handle product self-stock deduction
            if product.self_required_quantity:
                # Initialize stock to 0 if None to allow negative tracking
                if product.self_quantity_in_stock is None:
                    product.self_quantity_in_stock = 0
                    product.save(update_fields=['self_quantity_in_stock'])
                    product.refresh_from_db()
                
                quantity_to_deduct = Decimal(quantity_sold) * Decimal(product.self_required_quantity)

                # Use F() expression for atomic update (allows negative values)
                product.self_quantity_in_stock = F('self_quantity_in_stock') - quantity_to_deduct
                product.save(update_fields=['self_quantity_in_stock'])
                logger.info(f"→ Deducting {quantity_to_deduct} from {product.name} self stock.")
                
        elif sale_item.item_type == 'CUSTOM' and sale_item.custom:
            custom_item = sale_item.custom
            quantity_sold = sale_item.quantity
            
            logger.info(f"Processing Customization: {custom_item.name} | Qty: {quantity_sold}")
            
            # Handle customization self-stock deduction
            if custom_item.self_required_quantity:
                # Initialize stock to 0 if None to allow negative tracking
                if custom_item.self_quantity_in_stock is None:
                    custom_item.self_quantity_in_stock = 0
                    custom_item.save(update_fields=['self_quantity_in_stock'])
                    custom_item.refresh_from_db()
                
                quantity_to_deduct = Decimal(quantity_sold) * Decimal(custom_item.self_required_quantity)
                
                # Use F() expression for atomic update (allows negative values)
                custom_item.self_quantity_in_stock = F('self_quantity_in_stock') - quantity_to_deduct
                custom_item.save(update_fields=['self_quantity_in_stock'])
                logger.info(f"→ Deducting {quantity_to_deduct} from {custom_item.name} self stock.")
                
    logger.info(f"✅ Inventory deduction completed for Sale ID: {sale.id}")

def perform_order_completion(sale):
    """ Helper function to mark a sale as COMPLETED and deduct inventory items. """
    # Deduct inventory for all items in this sale
    deduct_inventory_for_sale(sale)
    
    # Mark the order as completed
    sale.sale_status = SaleStatus.COMPLETED
    sale.save(update_fields=['sale_status'])
    
    # High-Value Sale Alert
    try:
        amount = float(sale.total_amount)
    except (TypeError, ValueError):
        amount = 0.0  # or handle differently

    if amount >= 500:
        msg = f"🔥 BIG SALE: Sale #{sale.daily_sequence_number or sale.id} - GHS {sale.total_amount}! CUSTOMER: {sale.customer_name or 'Cash'}. Action by: {sale.created_by.username if sale.created_by else 'System'}."
        send_event_notification.delay(msg)
    
    logger.info(f"Order {sale.id} marked as completed successfully")


@api_view(['GET'])
def get_categories(request):
    categories = Category.objects.all().order_by('id') 
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['PATCH', 'DELETE'])
def category_detail(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({"detail": "Category not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        serializer = CategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'DELETE':
        category.delete()
        return Response({"detail": "Category deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

@api_view(["POST"])
def add_category(request):
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def add_product(request):
    serializer = ProductsSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        print("✅ Product added successfully", flush=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # Only reaches here when invalid
    print("❌ Serializer errors:", flush=True)
    print(serializer.errors, flush=True)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_product_by_category(request,category_id):
    products = Products.objects.filter(category__id=category_id)
    serializer = ProductsSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['PUT', 'PATCH', 'DELETE'])
def update_product(request, product_id):
    try:
        product = Products.objects.get(id=product_id)
    except Products.DoesNotExist:
        return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = ProductsSerializer(product, data=request.data)
        if serializer.is_valid():
            old_price = product.price
            serializer.save()
            new_price = product.price
            if old_price != new_price:
                msg = f"💰 PRICE CHANGE: {product.name} updated from GHS {old_price} to GHS {new_price}. Action by: {request.user.username if request.user.is_authenticated else 'System'}."
                send_event_notification.delay(msg)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'PATCH':
        serializer = ProductsSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            old_price = product.price
            serializer.save()
            new_price = product.price
            if old_price != new_price:
                msg = f"💰 PRICE CHANGE: {product.name} updated from GHS {old_price} to GHS {new_price}. Action by: {request.user.username if request.user.is_authenticated else 'System'}."
                send_event_notification.delay(msg)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    if request.method == 'DELETE':
        product.delete()
        return Response({"detail": "Product deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

    return Response({"detail": "Method not allowed."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['GET'])
def get_customizable_headers(request):
    customizable_headers =  CustomizableHeaders.objects.all().order_by('id')
    serializer = CustomizableHeaderSerializer(customizable_headers, many = True)
    return Response(serializer.data)

@api_view(['POST'])
def add_customizable_header(request):
    serializer = CustomizableHeaderSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        print("✅ Customizable Header added successfully", flush=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # Only reaches here when invalid
    print("❌ Serializer errors:", flush=True)
    print(serializer.errors, flush=True)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'DELETE'])
def get_customizables_by_header(request, customizable_header_id):
    try:
        header = CustomizableHeaders.objects.get(id=customizable_header_id)
    except CustomizableHeaders.DoesNotExist:
        return Response({"detail": "Header not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        header.delete()
        return Response({"detail": "Header deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

    customizables = Customizables.objects.filter(customizable_header=header)
    serializer = CustomizableSerializer(customizables, many=True)
    return Response(serializer.data)

@api_view(['PUT', 'PATCH', 'DELETE'])
def update_customizable(request, customizable_id):
    try:
        customizable = Customizables.objects.get(id=customizable_id)
    except Customizables.DoesNotExist:
        return Response({"detail": "Customizable not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = CustomizableSerializer(customizable, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'PATCH':
        serializer = CustomizableSerializer(customizable, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'DELETE':
        customizable.delete()
        return Response({"detail": "Customizable deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    
    return Response({"detail": "Method not allowed."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    
@api_view(['POST'])
def add_customizable(request):
    serializer = CustomizableSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        print("✅ Customizable added successfully", flush=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # Only reaches here when invalid
    print("❌ Serializer errors:", flush=True)
    print(serializer.errors, flush=True)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
def pair_product_custom(request, product_id):
    try:
        product = Products.objects.get(id=product_id)
    except Products.DoesNotExist:
        return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        serializer = ProductsSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_all_products(request):
    products = Products.objects.all().order_by('id')
    serializer = ProductsSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_all_customizables(request):
    customizables = Customizables.objects.all().order_by('id')
    serializer = CustomizableSerializer(customizables, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_all_rawitems(request):
    rawItems = RawItems.objects.all().order_by('id')
    serializer = RawItemsSerializer(rawItems, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def add_rawItem(request):
    serializer = RawItemsSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        print("✅ Raw Item added successfully", flush=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # Only reaches here when invalid
    print("❌ Serializer errors:", flush=True)
    print(serializer.errors, flush=True)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['PUT','PATCH'])
def update_rawItem(request, rawItem_id):
    try:
        rawItem = RawItems.objects.get(id=rawItem_id)
    except RawItems.DoesNotExist:
        return Response({"detail": "Raw Item not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = RawItemsSerializer(rawItem, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'PATCH':
        serializer = RawItemsSerializer(rawItem, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_corresponding_branch_raw_item_id(request, rawItem_name):
    try:
        rawItem = RawItems.objects.get(name=rawItem_name)
    except RawItems.DoesNotExist:
        return Response({"detail": "Raw Item not found."}, status=status.HTTP_404_NOT_FOUND)

    corresponding_branch_raw_id = rawItem.id
    return Response({"corresponding_branch_raw_id": corresponding_branch_raw_id}, status=status.HTTP_200_OK)

# Put this somewhere in views.py or a utils/services file
def get_corresponding_branch_raw_item_id_internal(rawItem_name):
    try:
        return RawItems.objects.get(name=rawItem_name).id
    except RawItems.DoesNotExist:
        return None
        
# Put this in views.py or a utils/services file
def adjust_stock_internal(payload):
    """
    Internal version of adjust_stock that can be called directly
    instead of making an HTTP request.
    """
    from rest_framework.request import Request
    from rest_framework.test import APIRequestFactory

    # Simulate a request to your existing adjust_stock function
    factory = APIRequestFactory()
    request_method = payload.get("method", "POST")
    req = factory.post("/inventory/adjuststock/", payload, format='json')
    
    # If you need user info for logging:
    req.user = payload.get("user", None)

    # Call the existing adjust_stock view directly
    from .views import adjust_stock  # your existing endpoint
    response = adjust_stock(req)
    return response
    
def add_raw_item_internal(payload):
    serializer = RawItemsSerializer(data=payload)
    if serializer.is_valid():
        raw_item = serializer.save()
        # mimic Response object minimally for disburse_rawItem
        class ResponseObject:
            status_code = 201
            data = {"id": raw_item.id}
        return ResponseObject()
    else:
        class ResponseObject:
            status_code = 400
            data = serializer.errors
        return ResponseObject()

@api_view(['PUT', 'PATCH'])
def disberse_rawItem(request, rawItem_id, branch_url):
    try:
        rawItem = MainStoreRawItems.objects.get(id=rawItem_id)
    except MainStoreRawItems.DoesNotExist:
        return Response({"detail": "Main Store Raw Item not found."}, status=status.HTTP_404_NOT_FOUND)

    quantity_to_disburse = request.data.get("quantity")
    if quantity_to_disburse is None:
        return Response({"detail": "Quantity to disburse is required."}, status=400)

    branch_url = branch_url.rstrip("/")
    logger.info(f"Branch URL received: {branch_url}")

    corresponding_branch_raw_id = None
    status_code = None
    branch_op_response = None

    # ---------------- STEP 1: GET OR CREATE CORRESPONDING BRANCH ITEM ----------------
    if branch_url == LOCAL_BRANCH_URL:
        # Internal self-call
        corresponding_branch_raw_id = get_corresponding_branch_raw_item_id_internal(rawItem.name)
        if corresponding_branch_raw_id is None:
            # Item doesn't exist locally → create it
            create_payload = {
                "name": rawItem.name,
                "unit": rawItem.unit,
                "type": rawItem.type,
                "description": rawItem.description,
                "quantity_in_stock": 0,
                "unit_batch_quantity": float(rawItem.unit_batch_quantity or 0),
                "reorder_level": rawItem.reorder_level,
                "should_read_alerts": rawItem.should_read_alerts,
            }
            create_response = add_raw_item_internal(create_payload)
            if create_response.status_code in (200, 201):
                corresponding_branch_raw_id = create_response.data["id"]
                status_code = 200
            else:
                return Response({
                    "detail": "Failed to create local raw item",
                    "errors": create_response.data
                }, status=500)
        else:
            status_code = 200
    else:
        # External branch via HTTP
        branch_check_url = f"http://{branch_url}/inventory/getcorrespondingbranchrawitemid/{rawItem.name}/"
        logger.info(f"Constructed branch check URL: {branch_check_url}")
        try:
            branch_response = requests.get(branch_check_url, timeout=5)
            status_code = branch_response.status_code
            if status_code == 200:
                corresponding_branch_raw_id = branch_response.json().get("corresponding_branch_raw_id")
        except requests.exceptions.RequestException as e:
            return Response({"detail": f"Branch unreachable: {str(e)}"}, status=500)

    # ---------------- STEP 2: ADJUST STOCK ----------------
    if status_code == 200:
        # Item exists → adjust stock
        adjust_payload = {
            "item_type": "RAW",
            "item_id": corresponding_branch_raw_id,
            "adjustment_type": "DISBURSEMENT_IN",
            "quantity": float(quantity_to_disburse),
            "reason": f"Disbursement received from main store ({rawItem.name})",
        }
        if branch_url == LOCAL_BRANCH_URL:
            branch_op_response = adjust_stock_internal(adjust_payload)
        else:
            adjust_url = f"http://{branch_url}/inventory/adjuststock/"
            branch_op_response = requests.post(adjust_url, json=adjust_payload)

    elif status_code == 404:
        # Item does not exist → create then adjust
        payload = {
            "name": rawItem.name,
            "unit": rawItem.unit,
            "type": rawItem.type,
            "description": rawItem.description,
            "quantity_in_stock": 0,
            "unit_batch_quantity": float(rawItem.unit_batch_quantity or 0),
            "reorder_level": rawItem.reorder_level,
            "should_read_alerts": rawItem.should_read_alerts,
        }
        if branch_url == LOCAL_BRANCH_URL:
            create_response = add_raw_item_internal(payload)
        else:
            add_item_url = f"http://{branch_url}/inventory/addrawitem/"
            create_response = requests.post(add_item_url, json=payload)

        if create_response.status_code in (200, 201):
            new_item_id = create_response.data["id"] if branch_url == LOCAL_BRANCH_URL else create_response.json().get("id")
            adjust_payload = {
                "item_type": "RAW",
                "item_id": new_item_id,
                "adjustment_type": "DISBURSEMENT_IN",
                "quantity": float(quantity_to_disburse),
                "reason": f"Initial disbursement received from main store ({rawItem.name})",
            }
            if branch_url == LOCAL_BRANCH_URL:
                branch_op_response = adjust_stock_internal(adjust_payload)
            else:
                adjust_url = f"http://{branch_url}/inventory/adjuststock/"
                branch_op_response = requests.post(adjust_url, json=adjust_payload)
        else:
            return Response({
                "detail": "Failed to create new branch item",
                "errors": create_response.data if branch_url == LOCAL_BRANCH_URL else create_response.json()
            }, status=500)
    else:
        return Response({"detail": "Error contacting branch"}, status=500)

    # ---------------- STEP 3: CHECK BRANCH OPERATION ----------------
    if branch_op_response.status_code not in (200, 201):
        error_data = branch_op_response.data if branch_url == LOCAL_BRANCH_URL else branch_op_response.json()
        return Response({"detail": "Branch operation failed", "branch_error": error_data},
                        status=branch_op_response.status_code)

    # ---------------- STEP 4: DEDUCT MAIN STORE STOCK ----------------
    try:
        with transaction.atomic():
            rawItem.refresh_from_db()
            qty = Decimal(str(quantity_to_disburse))
            rawItem.quantity_in_stock = (rawItem.quantity_in_stock or Decimal('0')) - qty
            rawItem.save(update_fields=['quantity_in_stock'])

            StockAdjustment.objects.create(
                item_type='MAIN_STORE_RAW',
                main_store_raw_item=rawItem,
                adjustment_type='DISBURSEMENT_OUT',
                quantity=qty,
                reason=f"Disbursed to branch at {branch_url}",
                adjusted_by=request.user if request.user.is_authenticated else None
            )

            # Send WhatsApp Notification
            msg = f"📤 DISBURSEMENT: {rawItem.name} ({qty} {rawItem.unit}) sent to Branch ({branch_url})."
            send_event_notification.delay(msg)
    except Exception as e:
        logger.error(f"CRITICAL: Branch updated but main store deduction failed for RawItem {rawItem_id}. Error: {str(e)}")
        return Response({
            "detail": "Branch updated but main store deduction failed — manual correction required.",
            "branch_response": branch_op_response.data if branch_url == LOCAL_BRANCH_URL else branch_op_response.json(),
            "error": str(e),
        }, status=500)

    return Response({
        "detail": "Disbursement successful. Branch updated and main store stock reduced.",
        "branch_response": branch_op_response.data if branch_url == LOCAL_BRANCH_URL else branch_op_response.json(),
        "new_main_store_stock": float(rawItem.quantity_in_stock),
    }, status=branch_op_response.status_code)
    

@api_view(['GET'])
def get_all_main_store_rawItems(request):
    rawItems = MainStoreRawItems.objects.all().order_by('id')
    serializer = MainStoreRawItemsSerializer(rawItems, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def add_main_store_rawItem(request):
    serializer = MainStoreRawItemsSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        print("✅ Main Store Raw Item added successfully", flush=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    print("❌ Serializer errors:", flush=True)
    print(serializer.errors, flush=True)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT','PATCH'])
def update_main_store_rawItem(request, rawItem_id):
    try:
        rawItem = MainStoreRawItems.objects.get(id=rawItem_id)
    except MainStoreRawItems.DoesNotExist:
        return Response({"detail": "Main Store Raw Item not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = MainStoreRawItemsSerializer(rawItem, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'PATCH':
        serializer = MainStoreRawItemsSerializer(rawItem, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_all_rawItems(request):
    rawItems = RawItems.objects.all().order_by('id')
    serializer = RawItemsSerializer(rawItems, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def add_sale_saleItem(request):
    user = request.user
    print("User",user)
    order_data = request.data


    with transaction.atomic():
        # Get count of sales today to determine sequence number
        today = now().date()
        daily_count = Sale.objects.filter(sale_date__date=today).count()
        next_sequence = daily_count + 1

        sale = Sale.objects.create(
            total_amount=order_data['total_amount'],
            payment_method=order_data['payment_method'],
            specific_description=order_data.get('specific_description'),
            daily_sequence_number=next_sequence,
            processed_by=user,
            is_delivery=order_data.get('is_delivery', False),
            delivery_number=order_data.get('delivery_number')
        )

        for basket in order_data['baskets']:
            product = Products.objects.get(id=basket['product_id'])

            SaleItem.objects.create(
                sale=sale,
                item_type='PRODUCT',
                product=product,
                quantity=basket['product_quantity'],
                price_sold=basket['product_price_sold']
            )

            for custom in basket.get('customizations', []):
                custom_item = Customizables.objects.get(id=custom['custom_id'])

                SaleItem.objects.create(
                    sale=sale,
                    item_type='CUSTOM',
                    custom=custom_item,
                    quantity=custom['custom_quantity'],
                    price_sold=custom['custom_price_sold']
                )
        
        # Automatically complete the order since printing is now handled, 
        # bypassing the kitchen/server queue requirement.
        perform_order_completion(sale)

    return Response({"Order Number": next_sequence}, status=201)




class SalePagination(PageNumberPagination):
    page_size = 10              # default per page
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
def get_filtered_sales(request):
    # Base queryset
    sales = Sale.objects.all().order_by('-sale_date')

    # Optional filters
    start_date = request.GET.get('start_date')  # e.g. 2026-01-01
    end_date = request.GET.get('end_date')      # e.g. 2026-01-18

    if start_date:
        sales = sales.filter(sale_date__date__gte=parse_date(start_date))
    if end_date:
        sales = sales.filter(sale_date__date__lte=parse_date(end_date))

    # Filter by user (either prepared_by or processed_by)
    user_id = request.GET.get('user_id')
    if user_id:
        sales = sales.filter(Q(prepared_by_id=user_id) | Q(processed_by_id=user_id))

    # Additive filters for server and admin by username
    prepared_by = request.GET.get('prepared_by')
    if prepared_by:
        sales = sales.filter(prepared_by__username__icontains=prepared_by)
    
    processed_by = request.GET.get('processed_by')
    if processed_by:
        sales = sales.filter(processed_by__username__icontains=processed_by)

    # Filter by status (accept both 'status' and 'sale_status')
    status_param = request.GET.get('status') or request.GET.get('sale_status')
    if status_param and status_param != 'all':
        sales = sales.filter(sale_status=status_param)

    # Filter by payment method
    payment_method = request.GET.get('payment_method')
    if payment_method and payment_method != 'all':
        sales = sales.filter(payment_method=payment_method)

    # Search filter (by sales_id or description)
    search = request.GET.get('search')
    if search:
        # Check if the search term is strictly numeric (Order Number)
        if search.isdigit():
            # If numeric, search exclusively by daily_sequence_number to avoid UUID noise
            sales = sales.filter(daily_sequence_number=int(search))
        else:
            # If not pure digits, search by customer and description
            # We also keep string-based matching for daily_sequence_number to support formatted searches like "001"
            sales = sales.annotate(
                seq_str=Cast('daily_sequence_number', CharField())
            ).filter(
                Q(specific_description__icontains=search) | 
                Q(customer__name__icontains=search) |
                Q(seq_str__icontains=search)
            )

    # Calculate totals - Only COMPLETED sales account for "money"
    completed_sales = sales.filter(sale_status='COMPLETED')
    total_sales_volume = completed_sales.aggregate(total=Sum('total_amount'))['total'] or 0
    total_orders_count = sales.count() # Keep total orders count as all filtered orders

    # Pagination
    paginator = SalePagination()
    page = paginator.paginate_queryset(sales, request)

    serializer = SaleSerializer(page, many=True)
    
    # Get standard paginated response
    response_data = paginator.get_paginated_response(serializer.data).data

    # Add custom aggregates to response
    response_data['total_sales_volume'] = total_sales_volume
    response_data['total_orders_count'] = total_orders_count
    response_data['completed_orders_count'] = completed_sales.count()
    
    return Response(response_data)



@api_view(['GET'])
def get_sales_analytics(request):
    # Filter Sales by Date and Status (COMPLETED only)
    sales = Sale.objects.filter(sale_status='COMPLETED')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    if start_date:
        sales = sales.filter(sale_date__date__gte=parse_date(start_date))
    if end_date:
        sales = sales.filter(sale_date__date__lte=parse_date(end_date))

    # Base SaleItems from filtered sales
    sale_items = SaleItem.objects.filter(sale__in=sales)

    # Products Aggregation
    product_stats = (
        sale_items.filter(item_type='PRODUCT')
        .values('product_id', 'product__name', 'product__image')
        .annotate(
            total_qty=Sum('quantity'),
            total_revenue=Sum(
                Case(
                    When(product__pricing_type__in=['VAR', 'FIX_VAR'], then=F('price_sold')),
                    default=F('quantity') * F('price_sold'),
                    output_field=DecimalField()
                )
            ) 
        )
    )

    # Customs Aggregation
    custom_stats = (
        sale_items.filter(item_type='CUSTOM')
        .values('custom_id', 'custom__name', 'custom__image')
        .annotate(
            total_qty=Sum('quantity'),
            total_revenue=Sum(
                Case(
                    When(custom__pricing_type__in=['VAR', 'FIX_VAR'], then=F('price_sold')),
                    default=F('quantity') * F('price_sold'),
                    output_field=DecimalField()
                )
            )
        )
    )

    results = []
    for p in product_stats:
        results.append({
            'id': p['product_id'],
            'name': p['product__name'],
            'image': p['product__image'],
            'type': 'Product',
            'quantity': p['total_qty'] or 0,
            'revenue': p['total_revenue'] or 0
        })

    for c in custom_stats:
        results.append({
            'id': c['custom_id'],
            'name': c['custom__name'],
            'image': c['custom__image'],
            'type': 'Custom',
            'quantity': c['total_qty'] or 0,
            'revenue': c['total_revenue'] or 0
        })

    results.sort(key=lambda x: x['revenue'], reverse=True)
    return Response(results)

@api_view(['GET'])
def get_revenue_trend(request):
    days = int(request.GET.get('days', 7))
    end_date = date.today()
    start_date = end_date - timedelta(days=days-1)
    
    # Get all completed sales in range
    sales = Sale.objects.filter(
        sale_status='COMPLETED',
        sale_date__date__gte=start_date,
        sale_date__date__lte=end_date
    )
    
    # Aggregate by day
    daily_stats = (
        sales.annotate(day=TruncDay('sale_date'))
        .values('day')
        .annotate(revenue=Sum('total_amount'))
        .order_by('day')
    )
    
    # Fill in gaps (dates with 0 sales)
    stats_dict = {s['day'].date(): float(s['revenue']) for s in daily_stats}
    results = []
    
    for i in range(days):
        current_day = start_date + timedelta(days=i)
        results.append({
            'name': current_day.strftime('%a'), # Mon, Tue...
            'date': current_day.strftime('%Y-%m-%d'),
            'value': stats_dict.get(current_day, 0.0)
        })
        
    return Response(results)


@api_view(['GET'])
def get_current_user_info(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "groups": [g.name for g in user.groups.all()]
    })


@api_view(['GET'])
def get_next_kitchen_order(request):
    user = request.user  # kitchen staff
    
    # 1. Check if user already has a pending order (Resume functionality)
    # This happens outside the atomic block for read efficiency, but we'll double check inside if needed 
    # (though typically strict consistency for 'my own order' is less critical than queue race conditions, 
    # but let's be safe and simple).
    
    # We can just check normally first.
    existing_order = Sale.objects.filter(
        prepared_by=user, 
        sale_status=SaleStatus.PROCESSING
    ).first()
    
    if existing_order:
        logger.info(f"User {user.username} resuming Order #{existing_order.id}")
        serializer = SaleSerializer(existing_order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # 2. If no existing order, try to claim one from queue
    with transaction.atomic():
        # Re-check inside transaction just in case of weird race (unlikely for single user but safe)
        # existing_order_lock = Sale.objects.select_for_update().filter(prepared_by=user, sale_status=SaleStatus.PROCESSING).first()
        # if existing_order_lock: ... (optional paranoia)
        
        next_sale = (
            Sale.objects
            .select_for_update(skip_locked=True)
            .filter(sale_status=SaleStatus.INQUEUE)
            .order_by('sale_date')
            .first()
        )

        if not next_sale:
            return Response(
                {"detail": "No orders in queue"},
                status=status.HTTP_204_NO_CONTENT
            )

        # Move order out of queue immediately
        next_sale.sale_status = SaleStatus.PROCESSING
        next_sale.prepared_by = user
        next_sale.save(update_fields=['sale_status', 'prepared_by'])

    serializer = SaleSerializer(next_sale)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_completed_orders(request):
    user = request.user
    
    # Filter for completed orders where the user was involved (prepared or processed)
    # Just filtering by prepared_by for kitchen staff view typically
    sales = Sale.objects.filter(
        sale_status=SaleStatus.COMPLETED,
        prepared_by=user
    ).order_by('-sale_date')[:50] # Limit to last 50 for performance

    serializer = SaleSerializer(sales, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
def mark_order_as_completed(request, sales_id):
    user = request.user  # cashier / system / kitchen staff

    # Use atomic block for the ENTIRE operation including the fetch to ensure locking works
    try:
        with transaction.atomic():
            # Get the sale object with lock to prevent race conditions (double completion)
            try:
                sale = Sale.objects.select_for_update(nowait=False).get(
                    id=sales_id,
                    sale_status__in=[SaleStatus.PROCESSING, SaleStatus.INQUEUE]
                )
            except Sale.DoesNotExist:
                return Response(
                    {
                        "detail": "Order not found, not in processing state, or already completed"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use the shared completion logic
            perform_order_completion(sale)
            
        return Response(
            {"detail": "Order marked as completed and inventory updated"},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        logger.error(f"Error processing order completion for Sale ID {sales_id}: {str(e)}")
        # If it's a specific DB error like deadlock, it might be worth specific handling, 
        # but generic 500 is roughly correct for unhandled exceptions.
        return Response(
            {"detail": f"Error processing order: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
def update_sale_status(request, sales_id):
    """
    Update the status of a sales order.
    Allows changing status to 'INQUEUE' or 'CANCELLED'.
    Does NOT allow modifying orders that are already 'COMPLETED'.
    """
    try:
        with transaction.atomic():
            # Get sale with lock
            try:
                sale = Sale.objects.select_for_update(nowait=False).get(id=sales_id)
            except Sale.DoesNotExist:
                return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

            # Removed constraint to allow transitioning from COMPLETED (e.g. to CANCELLED)
            # as requested by user.

            new_status = request.data.get('status')
            
            if new_status == 'INQUEUE':
                sale.sale_status = SaleStatus.INQUEUE
                sale.prepared_by = None # Reset prepared_by as requested
                sale.save(update_fields=['sale_status', 'prepared_by'])
                logger.info(f"Order {sales_id} moved back to INQUEUE and unassigned.")
            
            elif new_status == 'CANCELLED':
                sale.sale_status = SaleStatus.CANCELLED
                sale.save(update_fields=['sale_status'])
                logger.info(f"Order {sales_id} marked as CANCELLED.")
                
                # Send WhatsApp Notification
                msg = f"❌ ORDER CANCELLED: Sale #{sale.daily_sequence_number or sale.id}. Total: GHS {sale.total_amount}."
                send_event_notification.delay(msg)
                
            else:
                return Response(
                    {"detail": "Invalid status update requested."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"detail": f"Order status updated to {new_status}"},
                status=status.HTTP_200_OK
            )

    except Exception as e:
        logger.error(f"Error updating sale status for ID {sales_id}: {str(e)}")
        return Response(
            {"detail": f"Error updating order: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_sale_item(request, sales_id):
    saleItem = SaleItem.objects.filter(sale=sales_id)
    serializer = SaleItemSerializer(saleItem, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def add_supplier(request):
    serializer = SuppliersSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def add_purchase(request):
    serializer = PurchasesSerializer(data=request.data)
    
    if serializer.is_valid():
        with transaction.atomic():
            # Save the purchase
            purchase = serializer.save()
            
            # Update stock
            main_store_item = purchase.raw_item
            if hasattr(main_store_item, 'quantity_in_stock'):
                main_store_item.quantity_in_stock += purchase.quantity
            else:
                main_store_item.quantity_in_stock = purchase.quantity
            main_store_item.save()
            
            # Send WhatsApp Notification
            msg = f"✅ PURCHASE RECORDED: {main_store_item.name} (+{purchase.quantity} {main_store_item.unit}). Supplier: {purchase.supplier.name if purchase.supplier else 'Unknown'}. Total Cost: GHS {purchase.total_cost}."
            send_event_notification.delay(msg)
        
        return Response(PurchasesSerializer(purchase).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_all_suppliers(request):
    suppliers = Suppliers.objects.all().order_by('id')
    serializer = SuppliersSerializer(suppliers, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_all_purchases(request):
    queryset = Purchases.objects.all().order_by('-purchase_date')
    
    # Filter by date range
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    if start_date:
        queryset = queryset.filter(purchase_date__gte=start_date)
    if end_date:
        queryset = queryset.filter(purchase_date__lte=end_date)
        
    # Filter by main store item ID
    main_store_item_id = request.GET.get('main_store_item') or request.GET.get('raw_item')
    if main_store_item_id:
        queryset = queryset.filter(raw_item_id=main_store_item_id)

    # Filter by Supplier ID
    supplier_id = request.GET.get('supplier')
    if supplier_id:
        queryset = queryset.filter(supplier_id=supplier_id)
    
    # Search by raw item name (partial match, case-insensitive)
    search = request.GET.get('search')
    if search:
        queryset = queryset.filter(raw_item__name__icontains=search)
    
    # Calculate totals
    total_quantity = queryset.aggregate(total_qty=Sum('quantity'))['total_qty'] or 0
    total_cost_sum = queryset.aggregate(total_cost=Sum('total_cost'))['total_cost'] or 0

    # Pagination
    paginator = SalePagination()
    page = paginator.paginate_queryset(queryset, request)
    
    serializer = PurchasesSerializer(page, many=True)
    
    # Get standard paginated response
    response_data = paginator.get_paginated_response(serializer.data).data

    # Add custom aggregates to response
    response_data['total_quantity'] = total_quantity
    response_data['total_cost'] = total_cost_sum
    
    return Response(response_data)


@api_view(["POST"])
def admin_create_user(request):
    serializer = AdminCreateUserSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        
        # WhatsApp Notification for New User
        group = user.groups.first().name if user.groups.exists() else "No Group"
        msg = f"🆕 NEW USER ACCESS: {user.username} added to {group}. Action by: {request.user.username if request.user.is_authenticated else 'System'}."
        send_event_notification.delay(msg)
        
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "group": group
            },
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_users(request):
    queryset = User.objects.all().order_by('-date_joined')
    
    # Search by username
    search = request.GET.get('search')
    if search:
        queryset = queryset.filter(username__icontains=search)

    # Filter by Group
    group_name = request.GET.get('group')
    if group_name and group_name != 'all':
        queryset = queryset.filter(groups__name=group_name)

    # Pagination
    paginator = PageNumberPagination()
    paginator.page_size = 10
    page = paginator.paginate_queryset(queryset, request)

    serializer = UserSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
def adjust_stock(request):
    """
    Adjust stock for Products, Customs, or Raw Items.
    Automatically updates the appropriate stock field based on adjustment type.
    """
    try:
        item_type = request.data.get('item_type')
        item_id = request.data.get('item_id')
        adjustment_type = request.data.get('adjustment_type')
        quantity = Decimal(str(request.data.get('quantity', 0)))
        reason = request.data.get('reason', '')
        
        # Validate required fields
        if not all([item_type, item_id, adjustment_type, quantity]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the item based on type
        item = None
        stock_field = None
        
        if item_type == 'PRODUCT':
            item = Products.objects.get(id=item_id)
            stock_field = 'self_quantity_in_stock'
        elif item_type == 'CUSTOM':
            item = Customizables.objects.get(id=item_id)
            stock_field = 'self_quantity_in_stock'
        elif item_type == 'RAW':
            item = RawItems.objects.get(id=item_id)
            stock_field = 'quantity_in_stock'
        elif item_type == 'MAIN_STORE_RAW':
            item = MainStoreRawItems.objects.get(id=item_id)
            stock_field = 'quantity_in_stock'
        else:
            return Response({"error": "Invalid item_type"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Determine if this is an addition or deduction
        is_addition = adjustment_type in ['CUSTOM_ADD', 'SYSTEM_CORRECTION_ADD', 'DISBURSEMENT_IN']
        is_deduction = adjustment_type in ['WASTAGE', 'SPOILAGE', 'LEFTOVER', 'CUSTOM_DEDUCT', 'SYSTEM_CORRECTION_DEDUCT', 'DISBURSEMENT_OUT']
        
        if not (is_addition or is_deduction):
            return Response({"error": "Invalid adjustment_type"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate new stock
        current_stock = getattr(item, stock_field) or Decimal('0')
        
        if is_addition:
            new_stock = current_stock + quantity
        else:  # deduction
            new_stock = current_stock - quantity
            
            # Prevent negative stock
            if new_stock < 0:
                return Response({
                    "error": f"Insufficient stock. Current: {current_stock}, Requested deduction: {quantity}"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update stock (SKIP for SYSTEM_CORRECTION_ADD and SYSTEM_CORRECTION_DEDUCT)
        if adjustment_type not in ['SYSTEM_CORRECTION_ADD', 'SYSTEM_CORRECTION_DEDUCT']:
            setattr(item, stock_field, new_stock)
            item.save()
        else:
             # checking for negative stock is not required for system correction but we need to calculate new_stock 
             # correctly for the response message even if we don't save it. 
             # Actually, simpler: The 'new_stock' variable holds the calculated value. 
             # We just don't save it to the DB item. 
             pass
        
        # Create adjustment record
        adjustment_data = {
            'item_type': item_type,
            'adjustment_type': adjustment_type,
            'quantity': quantity,
            'reason': reason
        }
        
        if item_type == 'PRODUCT':
            adjustment_data['product'] = item.id
        elif item_type == 'CUSTOM':
            adjustment_data['custom'] = item.id
        elif item_type == 'RAW':
            adjustment_data['raw_item'] = item.id
        elif item_type == 'MAIN_STORE_RAW':
            adjustment_data['main_store_raw_item'] = item.id
        

        
        serializer = StockAdjustmentSerializer(data=adjustment_data)
        if serializer.is_valid():
            # If called via server-to-server request, request.user might be AnonymousUser
            adjusted_by_user = request.user if request.user.is_authenticated else None
            serializer.save(adjusted_by=adjusted_by_user)
            
            # Determine reaction stock for response
            response_stock = new_stock
            if adjustment_type in ['SYSTEM_CORRECTION_ADD', 'SYSTEM_CORRECTION_DEDUCT']:
                response_stock = current_stock

            # Send WhatsApp Notification
            adj_type_label = dict(AdjustmentType.choices).get(adjustment_type, adjustment_type)
            msg = f"🔧 STOCK ADJUSTED ({adj_type_label}): {item.name} ({quantity} {getattr(item, 'unit', '')}). Reason: {reason or 'N/A'}. Adjusted by: {adjusted_by_user.username if adjusted_by_user else 'System'}."
            send_event_notification.delay(msg)

            return Response({
                "message": "Stock adjusted successfully",
                "adjustment": serializer.data,
                "new_stock": float(response_stock)
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except (Products.DoesNotExist, Customizables.DoesNotExist, RawItems.DoesNotExist, MainStoreRawItems.DoesNotExist):
        return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_inventory_ledger(request):
    """
    Get inventory ledger showing DERIVED vs ACTUAL stock.
    Calculates stock by summing all historical movements from 0.
    Supports: RAW, PRODUCT, CUSTOM
    """
    try:
        item_type = request.GET.get('item_type')
        item_id = request.GET.get('item_id')
        start_date = request.GET.get('startDate') or request.GET.get('start_date')
        end_date = request.GET.get('endDate') or request.GET.get('end_date')
        
        if not all([item_type, item_id]):
            return Response({"error": "item_type and item_id are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        all_movements = []
        actual_stock = Decimal('0')
        item_name = ""
        
        # Get item and actual stock based on type
        if item_type == 'RAW':
            item = RawItems.objects.get(id=item_id)
            actual_stock = Decimal(str(item.quantity_in_stock or 0))
            item_name = item.name
            
            # 1. Branch Adjustments (Inflow/Outflow)
            adjustments = StockAdjustment.objects.filter(raw_item_id=item_id)
            for adj in adjustments:
                change = Decimal(str(adj.quantity))
                if adj.adjustment_type in ['WASTAGE', 'SPOILAGE', 'LEFTOVER', 'CUSTOM_DEDUCT', 'SYSTEM_CORRECTION_DEDUCT', 'PRODUCTION_DEDUCT', 'DISBURSEMENT_OUT']:
                    change = -change
                
                # Robust Display Type mapping
                type_map = {
                    'DISBURSEMENT_IN': 'Disbursement-In',
                    'DISBURSEMENT_OUT': 'Disbursement-Out',
                    'CUSTOM_ADD': 'Stock Addition',
                    'CUSTOM_DEDUCT': 'Stock Deduction',
                    'WASTAGE': 'Wastage',
                    'SPOILAGE': 'Spoilage',
                    'SYSTEM_CORRECTION_ADD': 'System Correction (+)',
                    'SYSTEM_CORRECTION_DEDUCT': 'System Correction (-)',
                    'PRODUCTION_DEDUCT': 'Production Deduction',
                    'PRODUCTION_REVERSAL': 'Production Reversal (Undo)',
                }
                display_type = type_map.get(adj.adjustment_type, adj.adjustment_type.replace('_', ' ').title())

                all_movements.append({
                    'date': adj.created_at,
                    'type': display_type,
                    'reference': f'ADJ-{adj.id:04d}',
                    'change': change,
                    'reason': adj.reason or ''
                })

        elif item_type == 'MAIN_STORE_RAW':
            item = MainStoreRawItems.objects.get(id=item_id)
            actual_stock = Decimal(str(item.quantity_in_stock or 0))
            item_name = item.name
            
            # 1. Purchases (Inflow)
            purchases = Purchases.objects.filter(raw_item_id=item_id)
            for p in purchases:
                all_movements.append({
                    'date': p.purchase_date,
                    'type': 'Purchase',
                    'reference': f'PO-{p.id:04d}',
                    'change': Decimal(str(p.quantity)),
                    'reason': f'From {p.supplier.name if p.supplier else "Unknown"}'
                })
            
            # 2. Main Store Adjustments (All types, includes Disbursement deductions)
            adjustments = StockAdjustment.objects.filter(main_store_raw_item_id=item_id)
            for adj in adjustments:
                change = Decimal(str(adj.quantity))
                if adj.adjustment_type in ['WASTAGE', 'SPOILAGE', 'LEFTOVER', 'CUSTOM_DEDUCT', 'SYSTEM_CORRECTION_DEDUCT', 'PRODUCTION_DEDUCT', 'DISBURSEMENT_OUT']:
                    change = -change
                
                # Robust Display Type mapping
                type_map = {
                    'DISBURSEMENT_IN': 'Disbursement-In',
                    'DISBURSEMENT_OUT': 'Disbursement-Out',
                    'CUSTOM_ADD': 'Stock Addition',
                    'CUSTOM_DEDUCT': 'Stock Deduction',
                    'WASTAGE': 'Wastage',
                    'SPOILAGE': 'Spoilage',
                    'SYSTEM_CORRECTION_ADD': 'System Correction (+)',
                    'SYSTEM_CORRECTION_DEDUCT': 'System Correction (-)',
                    'PRODUCTION_DEDUCT': 'Production Deduction',
                    'PRODUCTION_REVERSAL': 'Production Reversal (Undo)',
                }
                display_type = type_map.get(adj.adjustment_type, adj.adjustment_type.replace('_', ' ').title())

                all_movements.append({
                    'date': adj.created_at,
                    'type': display_type,
                    'reference': f'ADJ-{adj.id:04d}',
                    'change': change,
                    'reason': adj.reason or ''
                })
        else:
            # PRODUCT or CUSTOM
            if item_type == 'PRODUCT':
                item = Products.objects.get(id=item_id)
                actual_stock = Decimal(str(item.self_quantity_in_stock or 0))
                item_name = item.name
                sale_items = SaleItem.objects.select_related('sale', 'sale__customer').filter(
                    item_type='PRODUCT', 
                    product_id=item_id, 
                    sale__sale_status='COMPLETED'
                )
                adjustments = StockAdjustment.objects.filter(product_id=item_id)
            else: # CUSTOM
                item = Customizables.objects.get(id=item_id)
                actual_stock = Decimal(str(item.self_quantity_in_stock or 0))
                item_name = item.name
                sale_items = SaleItem.objects.select_related('sale', 'sale__customer').filter(
                    item_type='CUSTOM', 
                    custom_id=item_id, 
                    sale__sale_status='COMPLETED'
                )
                adjustments = StockAdjustment.objects.filter(custom_id=item_id)
                
            # Sales are deductions
            for si in sale_items:
                customer_name = si.sale.customer.name if si.sale.customer else "Walk-in/Unknown"
                receipt_ref = str(si.sale.sales_id)[:8].upper()
                all_movements.append({
                    'date': si.sale.sale_date,
                    'type': 'Sale',
                    'reference': f'REC-{receipt_ref}',
                    'change': -Decimal(str(si.quantity)), 
                    'reason': f'Sold to {customer_name} (Price: ₵{si.price_sold})'
                })
            
            # Manual Adjustments for Products/Customs
            for adj in adjustments:
                change = Decimal(str(adj.quantity))
                if adj.adjustment_type in ['WASTAGE', 'SPOILAGE', 'LEFTOVER', 'CUSTOM_DEDUCT', 'SYSTEM_CORRECTION_DEDUCT']:
                    change = -change
                
                # Robust Display Type mapping
                type_map = {
                    'CUSTOM_ADD': 'Stock Addition',
                    'CUSTOM_DEDUCT': 'Stock Deduction',
                    'WASTAGE': 'Wastage',
                    'SPOILAGE': 'Spoilage',
                    'SYSTEM_CORRECTION_ADD': 'System Correction (+)',
                    'SYSTEM_CORRECTION_DEDUCT': 'System Correction (-)',
                    'PRODUCTION_DEDUCT': 'Production Deduction',
                    'PRODUCTION_REVERSAL': 'Production Reversal (Undo)',
                }
                display_type = type_map.get(adj.adjustment_type, adj.adjustment_type.replace('_', ' ').title())

                all_movements.append({
                    'date': adj.created_at,
                    'type': display_type,
                    'reference': f'ADJ-{adj.id:04d}',
                    'change': change,
                    'reason': adj.reason or ''
                })

        # Sort chronologically
        all_movements.sort(key=lambda x: x['date'])
        
        # Robust Date Parsing (Handle ISO timestamps or partial dates)
        def robust_parse_dt(d_str, is_end=False):
            if not d_str: return None
            # Always try simple date first (e.g. 2026-02-25)
            # This ensures endDate='2026-02-25' uses 23:59:59, not midnight.
            d_obj = parse_date(d_str)
            if d_obj:
                t = time.max if is_end else time.min
                return make_aware(datetime.combine(d_obj, t))
            # Fallback: full ISO timestamp (e.g. 2026-02-25T10:00:00.000Z)
            from django.utils.dateparse import parse_datetime
            dt = parse_datetime(d_str)
            if dt:
                 if not dt.tzinfo: dt = make_aware(dt)
                 return dt
            return None

        start_dt = robust_parse_dt(start_date)
        end_dt = robust_parse_dt(end_date, is_end=True)
        
        final_movements = []
        running_balance = Decimal('0')
        opening_stock = Decimal('0')
        closing_stock = Decimal('0') # Balance at end_dt (or now if no end_dt)
        current_theoretical_stock = Decimal('0') # Balance at 'now'
        
        for m in all_movements:
            # Capture opening stock (state before start_dt)
            if start_dt and m['date'] < start_dt:
                opening_stock += m['change']
                
            running_balance += m['change']
            
            # Add to response if in range
            is_in_range = True
            if start_dt and m['date'] < start_dt:
                is_in_range = False
            if end_dt and m['date'] > end_dt:
                is_in_range = False
                
            if is_in_range:
                m_copy = m.copy()
                m_copy['change'] = float(round(m['change'], 2))
                m_copy['balance'] = float(round(running_balance, 2))
                m_copy['date'] = m['date'].strftime('%Y-%m-%d %H:%M')
                final_movements.append(m_copy)
                
            # Capture closing stock (state at end_dt)
            if end_dt and m['date'] <= end_dt:
                closing_stock = running_balance
            elif not end_dt:
                closing_stock = running_balance # If no end date, closing is current

        current_theoretical_stock = running_balance
        
        # Handle case where there are no movements at all
        if not all_movements:
            opening_stock = Decimal('0')
            closing_stock = Decimal('0')
            current_theoretical_stock = Decimal('0')
            
        return Response({
            'item_name': item_name,
            'movements': final_movements[::-1], # Newest first for UI
            
            # Period Stats (For the selected Date Range)
            'period_opening_stock': float(round(opening_stock, 2)),
            'period_closing_stock': float(round(closing_stock, 2)),
            
            # Current Health Check (Always 'Now')
            'current_theoretical_stock': float(round(current_theoretical_stock, 2)),
            'current_actual_stock': float(round(actual_stock, 2)),
            'discrepancy': float(round(actual_stock - current_theoretical_stock, 2))
        })

    except (RawItems.DoesNotExist, MainStoreRawItems.DoesNotExist, Products.DoesNotExist, Customizables.DoesNotExist):
        return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error in ledger: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        if user.is_superuser:
            return Response({"detail": "Cannot delete superuser."}, status=status.HTTP_403_FORBIDDEN)
        username = user.username
        user.delete()
        
        # WhatsApp Notification for User Deletion
        msg = f"🗑️ USER DELETED: {username}. Action by: {request.user.username if request.user.is_authenticated else 'System'}."
        send_event_notification.delay(msg)
        
        return Response({"detail": "User deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
def delete_supplier(request, supplier_id):
    try:
        supplier = Suppliers.objects.get(id=supplier_id)
        supplier_name = supplier.name
        supplier.delete()
        
        # WhatsApp Notification for Supplier Deletion
        msg = f"🗑️ SUPPLIER REMOVED: {supplier_name}. Action by: {request.user.username if request.user.is_authenticated else 'System'}."
        send_event_notification.delay(msg)
        
        return Response({"detail": "Supplier deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    except Suppliers.DoesNotExist:
        return Response({"detail": "Supplier not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def get_alerts(request):
    """
    Fetch all active alerts, optionally filtered by read status.
    """
    is_read = request.query_params.get('is_read')
    alerts = Alert.objects.filter(is_active=True)
    
    if is_read is not None:
        alerts = alerts.filter(is_read=is_read.lower() == 'true')
        
    serializer = AlertSerializer(alerts, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def mark_alert_as_read(request, alert_id):
    """
    Mark a specific alert as read.
    """
    try:
        alert = Alert.objects.get(id=alert_id)
        alert.is_read = True
        alert.save()
        return Response({"message": "Alert marked as read"})
    except Alert.DoesNotExist:
        return Response({"error": "Alert not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def mark_all_alerts_as_read(request):
    """
    Mark all active alerts as read.
    """
    Alert.objects.filter(is_active=True, is_read=False).update(is_read=True)
    return Response({"message": "All alerts marked as read"})
@api_view(['GET'])
def get_activity_logs(request):
    queryset = ActivityLog.objects.all().order_by('-timestamp')
    
    # Filter by user
    user_id = request.GET.get('user')
    if user_id:
        queryset = queryset.filter(user_id=user_id)
        
    # Filter by action
    action = request.GET.get('action')
    if action:
        queryset = queryset.filter(action=action)
        
    # Filter by date range
    start_date = request.GET.get('start_date')  # YYYY-MM-DD
    end_date = request.GET.get('end_date')      # YYYY-MM-DD
    if start_date:
        queryset = queryset.filter(timestamp__date__gte=start_date)
    if end_date:
        queryset = queryset.filter(timestamp__date__lte=end_date)
        
    # Pagination
    paginator = SalePagination() # Reuse existing paginator
    page = paginator.paginate_queryset(queryset, request)
    
    serializer = ActivityLogSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
def get_batch_names(request):
    queryset = BatchName.objects.all().order_by('-date_created')
    
    paginator = SalePagination()
    page = paginator.paginate_queryset(queryset, request)
    
    serializer = BatchNameSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
def add_batch_name(request):
    serializer = BatchNameSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_batch_name(request, batch_id):
    try:
        batch = BatchName.objects.get(id=batch_id)
        batch_name = batch.name
        batch.delete()
        
        # WhatsApp Notification for Batch Deletion
        msg = f"🗑️ PRODUCTION BATCH DELETED: {batch_name}. Action by: {request.user.username if request.user.is_authenticated else 'System'}."
        send_event_notification.delay(msg)
        
        return Response({"detail": "Batch deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    except BatchName.DoesNotExist:
        return Response({"detail": "Batch not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def get_batch_production_recipes(request):
    recipes = BatchProductionRecipes.objects.all().order_by('id')
    serializer = BatchProductionRecipesSerializer(recipes, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def add_batch_production_recipe(request):
    serializer = BatchProductionRecipesSerializer(data=request.data)
    if serializer.is_valid():
        recipe = serializer.save()
        # WhatsApp Notification for Recipe Change
        msg = f"📝 RECIPE MODIFIED: {recipe.batch_name.name} now includes {recipe.quantity_required} {recipe.raw_item.unit} of {recipe.raw_item.name}. Action by: {request.user.username if request.user.is_authenticated else 'System'}."
        send_event_notification.delay(msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'PATCH', 'DELETE'])
def update_batch_production_recipe(request, recipe_id):
    try:
        recipe = BatchProductionRecipes.objects.get(id=recipe_id)
    except BatchProductionRecipes.DoesNotExist:
        return Response({"detail": "Recipe not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = BatchProductionRecipesSerializer(recipe, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'PATCH':
        serializer = BatchProductionRecipesSerializer(recipe, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'DELETE':
        recipe.delete()
        return Response({"detail": "Recipe deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

    return Response({"detail": "Method not allowed."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
def mark_batch_as_cooked(request, batch_id):
    try:
        with transaction.atomic():
            batch = BatchName.objects.select_for_update().get(id=batch_id)
            
            # A batch can be cooked multiple times
            multiplier_val = request.data.get('multiplier', 1.0)
            try:
                multiplier = Decimal(str(multiplier_val))
            except (InvalidOperation, ValueError, TypeError):
                multiplier = Decimal('1.0')
            
            recipes = BatchProductionRecipes.objects.filter(batch_name=batch)
            if not recipes.exists():
                return Response({"detail": "No recipes found for this batch. Please add ingredients to the batch recipe first."}, status=status.HTTP_400_BAD_REQUEST)

            for recipe in recipes:
                raw_item = recipe.raw_item
                total_quantity = recipe.quantity_required * multiplier
                
                # Deduct inventory
                raw_item.quantity_in_stock = F('quantity_in_stock') - total_quantity
                raw_item.save(update_fields=['quantity_in_stock'])
                
                # Create StockAdjustment record
                StockAdjustment.objects.create(
                    item_type='RAW',
                    raw_item=raw_item,
                    adjustment_type=AdjustmentType.PRODUCTION_DEDUCT,
                    quantity=total_quantity,
                    reason=f"Produced {multiplier}x batch: {batch.name}",
                    adjusted_by=request.user if request.user.is_authenticated else None
                )
            
            batch.is_cooked = True
            batch.cooked_at = now()
            batch.save(update_fields=['is_cooked', 'cooked_at'])

            # Create BatchProductionLog
            BatchProductionLog.objects.create(
                batch=batch,
                multiplier=multiplier,
                produced_by=request.user if request.user.is_authenticated else None
            )
            
            # Log activity
            ActivityLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action='POST',
                endpoint=f'/markbatchcooked/{batch_id}/',
                details={'batch_name': batch.name, 'action': 'mark_as_cooked', 'multiplier': float(multiplier)}
            )
            
            # Send WhatsApp Notification
            msg = f"🍳 BATCH PRODUCED: {batch.name} (x{multiplier}). Inventory deducted for all ingredients."
            send_event_notification.delay(msg)
            
        return Response({"detail": f"Batch '{batch.name}' produced (x{multiplier}) and inventory deducted."}, status=status.HTTP_200_OK)
    except BatchName.DoesNotExist:
        return Response({"detail": "Batch not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def undo_batch_cooking(request, log_id):
    try:
        with transaction.atomic():
            # Get the specific log and lock it
            log = BatchProductionLog.objects.select_for_update().get(id=log_id, is_reversed=False)
            batch = log.batch
            multiplier = log.multiplier

            recipes = BatchProductionRecipes.objects.filter(batch_name=batch)
            
            for recipe in recipes:
                raw_item = recipe.raw_item
                # Reverse deduction based on the multiplier used during production
                quantity_to_restore = recipe.quantity_required * multiplier
                
                raw_item.quantity_in_stock = F('quantity_in_stock') + quantity_to_restore
                raw_item.save(update_fields=['quantity_in_stock'])
                
                # Create StockAdjustment record
                StockAdjustment.objects.create(
                    item_type='RAW',
                    raw_item=raw_item,
                    adjustment_type=AdjustmentType.PRODUCTION_REVERSAL,
                    quantity=quantity_to_restore,
                    reason=f"Undo production (x{multiplier}) for batch: {batch.name}",
                    adjusted_by=request.user if request.user.is_authenticated else None
                )
            
            # Mark this specific log as reversed
            log.is_reversed = True
            log.save(update_fields=['is_reversed'])

            # Only set batch.is_cooked = False if NO other non-reversed production logs exist for this batch
            if not BatchProductionLog.objects.filter(batch=batch, is_reversed=False).exists():
                batch.is_cooked = False
                batch.cooked_at = None
                batch.save(update_fields=['is_cooked', 'cooked_at'])
            
            # Log activity
            ActivityLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action='POST',
                endpoint=f'/undobatchcooking/{log_id}/',
                details={'batch_name': batch.name, 'log_id': log_id, 'action': 'undo_cooking'}
            )
            
            # Send WhatsApp Notification
            msg = f"🔄 PRODUCTION REVERSED: {batch.name} (x{multiplier}). Inventory restored."
            send_event_notification.delay(msg)
            
        return Response({"detail": f"Production log {log_id} reversed for batch '{batch.name}'."}, status=status.HTTP_200_OK)
    except BatchProductionLog.DoesNotExist:
        return Response({"detail": "Production log not found or already reversed."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_batch_logs(request):
    queryset = BatchProductionLog.objects.all().order_by('-produced_at')
    
    search = request.GET.get('search')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    batch_id = request.GET.get('batch_id')

    if search:
        queryset = queryset.filter(batch__name__icontains=search)
    
    if start_date:
        queryset = queryset.filter(produced_at__date__gte=parse_date(start_date))
    
    if end_date:
        queryset = queryset.filter(produced_at__date__lte=parse_date(end_date))

    if batch_id:
        queryset = queryset.filter(batch_id=batch_id)

    paginator = SalePagination()
    page = paginator.paginate_queryset(queryset, request)

    serializer = BatchProductionLogSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)
