import {type Context} from 'hono';
import {getAllOrders, getAllCheckouts} from '../data/transactions';
import {getAllInventory} from '../data/inventory';
import {listProducts, getProduct} from '../data/products';

export class AdminService {
  listOrders = async (c: Context) => {
    try {
      const orders = getAllOrders();

      // Enhance orders with status and created_at fields for admin display
      const enhancedOrders = orders.map(order => {
        // Derive order status from line_items
        const hasProcessing = order.line_items?.some((item: any) => item.status === 'processing');
        const allFulfilled = order.line_items?.every((item: any) => item.quantity?.fulfilled === item.quantity?.total);
        const status = allFulfilled ? 'completed' : (hasProcessing ? 'processing' : 'pending');

        return {
          ...order,
          status,
          created_at: (order as any).created_at || new Date().toISOString()
        };
      });

      return c.json({
        success: true,
        count: enhancedOrders.length,
        orders: enhancedOrders
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  };

  listCheckouts = async (c: Context) => {
    try {
      const checkouts = getAllCheckouts();

      // Enhance checkouts with created_at field for admin display
      const enhancedCheckouts = checkouts.map(checkout => ({
        ...checkout,
        created_at: (checkout as any).created_at || new Date().toISOString()
      }));

      return c.json({
        success: true,
        count: enhancedCheckouts.length,
        checkouts: enhancedCheckouts
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  };

  getInventoryStatus = async (c: Context) => {
    try {
      const inventory = getAllInventory();
      const products = listProducts();

      const inventoryWithProducts = inventory.map(inv => {
        const product = products.find(p => p.id === inv.product_id);
        return {
          product_id: inv.product_id,
          product_title: product?.title || 'Unknown',
          product_price: product?.price || 0,
          quantity: inv.quantity
        };
      });

      return c.json({
        success: true,
        count: inventoryWithProducts.length,
        inventory: inventoryWithProducts
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  };
}
