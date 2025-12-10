
import urllib.request
import urllib.parse

url = "http://localhost:8000/api/v1/project-locations/"
print(f"Testing CORS OPTIONS on {url}")

req = urllib.request.Request(url, method="OPTIONS")
req.add_header("Origin", "http://localhost:5173")
req.add_header("Access-Control-Request-Method", "POST")

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print("Headers:")
        for name, value in response.headers.items():
            print(f"{name}: {value}")

        if "access-control-allow-origin" not in str(response.headers).lower():
            print("\n❌ CORS FAIL: Access-Control-Allow-Origin header MISSING!")
        else:
            print("\n✅ CORS PASS: Access-Control-Allow-Origin found.")

except Exception as e:
    print(f"Error: {e}")
