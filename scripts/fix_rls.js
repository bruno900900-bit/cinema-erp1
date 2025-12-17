/**
 * Test authenticated query performance
 * This simulates what happens after a user logs in
 */

const SUPABASE_URL = "https://rwpmtuohcvnciemtsjge.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTM1NzYsImV4cCI6MjA4MDg4OTU3Nn0.Wpkkzef7vTKQGQ5CZX41-qXHoQu4r_r67lK-fmvWQV8";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww";

const AUTH_ID = "67230947-2ded-420a-863f-ff6b098f6a24";

async function testQueries() {
  console.log("Testing query performance...\n");

  // Test 1: Anon key query
  console.log("Test 1: Query with ANON key");
  let start = Date.now();
  let response = await fetch(
    `${SUPABASE_URL}/rest/v1/users?auth_id=eq.${AUTH_ID}&select=*`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    }
  );
  let elapsed = Date.now() - start;
  let data = await response.json();
  console.log(
    `  Status: ${response.status}, Time: ${elapsed}ms, Found: ${data.length} users`
  );

  // Test 2: Service role query
  console.log("\nTest 2: Query with SERVICE_ROLE key");
  start = Date.now();
  response = await fetch(
    `${SUPABASE_URL}/rest/v1/users?auth_id=eq.${AUTH_ID}&select=*`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  elapsed = Date.now() - start;
  data = await response.json();
  console.log(
    `  Status: ${response.status}, Time: ${elapsed}ms, Found: ${data.length} users`
  );

  // Test 3: Simple query to users table
  console.log("\nTest 3: Simple query (select id, email only)");
  start = Date.now();
  response = await fetch(
    `${SUPABASE_URL}/rest/v1/users?select=id,email&limit=5`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    }
  );
  elapsed = Date.now() - start;
  data = await response.json();
  console.log(
    `  Status: ${response.status}, Time: ${elapsed}ms, Found: ${data.length} users`
  );

  // Test 4: Multiple sequential queries
  console.log("\nTest 4: 3 sequential queries");
  for (let i = 0; i < 3; i++) {
    start = Date.now();
    response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?auth_id=eq.${AUTH_ID}&select=id,email,role`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
        },
      }
    );
    elapsed = Date.now() - start;
    data = await response.json();
    console.log(`  Query ${i + 1}: ${elapsed}ms`);
  }
}

testQueries().catch(console.error);
