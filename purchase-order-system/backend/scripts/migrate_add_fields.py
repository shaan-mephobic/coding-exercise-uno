"""
Migration script to add new fields to purchase_orders table.
Run this script to add the new columns (status, description, vendor, shipping_address, category, notes)
to an existing database.

Usage:
    docker exec -it purchase_order_backend python scripts/migrate_add_fields.py
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import engine, PurchaseOrder
from sqlalchemy import inspect, text

def migrate_database():
    """Add missing columns and indexes to the purchase_orders table"""
    print("\n" + "="*70)
    print("DATABASE MIGRATION: Adding New Fields".center(70))
    print("="*70 + "\n")
    
    try:
        inspector = inspect(engine)
        
        # Check if table exists
        if 'purchase_orders' not in inspector.get_table_names():
            print("❌ Table 'purchase_orders' does not exist.")
            print("   Please run the application first to create the table.")
            return False
        
        # Get existing columns
        columns = {col['name']: col for col in inspector.get_columns('purchase_orders')}
        print(f"📊 Found {len(columns)} existing columns in purchase_orders table\n")
        
        changes_made = False
        
        with engine.connect() as conn:
            # Add status column
            if 'status' not in columns:
                print("➕ Adding 'status' column...")
                conn.execute(text("""
                    ALTER TABLE purchase_orders 
                    ADD COLUMN status VARCHAR DEFAULT 'pending' NOT NULL
                """))
                conn.execute(text("""
                    UPDATE purchase_orders 
                    SET status = 'pending' 
                    WHERE status IS NULL
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_purchase_orders_status 
                    ON purchase_orders(status)
                """))
                print("   ✓ Added 'status' column with index\n")
                changes_made = True
            else:
                print("   ✓ 'status' column already exists\n")
            
            # Add description column
            if 'description' not in columns:
                print("➕ Adding 'description' column...")
                conn.execute(text("""
                    ALTER TABLE purchase_orders 
                    ADD COLUMN description TEXT
                """))
                print("   ✓ Added 'description' column\n")
                changes_made = True
            else:
                print("   ✓ 'description' column already exists\n")
            
            # Add vendor column
            if 'vendor' not in columns:
                print("➕ Adding 'vendor' column...")
                conn.execute(text("""
                    ALTER TABLE purchase_orders 
                    ADD COLUMN vendor VARCHAR
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor 
                    ON purchase_orders(vendor)
                """))
                print("   ✓ Added 'vendor' column with index\n")
                changes_made = True
            else:
                print("   ✓ 'vendor' column already exists\n")
            
            # Add shipping_address column
            if 'shipping_address' not in columns:
                print("➕ Adding 'shipping_address' column...")
                conn.execute(text("""
                    ALTER TABLE purchase_orders 
                    ADD COLUMN shipping_address TEXT
                """))
                print("   ✓ Added 'shipping_address' column\n")
                changes_made = True
            else:
                print("   ✓ 'shipping_address' column already exists\n")
            
            # Add category column
            if 'category' not in columns:
                print("➕ Adding 'category' column...")
                conn.execute(text("""
                    ALTER TABLE purchase_orders 
                    ADD COLUMN category VARCHAR
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_purchase_orders_category 
                    ON purchase_orders(category)
                """))
                print("   ✓ Added 'category' column with index\n")
                changes_made = True
            else:
                print("   ✓ 'category' column already exists\n")
            
            # Add notes column
            if 'notes' not in columns:
                print("➕ Adding 'notes' column...")
                conn.execute(text("""
                    ALTER TABLE purchase_orders 
                    ADD COLUMN notes TEXT
                """))
                print("   ✓ Added 'notes' column\n")
                changes_made = True
            else:
                print("   ✓ 'notes' column already exists\n")
            
            # Create composite indexes if they don't exist
            print("🔍 Checking composite indexes...")
            existing_indexes = [idx['name'] for idx in inspector.get_indexes('purchase_orders')]
            
            composite_indexes = [
                ("idx_order_date_status", "order_date", "status"),
                ("idx_item_name_status", "item_name", "status"),
                ("idx_total_price_status", "total_price", "status"),
            ]
            
            for idx_name, col1, col2 in composite_indexes:
                if idx_name not in existing_indexes:
                    print(f"➕ Creating composite index '{idx_name}' on ({col1}, {col2})...")
                    conn.execute(text(f"""
                        CREATE INDEX {idx_name} 
                        ON purchase_orders({col1}, {col2})
                    """))
                    print(f"   ✓ Created index '{idx_name}'\n")
                    changes_made = True
                else:
                    print(f"   ✓ Index '{idx_name}' already exists\n")
            
            conn.commit()
        
        if changes_made:
            print("="*70)
            print("✅ Migration completed successfully!")
            print("="*70 + "\n")
        else:
            print("="*70)
            print("ℹ️  No changes needed - all columns and indexes already exist")
            print("="*70 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        print("   Rolling back changes...")
        try:
            with engine.connect() as conn:
                conn.rollback()
        except:
            pass
        return False

if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)

