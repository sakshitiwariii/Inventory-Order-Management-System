import csv
import io
import logging
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import OrderCreate

logger = logging.getLogger(__name__)


class OrderService:
    @staticmethod
    def list_orders(
        db: Session, page: int, page_size: int, status: OrderStatus | None = None
    ) -> tuple[list[Order], int]:
        query = db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.customer),
        )
        if status:
            query = query.filter(Order.status == status)
        total = query.count()
        items = (
            query.order_by(Order.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    @staticmethod
    def get_order(db: Session, order_id: int) -> Order | None:
        return (
            db.query(Order)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product),
                joinedload(Order.customer),
            )
            .filter(Order.id == order_id)
            .first()
        )

    @staticmethod
    def create_order(db: Session, data: OrderCreate) -> Order:
        customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
        if not customer:
            raise ValueError("Customer not found")

        product_ids = [item.product_id for item in data.items]
        products = {
            p.id: p
            for p in db.query(Product).filter(Product.id.in_(product_ids)).with_for_update().all()
        }

        if len(products) != len(set(product_ids)):
            raise ValueError("One or more products not found")

        qty_by_product: dict[int, int] = {}
        for item in data.items:
            qty_by_product[item.product_id] = qty_by_product.get(item.product_id, 0) + item.quantity

        for pid, qty in qty_by_product.items():
            product = products[pid]
            if product.stock < qty:
                raise ValueError(
                    f"Insufficient stock for {product.name} (SKU: {product.sku}). "
                    f"Available: {product.stock}, requested: {qty}"
                )

        try:
            order = Order(
                customer_id=data.customer_id,
                status=OrderStatus.PENDING,
                total_amount=Decimal("0"),
            )
            db.add(order)
            db.flush()

            total = Decimal("0")
            for item in data.items:
                product = products[item.product_id]
                unit_price = Decimal(str(product.price))
                subtotal = unit_price * item.quantity
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=item.quantity,
                    unit_price=unit_price,
                    subtotal=subtotal,
                )
                db.add(order_item)
                total += subtotal

            for pid, qty in qty_by_product.items():
                products[pid].stock -= qty

            order.total_amount = total
            order.status = OrderStatus.COMPLETED
            db.commit()
            db.refresh(order)
            logger.info("Order %s created for customer %s", order.id, data.customer_id)
            return OrderService.get_order(db, order.id)
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def update_status(db: Session, order_id: int, status: OrderStatus) -> Order | None:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return None
        order.status = status
        db.commit()
        db.refresh(order)
        return OrderService.get_order(db, order_id)

    @staticmethod
    def export_orders_csv(db: Session) -> str:
        orders = (
            db.query(Order)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product),
                joinedload(Order.customer),
            )
            .order_by(Order.id.desc())
            .all()
        )
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "Order ID",
                "Customer",
                "Status",
                "Product",
                "SKU",
                "Quantity",
                "Unit Price",
                "Subtotal",
                "Order Total",
                "Created At",
            ]
        )
        for order in orders:
            for idx, item in enumerate(order.items):
                writer.writerow(
                    [
                        order.id,
                        order.customer.name if order.customer else "",
                        order.status.value,
                        item.product.name if item.product else "",
                        item.product.sku if item.product else "",
                        item.quantity,
                        item.unit_price,
                        item.subtotal,
                        order.total_amount if idx == 0 else "",
                        order.created_at.isoformat() if idx == 0 else "",
                    ]
                )
        return output.getvalue()
