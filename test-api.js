async function run() {
  try {
    // 1. Login
    const loginRes = await fetch('http://127.0.0.1:3005/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'soehtetlin@prwm.local',
        password: 'prwm_dev_2026'
      })
    });
    
    if (!loginRes.ok) {
      console.error("Login failed (status):", loginRes.status);
    }
    
    // const loginData = await loginRes.json();
    const cookieHeader = loginRes.headers.get('set-cookie');
    
    const headers = {};
    if (cookieHeader) headers['Cookie'] = cookieHeader;
    // if (loginData.access_token) headers['Authorization'] = `Bearer ${loginData.access_token}`;
    
    // 2. Fetch Dashboard
    const dashRes = await fetch('http://127.0.0.1:3005/api/v1/applicant/payment-requests?page=1&limit=10', {
      headers
    });
    
    if (!dashRes.ok) {
      console.error("API Error:", dashRes.status, await dashRes.text());
    } else {
      console.log("Dashboard Data:", JSON.stringify(await dashRes.json(), null, 2));
    }
  } catch (err) {
    console.error("Request failed:", err.message);
  }
}
run();
