# StockPro API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api/v1` (development)  
**Authentication:** Bearer Token (JWT)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Inventory Management](#inventory-management)
3. [Purchase Orders](#purchase-orders)
4. [Sales Orders](#sales-orders)
5. [Suppliers & Customers](#suppliers--customers)
6. [Reports & Analytics](#reports--analytics)
7. [Notifications](#notifications)
8. [Team Management](#team-management)
9. [Error Handling](#error-handling)

---

## Authentication

### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}

Response: 
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@company.com",
      "fullName": "John Doe",
      "role": "company_admin"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123!"
}

Response:
{
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": { ... }
  }
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer {accessToken}

Response:
{
  "data": { "status": "logged_out" }
}
```

---

## Inventory Management

### Get Products
```
GET /company/products
Authorization: Bearer {accessToken}

Query Parameters:
- search: string (optional)
- status: "active" | "inactive" (optional)
- limit: number (default: 100)
- offset: number (default: 0)

Response:
{
  "data": {
    "products": [
      {
        "id": "uuid",
        "companyId": "uuid",
        "sku": "SKU-001",
        "name": "Product Name",
        "description": "Description",
        "unitPrice": 29.99,
        "quantityInStock": 150,
        "lowStockThreshold": 20,
        "isActive": true,
        "createdAt": "2026-05-14T10:00:00Z",
        "updatedAt": "2026-05-14T10:00:00Z"
      }
    ],
    "total": 1,
    "limit": 100,
    "offset": 0
  }
}
```

### Create Product
```
POST /company/products
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "sku": "SKU-001",
  "name": "Product Name",
  "description": "Optional description",
  "unitPrice": 29.99,
  "quantityInStock": 100,
  "lowStockThreshold": 20
}

Response: (201 Created)
{
  "data": {
    "product": { ... }
  }
}
```

### Update Product
```
PATCH /company/products/{productId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Updated Name",
  "unitPrice": 39.99,
  "lowStockThreshold": 25
}

Response:
{
  "data": { "product": { ... } }
}
```

### Record Stock Movement
```
POST /company/products/{productId}/move
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "movementType": "in" | "out" | "adjustment",
  "quantity": 50,
  "note": "Restock from supplier"
}

Response:
{
  "data": {
    "movement": {
      "id": "uuid",
      "productId": "uuid",
      "movementType": "in",
      "quantity": 50,
      "newQuantity": 200,
      "note": "Restock from supplier",
      "movedBy": "uuid",
      "createdAt": "2026-05-14T10:00:00Z"
    }
  }
}
```

---

## Purchase Orders

### List Purchase Orders
```
GET /purchase-orders
Authorization: Bearer {accessToken}

Query Parameters:
- status: "pending" | "received" | "cancelled" (optional)
- limit: number (default: 100)
- offset: number (default: 0)

Response:
{
  "data": {
    "purchaseOrders": [
      {
        "id": "uuid",
        "supplierId": "uuid",
        "supplierName": "Supplier Inc",
        "status": "pending",
        "totalAmount": 5000.00,
        "items": [
          {
            "productId": "uuid",
            "productName": "Product A",
            "quantity": 100,
            "unitPrice": 50.00
          }
        ],
        "notes": "Rush order",
        "createdAt": "2026-05-14T10:00:00Z"
      }
    ]
  }
}
```

### Create Purchase Order
```
POST /purchase-orders
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "supplierId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 100,
      "unitPrice": 50.00
    }
  ],
  "notes": "Optional notes"
}

Response: (201 Created)
{
  "data": {
    "purchaseOrder": { ... }
  }
}
```

### Receive Purchase Order
```
POST /purchase-orders/{orderId}/receive
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "receivedItems": [
    {
      "productId": "uuid",
      "quantity": 100
    }
  ]
}

Response:
{
  "data": {
    "purchaseOrder": {
      "status": "received",
      ...
    }
  }
}
```

---

## Sales Orders

### List Sales Orders
```
GET /sales-orders
Authorization: Bearer {accessToken}

Query Parameters:
- status: "pending" | "processing" | "shipped" | "completed" (optional)
- limit: number
- offset: number

Response:
{
  "data": {
    "salesOrders": [
      {
        "id": "uuid",
        "customerId": "uuid",
        "customerName": "Customer Name",
        "status": "pending",
        "totalAmount": 1500.00,
        "items": [ ... ],
        "trackingNumber": null,
        "createdAt": "2026-05-14T10:00:00Z"
      }
    ]
  }
}
```

### Create Sales Order
```
POST /sales-orders
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "customerId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 50,
      "unitPrice": 30.00
    }
  ]
}

Response: (201 Created)
{
  "data": { "salesOrder": { ... } }
}
```

### Ship Sales Order
```
POST /sales-orders/{orderId}/ship
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "trackingNumber": "TRACK123456"
}

Response:
{
  "data": {
    "salesOrder": {
      "status": "shipped",
      "trackingNumber": "TRACK123456",
      ...
    }
  }
}
```

---

## Suppliers & Customers

### List Suppliers
```
GET /suppliers
Authorization: Bearer {accessToken}

Response:
{
  "data": {
    "suppliers": [
      {
        "id": "uuid",
        "name": "Supplier Name",
        "email": "contact@supplier.com",
        "phone": "+1234567890",
        "address": "123 Main St",
        "isActive": true
      }
    ]
  }
}
```

### Create Supplier
```
POST /suppliers
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Supplier Name",
  "email": "contact@supplier.com",
  "phone": "+1234567890",
  "address": "123 Main St"
}

