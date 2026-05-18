import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { requireAuth } from '../middleware/requireAuth.js';
import {
    requireTenantAccess,
    requireTenantPermission,
} from '../middleware/requireTenantAccess.js';
import db from '../lib/db.js';
import { HttpError } from '../lib/httpError.js';

const router = Router();

function normalizeValue(value) {
    return String(value || '').trim();
}

function toNumber(value, fallback = NaN) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        String(value || '')
    );
}

function parseReceiptDate(input) {
    if (!input) {
        return new Date();
    }

    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
        throw new HttpError(400, 'RECEIPT_VALIDATION_ERROR', 'Invalid receipt date');
    }

    return parsed;
}

function formatMoney(value, currencyCode) {
    const safeCurrency = String(currencyCode || 'EUR').toUpperCase();
    const amount = Number.isFinite(value) ? value : 0;

    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: safeCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${amount.toFixed(2)} ${safeCurrency}`;
    }
}

function formatDate(value) {
    return new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    }).format(value);
}

function renderLineItems(doc, items, currency, startY) {
    const columnX = {
        sku: 50,
        name: 120,
        qty: 340,
        unit: 390,
        total: 470,
    };
    const rowHeight = 18;
    let y = startY;

    doc.fontSize(10).fillColor('#111827').text('SKU', columnX.sku, y);
    doc.text('Product', columnX.name, y);
    doc.text('Qty', columnX.qty, y, { width: 40, align: 'right' });
    doc.text('Unit', columnX.unit, y, { width: 60, align: 'right' });
    doc.text('Total', columnX.total, y, { width: 70, align: 'right' });

    y += rowHeight;
    doc.moveTo(50, y - 4).lineTo(545, y - 4).strokeColor('#e5e7eb').stroke();

    for (const item of items) {
        if (y > doc.page.height - 80) {
            doc.addPage();
            y = 50;
        }

        doc.fontSize(10).fillColor('#111827').text(item.sku, columnX.sku, y);
        doc.text(item.name, columnX.name, y, { width: 200 });
        doc.text(String(item.quantity), columnX.qty, y, { width: 40, align: 'right' });
        doc.text(formatMoney(item.unitPrice, currency), columnX.unit, y, { width: 60, align: 'right' });
        doc.text(formatMoney(item.lineTotal, currency), columnX.total, y, { width: 70, align: 'right' });

        y += rowHeight;
    }

    return y;
}

router.use(requireAuth);
router.use(requireTenantAccess);
router.use(requireTenantPermission('receipts.create'));

router.get('/products', async (request, response, next) => {
    try {
        const { rows } = await db.query(
            `SELECT id, sku, name, unit_price
       FROM products
       WHERE company_id = $1
       ORDER BY name ASC`,
            [request.tenant.companyId]
        );

        response.json({ products: rows });
    } catch (error) {
        next(error);
    }
});

router.post('/', async (request, response, next) => {
    try {
        const buyerName = normalizeValue(request.body.buyerName);
        const buyerCompany = normalizeValue(request.body.buyerCompany);
        const buyerEmail = normalizeValue(request.body.buyerEmail);
        const buyerPhone = normalizeValue(request.body.buyerPhone);
        const referenceNumber = normalizeValue(request.body.referenceNumber);
        const notes = normalizeValue(request.body.notes);
        const receiptDate = parseReceiptDate(request.body.receiptDate);

        const items = Array.isArray(request.body.items) ? request.body.items : [];

        if (!buyerName) {
            throw new HttpError(400, 'RECEIPT_VALIDATION_ERROR', 'buyerName is required');
        }

        if (items.length === 0) {
            throw new HttpError(400, 'RECEIPT_VALIDATION_ERROR', 'At least one item is required');
        }

        const parsedItems = items.map((item) => ({
            productId: normalizeValue(item.productId),
            quantity: toNumber(item.quantity, NaN),
            unitPrice: toNumber(item.unitPrice, NaN),
        }));

        const invalidItem = parsedItems.find(
            (item) =>
                !item.productId ||
                !isUuid(item.productId) ||
                !Number.isFinite(item.quantity) ||
                item.quantity <= 0 ||
                (Number.isFinite(item.unitPrice) && item.unitPrice < 0)
        );

        if (invalidItem) {
            throw new HttpError(
                400,
                'RECEIPT_VALIDATION_ERROR',
                'Each item requires a valid productId and a quantity greater than zero'
            );
        }

        const productIds = Array.from(new Set(parsedItems.map((item) => item.productId)));
        const { rows } = await db.query(
            `SELECT id, sku, name, unit_price
       FROM products
       WHERE company_id = $1
         AND id = ANY($2::uuid[])`,
            [request.tenant.companyId, productIds]
        );

        if (rows.length !== productIds.length) {
            throw new HttpError(400, 'RECEIPT_VALIDATION_ERROR', 'One or more products were not found');
        }

        const productMap = new Map(rows.map((row) => [row.id, row]));
        const receiptItems = parsedItems.map((item) => {
            const product = productMap.get(item.productId);
            const unitPrice = Number.isFinite(item.unitPrice)
                ? item.unitPrice
                : Number(product.unit_price || 0);
            const lineTotal = unitPrice * item.quantity;

            return {
                productId: item.productId,
                sku: product.sku,
                name: product.name,
                quantity: item.quantity,
                unitPrice,
                lineTotal,
            };
        });

        const subtotal = receiptItems.reduce((sum, item) => sum + item.lineTotal, 0);
        const total = subtotal;
        const currency = request.tenant.plan?.currencyCode || 'EUR';
        const companyName = request.tenant.company?.name || 'Company';
        const companyId = request.tenant.companyId;
        const issuedBy = request.user?.fullName || request.user?.email || 'Staff';

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('error', next);
        doc.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const safeDate = receiptDate.toISOString().slice(0, 10);
            const fileBase = referenceNumber || `PR-${safeDate}`;

            response.setHeader('Content-Type', 'application/pdf');
            response.setHeader(
                'Content-Disposition',
                `attachment; filename="${fileBase}.pdf"`
            );
            response.send(buffer);
        });

        doc.fontSize(20).fillColor('#111827').text('Purchase Receipt', { align: 'left' });
        doc.moveDown(0.6);
        doc.fontSize(10).fillColor('#6b7280').text(`Reference: ${referenceNumber || 'Auto-generated'}`);
        doc.text(`Date: ${formatDate(receiptDate)}`);
        doc.text(`Issued by: ${issuedBy}`);

        doc.moveDown(0.8);
        doc.fontSize(12).fillColor('#111827').text('Company');
        doc.fontSize(10).fillColor('#6b7280');
        doc.text(companyName);
        doc.text(`Company ID: ${companyId}`);

        doc.moveDown(0.8);
        doc.fontSize(12).fillColor('#111827').text('Buyer');
        doc.fontSize(10).fillColor('#6b7280');
        doc.text(buyerName);
        if (buyerCompany) {
            doc.text(buyerCompany);
        }
        if (buyerEmail) {
            doc.text(buyerEmail);
        }
        if (buyerPhone) {
            doc.text(buyerPhone);
        }

        if (notes) {
            doc.moveDown(0.6);
            doc.fontSize(10).fillColor('#111827').text('Notes');
            doc.fontSize(10).fillColor('#6b7280').text(notes);
        }

        doc.moveDown(1.2);
        const tableEndY = renderLineItems(doc, receiptItems, currency, doc.y);

        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#111827');
        doc.text(`Subtotal: ${formatMoney(subtotal, currency)}`, 370, tableEndY + 10, {
            align: 'right',
            width: 175,
        });
        doc.text(`Total: ${formatMoney(total, currency)}`, 370, tableEndY + 26, {
            align: 'right',
            width: 175,
        });

        doc.end();
    } catch (error) {
        next(error);
    }
});

export default router;
