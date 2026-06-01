from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CustomerService:
    @staticmethod
    def list_customers(
        db: Session, page: int, page_size: int, search: str | None = None
    ) -> tuple[list[Customer], int]:
        query = db.query(Customer)
        if search:
            term = f"%{search}%"
            query = query.filter(
                or_(Customer.name.ilike(term), Customer.email.ilike(term))
            )
        total = query.count()
        items = (
            query.order_by(Customer.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    @staticmethod
    def get_customer(db: Session, customer_id: int) -> Customer | None:
        return db.query(Customer).filter(Customer.id == customer_id).first()

    @staticmethod
    def create_customer(db: Session, data: CustomerCreate) -> Customer:
        customer = Customer(**data.model_dump())
        db.add(customer)
        try:
            db.commit()
            db.refresh(customer)
        except IntegrityError:
            db.rollback()
            raise ValueError("Email already exists")
        return customer

    @staticmethod
    def update_customer(db: Session, customer_id: int, data: CustomerUpdate) -> Customer:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(customer, key, value)
        try:
            db.commit()
            db.refresh(customer)
        except IntegrityError:
            db.rollback()
            raise ValueError("Email already exists")
        return customer

    @staticmethod
    def delete_customer(db: Session, customer_id: int) -> bool:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return False
        db.delete(customer)
        db.commit()
        return True
