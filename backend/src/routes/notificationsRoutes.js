import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireTenantAccess } from '../middleware/requireTenantAccess.js';
import { HttpError } from '../lib/httpError.js';
import {
  sendLowStockAlert,
  sendPurchaseOrderReceived,
  sendOrderShipped,
  sendEmployeeInvitation,
  sendDailySummary,
} from '../lib/notifications.js';

const router = Router();

/**
 * POST /api/v1/notifications/low-stock-alert
 * Send low stock alert to admin
 */
router.post('/low-stock-alert', requireAuth, requireTenantAccess, async (request, response, next) => {
  try {
    const { email, companyName, products } = request.body;

    if (!email || !companyName || !Array.isArray(products)) {
      throw new HttpError(
        400,
        'NOTIFICATIONS_VALIDATION_ERROR',
        'email, companyName, and products array are required'
      );
    }

    const result = await sendLowStockAlert(email, companyName, products);

    if (!result.success) {
      throw new HttpError(
        500,
        'NOTIFICATIONS_SEND_ERROR',
        'Failed to send low stock alert'
      );
    }

    response.json({
      data: { success: true, message: 'Low stock alert sent' },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/notifications/purchase-order-received
 * Send purchase order confirmation
 */
router.post('/purchase-order-received', requireAuth, requireTenantAccess, async (request, response, next) => {
  try {
    const { email, companyName, supplierId, orderTotal, itemCount } = request.body;

    if (!email || !companyName || !supplierId || !orderTotal || itemCount === undefined) {
      throw new HttpError(
        400,
        'NOTIFICATIONS_VALIDATION_ERROR',
        'email, companyName, supplierId, orderTotal, and itemCount are required'
      );
    }

    const result = await sendPurchaseOrderReceived(
      email,
      companyName,
      supplierId,
      orderTotal,
      itemCount
    );

    if (!result.success) {
      throw new HttpError(
        500,
        'NOTIFICATIONS_SEND_ERROR',
        'Failed to send purchase order notification'
      );
    }

    response.json({
      data: { success: true, message: 'Purchase order notification sent' },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/notifications/order-shipped
 * Send order shipped notification
 */
router.post('/order-shipped', requireAuth, requireTenantAccess, async (request, response, next) => {
  try {
    const { email, customerName, orderId, trackingNumber } = request.body;

    if (!email || !customerName || !orderId || !trackingNumber) {
      throw new HttpError(
        400,
        'NOTIFICATIONS_VALIDATION_ERROR',
        'email, customerName, orderId, and trackingNumber are required'
      );
    }

    const result = await sendOrderShipped(email, customerName, orderId, trackingNumber);

    if (!result.success) {
      throw new HttpError(
        500,
        'NOTIFICATIONS_SEND_ERROR',
        'Failed to send order shipped notification'
      );
    }

    response.json({
      data: { success: true, message: 'Order shipped notification sent' },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/notifications/employee-invitation
 * Send employee invitation email
 */
router.post('/employee-invitation', requireAuth, requireTenantAccess, async (request, response, next) => {
  try {
    const { email, fullName, companyName, inviteToken } = request.body;

    if (!email || !fullName || !companyName || !inviteToken) {
      throw new HttpError(
        400,
        'NOTIFICATIONS_VALIDATION_ERROR',
        'email, fullName, companyName, and inviteToken are required'
      );
    }

    const result = await sendEmployeeInvitation(email, fullName, companyName, inviteToken);

    if (!result.success) {
      throw new HttpError(
        500,
        'NOTIFICATIONS_SEND_ERROR',
        'Failed to send employee invitation'
      );
    }

    response.json({
      data: { success: true, message: 'Employee invitation sent' },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/notifications/daily-summary
 * Send daily summary email
 */
router.post('/daily-summary', requireAuth, requireTenantAccess, async (request, response, next) => {
  try {
    const { email, companyName, summary } = request.body;

    if (!email || !companyName || !summary) {
      throw new HttpError(
        400,
        'NOTIFICATIONS_VALIDATION_ERROR',
        'email, companyName, and summary object are required'
      );
    }

    const result = await sendDailySummary(email, companyName, summary);

    if (!result.success) {
      throw new HttpError(
        500,
        'NOTIFICATIONS_SEND_ERROR',
        'Failed to send daily summary'
      );
    }

    response.json({
      data: { success: true, message: 'Daily summary sent' },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
