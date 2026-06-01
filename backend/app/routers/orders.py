import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import OrderStatus
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse, OrderStatusUpdate
from app.services.order_service import OrderService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/orders", tags=["orders"])


def _order_to_response(order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name if order.customer else None,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=[
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else None,
                "product_sku": item.product.sku if item.product else None,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
            }
            for item in order.items
        ],
    )


@router.get("", response_model=OrderListResponse)
def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: OrderStatus | None = None,
    db: Session = Depends(get_db),
):
    items, total = OrderService.list_orders(db, page, page_size, status)
    return OrderListResponse(
        items=[_order_to_response(o) for o in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/export/csv")
def export_orders_csv(db: Session = Depends(get_db)):
    csv_content = OrderService.export_orders_csv(db)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders.csv"},
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = OrderService.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _order_to_response(order)


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    try:
        order = OrderService.create_order(db, data)
        return _order_to_response(order)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int, data: OrderStatusUpdate, db: Session = Depends(get_db)
):
    order = OrderService.update_status(db, order_id, data.status)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _order_to_response(order)
