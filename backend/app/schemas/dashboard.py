from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_count: int


class LowStockProduct(BaseModel):
    id: int
    name: str
    sku: str
    stock: int
    threshold: int
