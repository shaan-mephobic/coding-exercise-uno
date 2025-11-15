import sys
import os
import random

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import SessionLocal, PurchaseOrder
from datetime import date, timedelta

# Sample item names for variety
ITEM_NAMES = [
    "Laptop",
    "Desktop Computer",
    "Monitor",
    "Keyboard",
    "Mouse",
    "Office Chair",
    "Desk",
    "Printer",
    "Scanner",
    "Webcam",
    "Headphones",
    "Microphone",
    "USB Cable",
    "HDMI Cable",
    "Router",
    "Switch",
    "Tablet",
    "Smartphone",
    "Hard Drive",
    "SSD",
    "RAM Module",
    "Graphics Card",
    "Motherboard",
    "CPU",
    "Power Supply",
    "Phone Case",
    "Screen Protector",
    "Charging Cable",
    "Adapter",
    "Hub",
    "Docking Station",
    "Ergonomic Mouse",
    "Mechanical Keyboard",
    "Speakers",
    "Projector",
    "Whiteboard",
    "Marker Set",
    "Notebook",
    "Pen Set",
    "Stapler",
    "Paper Ream",
    "File Cabinet",
    "Bookshelf",
    "Lamp",
    "Extension Cord",
    "Surge Protector",
    "Label Maker",
    "Calculator",
    "Shredder",
    "Coffee Maker",
]

# Sample statuses
STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"]

# Sample vendors
VENDORS = [
    "TechCorp Inc.",
    "Office Supplies Co.",
    "Global Electronics",
    "Business Solutions Ltd.",
    "Digital Warehouse",
    "Supply Chain Pro",
    "Enterprise Equipment",
    "Corporate Goods",
    "Wholesale Distributors",
    "Bulk Buyers Inc.",
    "Prime Suppliers",
    "Quality Merchants",
]

# Sample categories
CATEGORIES = [
    "Electronics",
    "Office Supplies",
    "Furniture",
    "Computer Hardware",
    "Peripherals",
    "Networking",
    "Storage",
    "Accessories",
    "Software",
]

# Sample descriptions
DESCRIPTIONS = [
    "High-quality product with warranty",
    "Premium grade item",
    "Standard business model",
    "Enterprise edition",
    "Professional series",
    "Commercial grade",
    "Bulk purchase item",
    "Limited edition",
    "New model 2024",
    "Refurbished unit",
]

# Sample addresses
ADDRESSES = [
    "123 Business Park, Suite 100, New York, NY 10001",
    "456 Corporate Blvd, Floor 5, Los Angeles, CA 90001",
    "789 Industrial Way, Building B, Chicago, IL 60601",
    "321 Commerce St, Unit 200, Houston, TX 77001",
    "654 Trade Center, Office 15, Phoenix, AZ 85001",
]


def add_entries(total_entries, batch_size=10000):
    """
    Add dummy purchase orders to the database.
    Uses batch inserts for better performance.
    """
    db = SessionLocal()

    print(f"Starting to add {total_entries:,} dummy entries...")
    print(f"Batch size: {batch_size:,}")

    start_date = date(2020, 1, 1)
    end_date = date(2025, 12, 31)
    date_range = (end_date - start_date).days

    try:
        for i in range(0, total_entries, batch_size):
            batch = []
            current_batch_size = min(batch_size, total_entries - i)

            for j in range(current_batch_size):
                # Random order date
                order_date = start_date + timedelta(days=random.randint(0, date_range))
                # Delivery date is 5-30 days after order date
                delivery_date = order_date + timedelta(days=random.randint(5, 30))

                # Random item
                item_name = random.choice(ITEM_NAMES)

                # Random quantity (1-100)
                quantity = random.randint(1, 100)

                # Random unit price ($10-$2000)
                unit_price = round(random.uniform(10.0, 2000.0), 2)

                # Calculate total
                total_price = round(quantity * unit_price, 2)

                # Random status (weighted towards common statuses)
                status = random.choices(
                    STATUSES,
                    weights=[
                        30,
                        25,
                        20,
                        20,
                        5,
                    ],
                )[0]

                vendor = (
                    random.choice(VENDORS) if random.random() > 0.1 else None
                )

                category = (
                    random.choice(CATEGORIES) if random.random() > 0.15 else None
                )

                description = (
                    random.choice(DESCRIPTIONS) if random.random() > 0.3 else None
                )

                shipping_address = (
                    random.choice(ADDRESSES) if random.random() > 0.2 else None
                )

                notes = (
                    f"Special instructions: {random.choice(['Rush delivery', 'Handle with care', 'Contact before delivery', 'Leave at front desk', 'Signature required'])}"
                    if random.random() > 0.6
                    else None
                )

                order = PurchaseOrder(
                    item_name=item_name,
                    order_date=order_date,
                    delivery_date=delivery_date,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price,
                    status=status,
                    vendor=vendor,
                    category=category,
                    description=description,
                    shipping_address=shipping_address,
                    notes=notes,
                )
                batch.append(order)

            # Bulk insert
            db.bulk_save_objects(batch)
            db.commit()

            completed = i + current_batch_size
            progress = (completed / total_entries) * 100
            print(f"Progress: {completed:,} / {total_entries:,} ({progress:.1f}%)")

        print(f"\n✓ Successfully added {total_entries:,} entries to the database!")

    except Exception as e:
        print(f"\n✗ Error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # You can adjust batch size if needed
    total_entries = 100000
    batch_size = 100000

    if len(sys.argv) > 1:
        try:
            batch_size = int(sys.argv[1])
        except ValueError:
            print("Invalid batch size. Using default: 10000")

    add_entries(total_entries, batch_size)
