// Test CORS from browser console
fetch("http://localhost:8000/api/v1/cors-test", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ test: true }),
})
  .then((r) => r.json())
  .then((d) => console.log("✅ CORS TEST SUCCESS:", d))
  .catch((e) => console.error("❌ CORS TEST FAILED:", e));
