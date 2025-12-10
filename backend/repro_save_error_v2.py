
import urllib.request
import json
import urllib.error

url = "http://localhost:8000/api/v1/project-locations/"
data = {
  "project_id": 9,
  "location_id": 4,
  "rental_start": "2025-01-01",
  "rental_end": "2025-01-05",
  "daily_rate": 555.0,
  "status": "reserved",
  "notes": "",
  "visit_date": None,
  "technical_visit_date": None,
  "filming_start_date": None,
  "filming_end_date": None,
  "delivery_date": None
}

headers = {
    "Content-Type": "application/json"
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)

try:
    print("Sending request...")
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
