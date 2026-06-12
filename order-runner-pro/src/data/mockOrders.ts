import { Order } from '@/api/models';

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: '007',
    customer: {
      id: 7,
      name: "Solomon Mensah Attipoe",
      phone: "0240058926"
    },
    order: {
      total_amount: "100.00",
      payment_method: "MoMo",
      specific_description: "I want a lot of shito please",
      prepared_by_id: 45,
      processed_by_id: 23,
      baskets: [
        {
          product_id: 2,
          product_name: "Waakye Jumbo",
          product_price_sold: 10.00,
          product_quantity: 4,
          customizations: [
            {
              custom_id: 1,
              custom_name: "Egg",
              custom_price_sold: 5.00,
              custom_quantity: 5
            },
            {
              custom_id: 2,
              custom_name: "Plantain",
              custom_price_sold: 2.00,
              custom_quantity: 1
            }
          ]
        },
        {
          product_id: 1,
          product_name: "Waakye",
          product_price_sold: 15.00,
          product_quantity: 1,
          customizations: []
        }
      ]
    },
    status: 'new',
    createdAt: new Date(Date.now() - 3 * 60000),
    priority: 'rush',
  },
  {
    id: '2',
    orderNumber: '008',
    customer: {
      id: 8,
      name: "Akosua Serwaa",
      phone: "0551234567"
    },
    order: {
      total_amount: "45.00",
      payment_method: "Cash",
      specific_description: "No onions in the salad",
      prepared_by_id: 42,
      processed_by_id: 21,
      baskets: [
        {
          product_id: 3,
          product_name: "Jollof Rice",
          product_price_sold: 25.00,
          product_quantity: 1,
          customizations: [
            {
              custom_id: 3,
              custom_name: "Chicken",
              custom_price_sold: 15.00,
              custom_quantity: 1
            }
          ]
        },
        {
          product_id: 4,
          product_name: "Sobolo",
          product_price_sold: 5.00,
          product_quantity: 1,
          customizations: []
        }
      ]
    },
    status: 'new',
    createdAt: new Date(Date.now() - 8 * 60000),
    priority: 'normal',
  }
];
