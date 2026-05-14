import nodemailer from 'nodemailer';

/**
 * Email notifications service for StockPro
 * Handles sending transactional and business event emails
 */

const smtpHost = String(process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const smtpPort = Number.parseInt(process.env.SMTP_PORT || '465', 10);
const smtpSecure = smtpPort === 465;
const smtpFromEmail = String(process.env.SMTP_FROM_EMAIL || 'noreply@stockpro.app').trim();

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailLayout(content, title) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f4f7fb;font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;color:#172033;">
    <div style="max-width:600px;margin:0 auto;background:white;">
      <div style="padding:32px 24px;border-bottom:1px solid #e2e8f0;">
        <h1 style="margin:0;font-size:24px;font-weight:600;color:#172033;">StockPro</h1>
      </div>
      <div style="padding:32px 24px;">
        ${content}
      </div>
      <div style="padding:24px;border-top:1px solid #e2e8f0;background:#f8fafc;text-align:center;font-size:12px;color:#64748b;">
        <p style="margin:0;">© 2026 StockPro. All rights reserved.</p>
        <p style="margin:8px 0 0 0;"><a href="https://stockpro.app" style="color:#0ea5e9;text-decoration:none;">Visit StockPro</a></p>
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Send low stock alert email
 */
export async function sendLowStockAlert(email, companyName, products) {
  const productsList = products
    .map((p) => `<li style="margin:8px 0;">${escapeHtml(p.name)} (${escapeHtml(p.sku)}): ${p.quantityInStock} units (threshold: ${p.lowStockThreshold})</li>`)
    .join('');

  const htmlContent = buildEmailLayout(`
    <h2 style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#172033;">Low Stock Alert</h2>
    <p style="margin:0 0 16px 0;color:#475569;">Hi,</p>
    <p style="margin:0 0 16px 0;color:#475569;">The following products in <strong>${escapeHtml(companyName)}</strong> are running low on stock:</p>
    <ul style="margin:16px 0;padding-left:24px;color:#475569;">
      ${productsList}
    </ul>
    <p style="margin:16px 0;color:#475569;">Please review your inventory and place orders as needed.</p>
    <a href="${process.env.APP_URL || 'https://stockpro.app'}/inventory" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#0ea5e9;color:white;text-decoration:none;border-radius:6px;font-weight:600;">View Inventory</a>
    <p style="margin:24px 0 0 0;color:#64748b;font-size:12px;">This is an automated alert from StockPro.</p>
  `, 'Low Stock Alert');

  try {
    await transporter.sendMail({
      from: smtpFromEmail,
      to: email,
      subject: `[StockPro Alert] Low Stock Notification - ${escapeHtml(companyName)}`,
      html: htmlContent,
      text: `Low Stock Alert\n\nThe following products in ${companyName} are running low:\n${products.map((p) => `- ${p.name} (${p.sku}): ${p.quantityInStock} units`).join('\n')}`,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending low stock alert:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send purchase order received notification
 */
export async function sendPurchaseOrderReceived(email, companyName, supplierId, orderTotal, itemCount) {
  const htmlContent = buildEmailLayout(`
    <h2 style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#172033;">Purchase Order Received</h2>
    <p style="margin:0 0 16px 0;color:#475569;">Hi,</p>
    <p style="margin:0 0 16px 0;color:#475569;">Your purchase order has been confirmed:</p>
    <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:8px 0;"><strong>Company:</strong> ${escapeHtml(companyName)}</p>
      <p style="margin:8px 0;"><strong>Supplier ID:</strong> ${escapeHtml(supplierId)}</p>
      <p style="margin:8px 0;"><strong>Items:</strong> ${itemCount}</p>
      <p style="margin:8px 0;"><strong>Total Amount:</strong> $${Number(orderTotal).toFixed(2)}</p>
    </div>
    <p style="margin:16px 0;color:#475569;">Your supplier will receive this order and fulfill it accordingly.</p>
    <a href="${process.env.APP_URL || 'https://stockpro.app'}/purchase-orders" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#0ea5e9;color:white;text-decoration:none;border-radius:6px;font-weight:600;">View Purchase Orders</a>
    <p style="margin:24px 0 0 0;color:#64748b;font-size:12px;">This is an automated notification from StockPro.</p>
  `, 'Purchase Order Received');

  try {
    await transporter.sendMail({
      from: smtpFromEmail,
      to: email,
      subject: `[StockPro] Purchase Order Confirmed - ${escapeHtml(companyName)}`,
      html: htmlContent,
      text: `Purchase Order Received\n\nCompany: ${companyName}\nSupplier: ${supplierId}\nItems: ${itemCount}\nTotal: $${Number(orderTotal).toFixed(2)}`,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending purchase order notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send sales order shipped notification
 */
export async function sendOrderShipped(email, customerName, orderId, trackingNumber) {
  const htmlContent = buildEmailLayout(`
    <h2 style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#172033;">Order Shipped</h2>
    <p style="margin:0 0 16px 0;color:#475569;">Hi ${escapeHtml(customerName)},</p>
    <p style="margin:0 0 16px 0;color:#475569;">Your order has been shipped!</p>
    <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:8px 0;"><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
      <p style="margin:8px 0;"><strong>Tracking Number:</strong> <code style="background:#e2e8f0;padding:4px 8px;border-radius:4px;">${escapeHtml(trackingNumber)}</code></p>
    </div>
    <p style="margin:16px 0;color:#475569;">Use your tracking number to monitor your shipment status. You can typically track your package on the carrier's website.</p>
    <p style="margin:16px 0;color:#475569;">Thank you for your order!</p>
    <a href="${process.env.APP_URL || 'https://stockpro.app'}/sales-orders" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#0ea5e9;color:white;text-decoration:none;border-radius:6px;font-weight:600;">View Order</a>
    <p style="margin:24px 0 0 0;color:#64748b;font-size:12px;">This is an automated notification. Do not reply to this email.</p>
  `, 'Order Shipped');

  try {
    await transporter.sendMail({
      from: smtpFromEmail,
      to: email,
      subject: `[StockPro] Your Order #${escapeHtml(orderId)} Has Shipped`,
      html: htmlContent,
      text: `Order Shipped\n\nOrder ID: ${orderId}\nTracking Number: ${trackingNumber}\n\nThank you for your order!`,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending order shipped notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send employee invitation email
 */
export async function sendEmployeeInvitation(email, fullName, companyName, inviteToken) {
  const inviteUrl = `${process.env.APP_URL || 'https://stockpro.app'}/join?token=${encodeURIComponent(inviteToken)}`;

  const htmlContent = buildEmailLayout(`
    <h2 style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#172033;">You've Been Invited to StockPro</h2>
    <p style="margin:0 0 16px 0;color:#475569;">Hi ${escapeHtml(fullName)},</p>
    <p style="margin:0 0 16px 0;color:#475569;">You've been invited to join <strong>${escapeHtml(companyName)}</strong> on StockPro, a modern stock management platform.</p>
    <p style="margin:16px 0;color:#475569;">Click the button below to accept the invitation and create your account:</p>
    <a href="${escapeHtml(inviteUrl)}" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#10b981;color:white;text-decoration:none;border-radius:6px;font-weight:600;">Accept Invitation</a>
    <p style="margin:16px 0;color:#475569;">Or copy this link in your browser:</p>
    <p style="margin:8px 0;color:#0ea5e9;word-break:break-all;"><a href="${escapeHtml(inviteUrl)}" style="color:#0ea5e9;">${escapeHtml(inviteUrl)}</a></p>
    <p style="margin:24px 0 0 0;color:#64748b;font-size:12px;">This invitation expires in 7 days. If you did not expect this, you can ignore this email.</p>
  `, 'Join StockPro');

  try {
    await transporter.sendMail({
      from: smtpFromEmail,
      to: email,
      subject: `You're Invited to StockPro - ${escapeHtml(companyName)}`,
      html: htmlContent,
      text: `You've been invited to join ${companyName} on StockPro.\n\nAccept: ${inviteUrl}`,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending employee invitation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send daily summary email
 */
export async function sendDailySummary(email, companyName, summary) {
  const {
    totalOrders = 0,
    completedOrders = 0,
    pendingOrders = 0,
    lowStockItems = 0,
    totalRevenue = 0,
  } = summary;

  const htmlContent = buildEmailLayout(`
    <h2 style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#172033;">Daily Summary - ${new Date().toLocaleDateString()}</h2>
    <p style="margin:0 0 16px 0;color:#475569;">Hi,</p>
    <p style="margin:0 0 16px 0;color:#475569;">Here's your daily summary for <strong>${escapeHtml(companyName)}</strong>:</p>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0;">
      <div style="background:#f0f9ff;padding:16px;border-radius:8px;border-left:4px solid #0ea5e9;">
        <p style="margin:0;font-size:12px;color:#0c4a6e;font-weight:600;">Total Orders</p>
        <p style="margin:8px 0 0 0;font-size:24px;font-weight:700;color:#0c4a6e;">${totalOrders}</p>
      </div>
      
      <div style="background:#f0fdf4;padding:16px;border-radius:8px;border-left:4px solid #10b981;">
        <p style="margin:0;font-size:12px;color:#064e3b;font-weight:600;">Completed</p>
        <p style="margin:8px 0 0 0;font-size:24px;font-weight:700;color:#064e3b;">${completedOrders}</p>
      </div>
      
      <div style="background:#fef3c7;padding:16px;border-radius:8px;border-left:4px solid #f59e0b;">
        <p style="margin:0;font-size:12px;color:#7c2d12;font-weight:600;">Pending</p>
        <p style="margin:8px 0 0 0;font-size:24px;font-weight:700;color:#7c2d12;">${pendingOrders}</p>
      </div>
      
      <div style="background:#fee2e2;padding:16px;border-radius:8px;border-left:4px solid #ef4444;">
        <p style="margin:0;font-size:12px;color:#7f1d1d;font-weight:600;">Low Stock</p>
        <p style="margin:8px 0 0 0;font-size:24px;font-weight:700;color:#7f1d1d;">${lowStockItems}</p>
      </div>
    </div>

    <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:0;font-size:12px;color:#475569;font-weight:600;">Total Revenue</p>
      <p style="margin:8px 0 0 0;font-size:28px;font-weight:700;color:#172033;">$${Number(totalRevenue).toFixed(2)}</p>
    </div>

    <a href="${process.env.APP_URL || 'https://stockpro.app'}/admin-dashboard" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#0ea5e9;color:white;text-decoration:none;border-radius:6px;font-weight:600;">View Dashboard</a>
  `, 'Daily Summary');

  try {
    await transporter.sendMail({
      from: smtpFromEmail,
      to: email,
      subject: `[StockPro] Daily Summary - ${escapeHtml(companyName)}`,
      html: htmlContent,
      text: `Daily Summary\n\nTotal Orders: ${totalOrders}\nCompleted: ${completedOrders}\nPending: ${pendingOrders}\nLow Stock: ${lowStockItems}\nTotal Revenue: $${Number(totalRevenue).toFixed(2)}`,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending daily summary:', error);
    return { success: false, error: error.message };
  }
}

export default {
  sendLowStockAlert,
  sendPurchaseOrderReceived,
  sendOrderShipped,
  sendEmployeeInvitation,
  sendDailySummary,
};