Response: (201 Created)
{
  "data": { "supplier": { ... } }
}
```

### List Customers
```
GET /customers
Authorization: Bearer {accessToken}

Response:
{
  "data": {
    "customers": [
      {
        "id": "uuid",
        "name": "Customer Name",
        "email": "customer@email.com",
        "phone": "+1234567890",
        "address": "123 Main St",
        "totalOrders": 5,
        "totalSpent": 5000.00
      }
    ]
  }
}
```

### Create Customer
```
POST /customers
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Customer Name",
  "email": "customer@email.com",
  "phone": "+1234567890",
  "address": "123 Main St"
}

Response: (201 Created)
{
  "data": { "customer": { ... } }
}
```

---

## Reports & Analytics

### Get Dashboard Overview
```
GET /dashboard/overview
Authorization: Bearer {accessToken}

Response:
{
  "data": {
    "lowStockItems": 5,
    "totalInventoryValue": 50000.00,
    "activeSalesOrders": 12
  }
}
```

### Get Report Summary
```
GET /reports/summary
Authorization: Bearer {accessToken}

Response:
{
  "data": {
    "totalProducts": 150,
    "totalRevenue": 125000.00,
    "averageOrderValue": 2500.00,
    "topProducts": [
      {
        "id": "uuid",
        "name": "Best Seller",
        "salesCount": 500,
        "totalRevenue": 15000.00
      }
    ]
  }
}
```

### Get Low Stock Report
```
GET /reports/low-stock
Authorization: Bearer {accessToken}

Response:
{
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "sku": "SKU-001",
      "quantityInStock": 10,
      "lowStockThreshold": 25
    }
  ]
}
```

---

## Notifications

### Send Low Stock Alert
```
POST /notifications/low-stock-alert
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "email": "admin@company.com",
  "companyName": "Company Name",
  "products": [
    {
      "name": "Product A",
      "sku": "SKU-001",
      "quantityInStock": 10,
      "lowStockThreshold": 25
    }
  ]
}

Response:
{
  "data": { "success": true, "message": "Low stock alert sent" }
}
```

### Send Purchase Order Notification
```
POST /notifications/purchase-order-received
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "email": "supplier@email.com",
  "companyName": "Company Name",
  "supplierId": "uuid",
  "orderTotal": 5000.00,
  "itemCount": 3
}

Response:
{
  "data": { "success": true, "message": "Purchase order notification sent" }
}
```

### Send Order Shipped Notification
```
POST /notifications/order-shipped
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "email": "customer@email.com",
  "customerName": "Customer Name",
  "orderId": "uuid",
  "trackingNumber": "TRACK123456"
}

Response:
{
  "data": { "success": true, "message": "Order shipped notification sent" }
}
```

### Send Employee Invitation
```
POST /notifications/employee-invitation
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "email": "newemployee@company.com",
  "fullName": "New Employee",
  "companyName": "Company Name",
  "inviteToken": "token_here"
}

Response:
{
  "data": { "success": true, "message": "Employee invitation sent" }
}
```

### Send Daily Summary
```
POST /notifications/daily-summary
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "email": "admin@company.com",
  "companyName": "Company Name",
  "summary": {
    "totalOrders": 25,
    "completedOrders": 20,
    "pendingOrders": 5,
    "lowStockItems": 3,
    "totalRevenue": 50000.00
  }
}

Response:
{
  "data": { "success": true, "message": "Daily summary sent" }
}
```

---

## Team Management

### Get Employees
```
GET /company/employees
Authorization: Bearer {accessToken}

Response:
{
  "data": {
    "employees": [
      {
        "id": "uuid",
        "fullName": "Employee Name",
        "email": "employee@company.com",
        "username": "employee_name",
        "role": "employee",
        "permissions": { ... },
        "isActive": true,
        "createdAt": "2026-05-14T10:00:00Z"
      }
    ]
  }
}
```

### Create Employee
```
POST /company/employees
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "fullName": "Employee Name",
  "email": "employee@company.com",
  "username": "employee_name",
  "password": "SecurePass123!",
  "presetKey": "viewer" | "editor" | "admin" (optional),
  "permissions": { ... } (optional)
}

Response: (201 Created)
{
  "data": { "employee": { ... } }
}
```

### Update Employee
```
PATCH /company/employees/{employeeId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "fullName": "Updated Name",
  "permissions": { ... }
}

Response:
{
  "data": { "employee": { ... } }
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {} // Optional
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CONFLICT` | 409 | Duplicate resource or state conflict |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Environment Variables Required

```
# Database
DB_HOST=localhost
DB_PORT=9100
DB_NAME=stockpro_db
DB_USER=stockpro_user
DB_PASSWORD=secure_password

# Server
PORT=5000

# JWT
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=604800
JWT_SESSION_MAX_LIFETIME_SECONDS=2592000

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-specific-password
SMTP_FROM_EMAIL=noreply@stockpro.app

# Application
APP_URL=http://localhost:5173
```

---

## Rate Limits

- **Login:** 10 requests per 60 seconds per IP
- **Register:** 5 requests per 60 seconds per IP
- **Refresh Token:** 20 requests per 60 seconds per IP

---

## Pagination

All list endpoints support pagination:

```
GET /resource?limit=50&offset=0
```

- `limit`: Number of items per page (default: 100, max: 500)
- `offset`: Number of items to skip (default: 0)

---

For more information and real-time API documentation, visit: `http://localhost:5000/docs`
