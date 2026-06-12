from celery import shared_task
from .models import RawItems, MainStoreRawItems, Alert, Sale
from django.db.models import Q, Sum
from twilio.rest import Client
import os
import logging
from django.utils.timezone import now
from datetime import timedelta

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

account_ssid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")
whatsapp_from = os.getenv("TWILIO_WHATSAPP_FROM")
whatsapp_recipients = os.getenv("WHATSAPP_ADMIN_NUMBERS", "").split(',')
branch_name = os.getenv("BRANCH_NAME", "Main Branch")


client = None
if account_ssid and auth_token:
    client = Client(account_ssid, auth_token)

def send_whatsapp_notification(message_body: str):
    if not client or not whatsapp_recipients or not whatsapp_from:
        logger.error("Twilio credentials or admin numbers not configured in .env")
        return None
    
    full_message_body = f"🏪 *{branch_name}*\n\n{message_body}"
    
    sids = []
    for recipient in whatsapp_recipients:
        recipient = recipient.strip()
        if not recipient:
            continue
        try:
            message = client.messages.create(
                from_=f"whatsapp:{whatsapp_from}",
                body=full_message_body,
                to=f"whatsapp:{recipient}"
            )
            sids.append(message.sid)
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message to {recipient}: {str(e)}")
    
@shared_task
def send_event_notification(message: str):
    """
    Asynchronously sends a WhatsApp notification for specific business events.
    """
    logger.info(f"[Celery] TWILIO_ACCOUNT_SID: {account_ssid}")
    logger.info(f"[Celery] TWILIO_AUTH_TOKEN: {'SET' if auth_token else 'MISSING'}")
    logger.info(f"[Celery] WHATSAPP_FROM: {whatsapp_from}")
    logger.info(f"[Celery] WHATSAPP_RECIPIENTS: {whatsapp_recipients}")
    try:
        return send_whatsapp_notification(message)
    except Exception as e:
        return {"status": "error","detail": str(e)}

@shared_task
def send_daily_summary():
    """
    Nightly automated report for sales and stock status.
    """
    today_start = now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Sales Summary
    sales_today = Sale.objects.filter(sale_date__gte=today_start, sale_status='COMPLETED')
    total_revenue = sales_today.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    order_count = sales_today.count()

    # 2. Stock Summary (Critical Only)
    out_of_stock = Alert.objects.filter(is_active=True, alert_type='OUT_OF_STOCK').count()

    date_str = now().strftime('%Y-%m-%d')
    header = f"📊 *PASMEN DAILY REPORT ({date_str})*\n\n"
    body = (
        f"💰 *Total Revenue:* GHS {total_revenue:,.2f}\n"
        f"📈 *Total Orders:* {order_count}\n"
        f"⚠️ *Out of Stock Items:* {out_of_stock}\n\n"
        "Have a restful evening! 🌙"
    )
    
    return send_whatsapp_notification(header + body)

def process_item_alerts(item, item_type, current_qty, reorder_level, unit):
    """
    Analyzes an item and returns an alert_msg if stock is low.
    Since Celery Beat runs every 15 minutes, we report all low stock items in every run.
    """
    alert_type = None
    severity = None
    prefix = "[Main Store] " if item_type == 'MAIN_STORE_RAW' else ""

    if current_qty <= 0:
        alert_type = "OUT_OF_STOCK"
        severity = "CRITICAL"
    elif current_qty <= reorder_level:
        alert_type = "LOW_STOCK"
        severity = "WARN"

    # Query params for existing active alert
    filter_kwargs = {'item_type': item_type, 'is_active': True}
    if item_type == 'RAW':
        filter_kwargs['raw_item'] = item
    else:
        filter_kwargs['main_store_raw_item'] = item

    active_alert = Alert.objects.filter(**filter_kwargs).first()

    if alert_type:
        msg = f"🚨 {prefix}{item.name}: {'OUT OF STOCK' if alert_type == 'OUT_OF_STOCK' else 'LOW STOCK'} ({current_qty} {unit} left)."
        
        # New alert or state change
        if not active_alert or active_alert.alert_type != alert_type:
            if active_alert:
                active_alert.is_active = False
                active_alert.save()
            
            active_alert = Alert.objects.create(
                item_type=item_type,
                raw_item=item if item_type == 'RAW' else None,
                main_store_raw_item=item if item_type == 'MAIN_STORE_RAW' else None,
                alert_type=alert_type,
                severity=severity,
                message=msg,
                last_whatsapp_sent_at=now()
            )
        else:
            # Maintain active alert - always update timestamp to mark that it was included in this 15-min run
            active_alert.last_whatsapp_sent_at = now()
            active_alert.save()
            
        return msg
    else:
        # Stock is healthy - deactivate any active alert
        if active_alert:
            active_alert.is_active = False
            active_alert.save()

    return None

@shared_task
def check_stock_levels():
    """
    Task to check stock levels and send batched WhatsApp alerts.
    Runs every 15 minutes (configured in Celery Beat).
    """
    # 1. Global Cooldown Check (check if any notification was sent in last 2 mins in a PREVIOUS run)
    global_wait = now() - timedelta(minutes=2)
    recent_global_send = Alert.objects.filter(last_whatsapp_sent_at__gte=global_wait).exists()

    pending_alerts = []

    # 2. Check RawItems
    raw_items = RawItems.objects.filter(should_read_alerts=True)
    for item in raw_items:
        msg = process_item_alerts(item, 'RAW', item.quantity_in_stock, item.reorder_level, item.unit)
        if msg: pending_alerts.append(msg)

    # 3. Check MainStoreRawItems
    main_store_items = MainStoreRawItems.objects.filter(should_read_alerts=True)
    for item in main_store_items:
        msg = process_item_alerts(item, 'MAIN_STORE_RAW', item.quantity_in_stock, item.reorder_level, item.unit)
        if msg: pending_alerts.append(msg)

    # 4. Send Summary if not in global cooldown
    if pending_alerts:
        if not recent_global_send:
            header = "*🚨 STOCK ALERT (Summary)*\n\n"
            summary_body = "\n".join(pending_alerts)
            send_whatsapp_notification(header + summary_body)
        else:
            logger.info("Global cooldown active (likely from restart or manual run). Skipping batch alerts.")

    return "Stock level check completed"
