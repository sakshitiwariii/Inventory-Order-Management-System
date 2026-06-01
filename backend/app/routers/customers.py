import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerListResponse,
)
from app.services.customer_service import CustomerService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=CustomerListResponse)
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
):
    items, total = CustomerService.list_customers(db, page, page_size, search)
    return CustomerListResponse(
        items=items, total=total, page=page, page_size=page_size
    )


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = CustomerService.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("", response_model=CustomerResponse, status_code=201)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    try:
        return CustomerService.create_customer(db, data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, data: CustomerUpdate, db: Session = Depends(get_db)):
    try:
        customer = CustomerService.update_customer(db, customer_id, data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.delete("/{customer_id}", status_code=204)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    if not CustomerService.delete_customer(db, customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
