# Inventory & Order Management System

A small full-stack app for managing products, customers, orders, and stock levels. Built with FastAPI + PostgreSQL on the backend and React (Vite) on the frontend.

## Why this stack

- **FastAPI** — quick to build REST APIs with automatic OpenAPI docs, solid validation via Pydantic, and good async support if you need it later.
- **PostgreSQL** — relational data (orders, line items, stock) fits naturally here. Row-level locking (`SELECT FOR UPDATE`) makes concurrent order placement safer than doing everything in SQLite for a multi-user setup.
- **React + Vite** — fast dev server, simple deployment as static files behind nginx.

## Architecture

```
backend/app/
├── main.py          # App entry, CORS, router registration
├── database.py      # SQLAlchemy engine + session
├── models/          # ORM models
├── schemas/         # Pydantic request/response models
├── routers/         # HTTP layer (thin)
├── services/        # Business logic (stock checks, transactions)
└── utils/           # Logging setup

frontend/src/
├── pages/           # Route-level screens
├── components/      # Shared UI (layout, modal, pagination)
├── services/        # Axios API client
└── hooks/           # useDebounce for search
```

Routers stay thin; services own validation and transactions. No extra repository layer — for a project this size, SQLAlchemy sessions in services are enough.

**Order flow:** validate customer → lock products (`with_for_update`) → check stock → create order + line items → deduct stock → commit. If anything fails, the transaction rolls back.

**Low stock:** products at or below `LOW_STOCK_THRESHOLD` (default 10) show up on the dashboard and are highlighted in the product list.

## Prerequisites

- Docker & Docker Compose, or
- Python 3.12+, Node 20+, PostgreSQL 16

## Quick start (Docker)

```bash
cp .env.example .env
# edit .env if you want different credentials

docker compose up --build
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:8000  
- API docs: http://localhost:8000/docs  

## Local development (without Docker)

### Database

Start PostgreSQL and create a database matching your `DATABASE_URL`.

### Backend

```bash
cd backend
cp .env.example .env
# set DATABASE_URL=postgresql://user:pass@localhost:5432/inventory_db

python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8000` in dev mode.

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (backend) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `LOW_STOCK_THRESHOLD` | Stock level at or below = low stock (default 10) |
| `POSTGRES_*` | DB credentials for Docker Compose |
| `VITE_API_URL` | API base URL for frontend build |

## API endpoints

Base path: `/api`

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/stats` | Totals for products, customers, orders, low-stock count |

### Products

| Method | Path | Description |
|--------|------|-------------|
| GET | `/products` | List (`page`, `page_size`, `search`) |
| GET | `/products/low-stock` | Products at or below threshold |
| GET | `/products/{id}` | Single product |
| POST | `/products` | Create (SKU must be unique) |
| PUT | `/products/{id}` | Update |
| DELETE | `/products/{id}` | Delete |

### Customers

| Method | Path | Description |
|--------|------|-------------|
| GET | `/customers` | List (`page`, `page_size`, `search`) |
| GET | `/customers/{id}` | Single customer |
| POST | `/customers` | Create (email must be unique) |
| PUT | `/customers/{id}` | Update |
| DELETE | `/customers/{id}` | Delete |

### Orders

| Method | Path | Description |
|--------|------|-------------|
| GET | `/orders` | List (`page`, `page_size`, `status`) |
| GET | `/orders/export/csv` | Download orders as CSV |
| GET | `/orders/{id}` | Order with line items |
| POST | `/orders` | Create order (validates stock, deducts on success) |
| PATCH | `/orders/{id}/status` | Update status (`Pending` / `Completed`) |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

## Business rules

- SKU and email are unique (DB constraint + 409 on conflict).
- Orders rejected with 400 if stock is insufficient.
- Stock cannot go negative (check constraint + service validation).
- Order creation runs in a single DB transaction with row locks on products.

## Project notes

- Tables are created on startup via SQLAlchemy `create_all`. Fine for a demo; use Alembic if this goes to production.
- Successful orders are marked `Completed` after stock is deducted. Status can still be updated via PATCH for manual corrections.
- CSV export includes one row per line item.
