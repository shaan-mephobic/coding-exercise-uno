import os
from typing import List, Optional
from datetime import date, datetime
from enum import Enum

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, Text, Index, and_, or_, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/purchase_orders")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Enums
class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

# Database model
class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String, nullable=False, index=True)
    order_date = Column(Date, nullable=False, index=True)
    delivery_date = Column(Date, nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False, index=True)
    
    # New fields for extended functionality
    status = Column(String, nullable=False, default="pending", index=True)
    description = Column(Text, nullable=True)
    vendor = Column(String, nullable=True, index=True)
    shipping_address = Column(Text, nullable=True)
    category = Column(String, nullable=True, index=True)
    notes = Column(Text, nullable=True)
    
    # Composite indexes for common query patterns
    __table_args__ = (
        Index('idx_order_date_status', 'order_date', 'status'),
        Index('idx_item_name_status', 'item_name', 'status'),
        Index('idx_total_price_status', 'total_price', 'status'),
    )

# Pydantic models
class PurchaseOrderBase(BaseModel):
    item_name: str
    order_date: date
    delivery_date: date
    quantity: int
    unit_price: float
    status: Optional[str] = "pending"
    description: Optional[str] = None
    vendor: Optional[str] = None
    shipping_address: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    pass

class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    total_price: float

    class Config:
        from_attributes = True

# Pagination models
class PaginationMeta(BaseModel):
    cursor: Optional[str] = None
    has_next: bool
    has_prev: bool
    page_size: int

class PaginatedResponse(BaseModel):
    data: List[PurchaseOrderResponse]
    meta: PaginationMeta

Base.metadata.create_all(bind=engine)

# Helper function to add missing columns (for development)
def ensure_columns_exist():
    """Add missing columns to existing table if they don't exist"""
    from sqlalchemy import inspect, text
    try:
        inspector = inspect(engine)
        if 'purchase_orders' not in inspector.get_table_names():
            return  # Table doesn't exist yet, will be created by create_all
        
        columns = [col['name'] for col in inspector.get_columns('purchase_orders')]
        
        with engine.connect() as conn:
            if 'status' not in columns:
                conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN status VARCHAR DEFAULT 'pending'"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status)"))
            if 'description' not in columns:
                conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN description TEXT"))
            if 'vendor' not in columns:
                conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN vendor VARCHAR"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor)"))
            if 'shipping_address' not in columns:
                conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN shipping_address TEXT"))
            if 'category' not in columns:
                conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN category VARCHAR"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_purchase_orders_category ON purchase_orders(category)"))
            if 'notes' not in columns:
                conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN notes TEXT"))
            conn.commit()
    except Exception as e:
        pass

try:
    ensure_columns_exist()
except Exception:
    pass

