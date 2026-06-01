import os
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate

LOW_STOCK_THRESHOLD = int(os.getenv("LOW_STOCK_THRESHOLD", "10"))


class ProductService:
    @staticmethod
    def get_low_stock_threshold() -> int:
        return LOW_STOCK_THRESHOLD

    @staticmethod
    def list_products(
        db: Session, page: int, page_size: int, search: str | None = None
    ) -> tuple[list[Product], int]:
        query = db.query(Product)
        if search:
            term = f"%{search}%"
            query = query.filter(
                or_(Product.name.ilike(term), Product.sku.ilike(term))
            )
        total = query.count()
        items = (
            query.order_by(Product.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    @staticmethod
    def get_product(db: Session, product_id: int) -> Product | None:
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    def create_product(db: Session, data: ProductCreate) -> Product:
        product = Product(**data.model_dump())
        db.add(product)
        try:
            db.commit()
            db.refresh(product)
        except IntegrityError:
            db.rollback()
            raise ValueError("SKU already exists")
        return product

    @staticmethod
    def update_product(db: Session, product_id: int, data: ProductUpdate) -> Product:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(product, key, value)
        try:
            db.commit()
            db.refresh(product)
        except IntegrityError:
            db.rollback()
            raise ValueError("SKU already exists")
        return product

    @staticmethod
    def delete_product(db: Session, product_id: int) -> bool:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return False
        db.delete(product)
        db.commit()
        return True

    @staticmethod
    def get_low_stock_products(db: Session) -> list[Product]:
        return (
            db.query(Product)
            .filter(Product.stock <= LOW_STOCK_THRESHOLD)
            .order_by(Product.stock.asc())
            .all()
        )
