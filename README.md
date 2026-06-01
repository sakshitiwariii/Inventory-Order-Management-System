# Inventory & Order Management System

This project is an Inventory & Order Management System built using FastAPI, PostgreSQL, SQLAlchemy, React, and Docker. It allows users to manage products, customers, orders, and inventory from a single dashboard. The application validates stock availability before order creation, automatically updates inventory levels after successful orders, and provides dashboard insights such as total products, customers, orders, and low-stock items.

## Implementation Summary
The backend was developed using FastAPI with SQLAlchemy ORM for database operations and PostgreSQL as the primary database. Business rules such as unique SKU and email validation, inventory checks, stock deduction and transactional order processing were implemented on the server side. The frontend was built with React and Vite, providing a responsive interface for managing products, customers, and orders. Axios was used for API communication, while Docker and Docker Compose were used to containerize the application for consistent local development. For deployment, the backend was connected to a Neon PostgreSQL database and hosted separately from the frontend, which was deployed on Vercel.

## Architecture

```
backend/app/
├── main.py          
├── database.py      
├── models/          
├── schemas/         
├── routers/         
├── services/        
└── utils/           

frontend/src/
├── pages/           
├── components/      
├── services/        # Axios API client
└── hooks/           
```


**Order flow:** validate customer → lock products (`with_for_update`) → check stock → create order + line items → deduct stock → commit. If anything fails, the transaction rolls back.

**Low stock:** products at or below `LOW_STOCK_THRESHOLD` (default 10) show up on the dashboard and are highlighted in the product list.


## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (backend) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `LOW_STOCK_THRESHOLD` | Stock level at or below = low stock (default 10) |
| `POSTGRES_*` | DB credentials for Docker Compose |
| `VITE_API_URL` | API base URL for frontend build |


## API Overview

The backend exposes a small set of REST APIs for managing products, customers, inventory, and orders.

## Dashboard
GET /dashboard/stats – Returns overall statistics such as total products, customers, orders, and low-stock items.
## Products
GET /products – Fetch products with search and pagination support.
GET /products/{id} – Get details of a specific product.
GET /products/low-stock – View products running low on stock.
POST /products – Add a new product.
PUT /products/{id} – Update product details.
DELETE /products/{id} – Remove a product.
## Customers
GET /customers – Fetch customers with search and pagination.
GET /customers/{id} – Get customer details.
POST /customers – Create a customer record.
PUT /customers/{id} – Update customer information.
DELETE /customers/{id} – Delete a customer.
## Orders
GET /orders – List all orders with filtering options.
GET /orders/{id} – View a specific order and its items.
POST /orders – Create a new order after validating inventory.
PATCH /orders/{id}/status – Update order status.
GET /orders/export/csv – Export order data as a CSV file.
## Health Check
GET /health – Simple endpoint used to verify that the API is running.


## Business rules

- SKU and email are unique (DB constraint + 409 on conflict).
- Orders rejected with 400 if stock is insufficient.
- Stock cannot go negative (check constraint + service validation).
- Order creation runs in a single DB transaction with row locks on products.

## Deployment Links 
Frontend url:https://inventory-order-management-system-k.vercel.app/
Backend url :https://inventory-order-management-system-orcin.vercel.app/