# FastAPI app
app = FastAPI(title="Purchase Order API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def encode_cursor(order_id: int, sort_field: str, sort_value) -> str:
    """Encode cursor from order ID and sort field value"""
    import base64
    import json
    cursor_data = {
        "id": order_id,
        "sort_field": sort_field,
        "sort_value": str(sort_value)
    }
    return base64.urlsafe_b64encode(json.dumps(cursor_data).encode()).decode()

def decode_cursor(cursor: str) -> dict:
    """Decode cursor to get order ID and sort field value"""
    import base64
    import json
    try:
        decoded = base64.urlsafe_b64decode(cursor.encode()).decode()
        return json.loads(decoded)
    except:
        return None

def build_query_filters(
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    vendor: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_date: Optional[date] = None,
    max_date: Optional[date] = None,
):
    """Build query with filters"""
    query = db.query(PurchaseOrder)
    
    if search:
        search_pattern = f"%{search}%"
        search_filter = or_(
            PurchaseOrder.item_name.ilike(search_pattern),
            PurchaseOrder.description.ilike(search_pattern),
            PurchaseOrder.vendor.ilike(search_pattern),
            PurchaseOrder.category.ilike(search_pattern),
        )
        query = query.filter(search_filter)
    
    if status:
        query = query.filter(PurchaseOrder.status == status)
    
    if category:
        query = query.filter(PurchaseOrder.category == category)
    
    if vendor:
        query = query.filter(PurchaseOrder.vendor == vendor)
    
    if min_price is not None:
        query = query.filter(PurchaseOrder.total_price >= min_price)
    
    if max_price is not None:
        query = query.filter(PurchaseOrder.total_price <= max_price)
    
    if min_date:
        query = query.filter(PurchaseOrder.order_date >= min_date)
    
    if max_date:
        query = query.filter(PurchaseOrder.order_date <= max_date)
    
    return query

def apply_sorting(query, sort_by: str = "id", sort_order: str = "asc"):
    """Apply sorting to query"""
    sort_field_map = {
        "id": PurchaseOrder.id,
        "order_date": PurchaseOrder.order_date,
        "delivery_date": PurchaseOrder.delivery_date,
        "total_price": PurchaseOrder.total_price,
        "item_name": PurchaseOrder.item_name,
        "status": PurchaseOrder.status,
        "quantity": PurchaseOrder.quantity,
        "unit_price": PurchaseOrder.unit_price,
    }
    
    sort_field = sort_field_map.get(sort_by, PurchaseOrder.id)
    
    if sort_order.lower() == "desc":
        return query.order_by(sort_field.desc(), PurchaseOrder.id.desc())
    else:
        return query.order_by(sort_field.asc(), PurchaseOrder.id.asc())

# API endpoints
@app.get("/")
def read_root():
    return {"message": "Purchase Order API"}

@app.get("/api/purchase-orders", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(db: Session = Depends(get_db)):
    orders = db.query(PurchaseOrder).limit(1000).all()  # Limit to prevent huge responses
    return orders

@app.get("/api/purchase-orders/paginated", response_model=PaginatedResponse)
def get_purchase_orders_paginated(
    db: Session = Depends(get_db),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    sort_by: str = Query("id", description="Field to sort by (id, order_date, delivery_date, total_price, item_name, status)"),
    sort_order: str = Query("asc", regex="^(asc|desc)$", description="Sort order"),
    search: Optional[str] = Query(None, description="Search in item_name, description, vendor, category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    vendor: Optional[str] = Query(None, description="Filter by vendor"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum total price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum total price"),
    min_date: Optional[date] = Query(None, description="Minimum order date"),
    max_date: Optional[date] = Query(None, description="Maximum order date"),
):

    # Build base query with filters
    query = build_query_filters(
        db, search, status, category, vendor, min_price, max_price, min_date, max_date
    )
    
    # Apply sorting
    query = apply_sorting(query, sort_by, sort_order)
    
    # Handle cursor-based pagination
    if cursor:
        cursor_data = decode_cursor(cursor)
        if cursor_data:
            cursor_id = cursor_data.get("id")
            if sort_order.lower() == "desc":
                # For descending, get records with id < cursor_id
                query = query.filter(PurchaseOrder.id < cursor_id)
            else:
                # For ascending, get records with id > cursor_id
                query = query.filter(PurchaseOrder.id > cursor_id)
    
    # Fetch one extra to check if there's a next page
    orders = query.limit(page_size + 1).all()
    
    has_next = len(orders) > page_size
    if has_next:
        orders = orders[:page_size]
    
    # Determine if there's a previous page
    has_prev = cursor is not None
    
    # Generate next cursor
    next_cursor = None
    if has_next and orders:
        last_order = orders[-1]
        sort_field_map = {
            "id": last_order.id,
            "order_date": str(last_order.order_date),
            "delivery_date": str(last_order.delivery_date),
            "total_price": last_order.total_price,
            "item_name": last_order.item_name,
            "status": last_order.status,
            "quantity": last_order.quantity,
            "unit_price": last_order.unit_price,
        }
        sort_value = sort_field_map.get(sort_by, last_order.id)
        next_cursor = encode_cursor(last_order.id, sort_by, sort_value)
    
    return PaginatedResponse(
        data=orders,
        meta=PaginationMeta(
            cursor=next_cursor,
            has_next=has_next,
            has_prev=has_prev,
            page_size=page_size
        )
    )

@app.get("/api/purchase-orders/{order_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return order

@app.post("/api/purchase-orders", response_model=PurchaseOrderResponse, status_code=201)
def create_purchase_order(order: PurchaseOrderCreate, db: Session = Depends(get_db)):
    total_price = order.quantity * order.unit_price
    db_order = PurchaseOrder(
        **order.model_dump(),
        total_price=total_price
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@app.delete("/api/purchase-orders/{order_id}", status_code=204)
def delete_purchase_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    db.delete(order)
    db.commit()
    return None
