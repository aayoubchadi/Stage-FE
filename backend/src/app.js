import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import productRoutes from './routes/productRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js';
import purchaseReceiptRoutes from './routes/purchaseReceiptRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import salesOrderRoutes from './routes/salesOrderRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_request, response) => {
  response.json({
    name: 'StockPro API',
    status: 'ok',
  });
});

app.use('/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/company', companyRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/purchase-orders', purchaseOrderRoutes);
app.use('/api/v1/purchase-receipts', purchaseReceiptRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/sales-orders', salesOrderRoutes);
app.use('/api/v1/audits', auditRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
