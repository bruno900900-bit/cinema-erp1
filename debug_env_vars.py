
import os
from dotenv import load_dotenv

load_dotenv()
print("DEBUG ENV:")
for key in ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_HOST', 'POSTGRES_DB']:
    val = os.getenv(key)
    if val:
        print(f"{key}: {repr(val)}")
    else:
        print(f"{key}: NOT SET")
