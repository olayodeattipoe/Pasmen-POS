// Example: How to make authenticated API calls to your Django backend

import { authenticatedFetch } from './features';

const API_BASE_URL = 'http://localhost:8000';

// Example 1: Fetch orders with authentication
export async function getOrders() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/orders/`);

        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
}

// Example 2: Create a new order with authentication
export async function createOrder(orderData: any) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/orders/`, {
            method: 'POST',
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            throw new Error('Failed to create order');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

// Example 3: Update order status
export async function updateOrderStatus(orderId: string, status: string) {
    try {
        const response = await authenticatedFetch(
            `${API_BASE_URL}/api/orders/${orderId}/`,
            {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to update order status');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating order:', error);
        throw error;
    }
}
