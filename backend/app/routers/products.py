import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.services.product_service import ProductService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
):
    items, total = ProductService.list_products(db, page, page_size, search)
    return ProductListResponse(
        items=items, total=total, page=page, page_size=page_size
    )


@router.get("/low-stock")
def low_stock_products(db: Session = Depends(get_db)):
    products = ProductService.get_low_stock_products(db)
    threshold = ProductService.get_low_stock_threshold()
    return {
        "threshold": threshold,
        "items": [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "stock": p.stock,
                "threshold": threshold,
            }
            for p in products
        ],
    }


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = ProductService.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=201)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    try:
        return ProductService.create_product(db, data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    try:
        product = ProductService.update_product(db, product_id, data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    if not ProductService.delete_product(db, product_id):
        raise HTTPException(status_code=404, detail="Product not found")
