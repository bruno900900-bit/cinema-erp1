
import sys
import os
from datetime import date
sys.path.append(os.getcwd())

# Mock rental status enum string/object issue if needed, but imports should work
try:
    from app.core.database import SessionLocal
    from app.services.project_location_service import ProjectLocationService
    from app.schemas.project_location import ProjectLocationCreate
    from app.models.project_location import RentalStatus

    db = SessionLocal()
    service = ProjectLocationService(db)

    print("Checking connection...")
    # Verify DB file again inside this process
    from app.core.database import SQLALCHEMY_DATABASE_URL
    print(f"Using DB: {SQLALCHEMY_DATABASE_URL}")

    # Create simplified data
    data = ProjectLocationCreate(
        project_id=1,
        location_id=1,
        rental_start=date(2025, 12, 10),
        rental_end=date(2025, 12, 10),
        daily_rate=100.0,
        visit_date=date(2025, 12, 10),
        status=RentalStatus.RESERVED
    )

    try:
        print("Attempting to create location via Service...")
        loc = service.create_project_location(data)
        print(f"Success! Created location {loc.id}")

        # Now try to delete it to test deletion
        print("Attempting to delete...")
        service.delete_project_location(loc.id)
        print("Success! Deleted location")

    except Exception as e:
        print(f"Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

except ImportError as e:
    print(f"Import Error: {e}")
