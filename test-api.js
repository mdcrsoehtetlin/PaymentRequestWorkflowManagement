const http = require('http');

function post(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(body),
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: body,
          });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'GET',
      headers: {
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(body),
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: body,
          });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function main() {
  try {
    console.log('Logging in as ayethandarmoe@prwm.local...');
    const loginRes = await post('http://localhost:3005/api/v1/auth/login', {
      email: 'ayethandarmoe@prwm.local',
      password: 'Password@123',
    });

    if (loginRes.statusCode !== 200 && loginRes.statusCode !== 201) {
      console.error('Login failed:', loginRes.data);
      return;
    }

    const token = loginRes.data.accessToken;
    console.log('Login successful.');

    console.log('Fetching manager request details for request 2...');
    const detailsRes = await get('http://localhost:3005/api/v1/manager/requests/2', {
      Authorization: `Bearer ${token}`,
    });

    console.log('Fetch Response status:', detailsRes.statusCode);
    console.log('Data returned:');
    console.dir(detailsRes.data, { depth: null });
  } catch (err) {
    console.error('Error during API test:', err);
  }
}

main();
