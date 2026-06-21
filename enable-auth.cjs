const https = require('https');
const { execSync } = require('child_process');

async function enableProviders() {
  const projectId = 'prompt-wars-challenge-493822';
  
  console.log('Getting token...');
  const token = execSync('gcloud auth print-access-token').toString().trim();
  
  const body = JSON.stringify({
    signIn: {
      email: {
        enabled: true,
        passwordRequired: false // Enable Email Link (Passwordless)
      }
    }
  });

  const options = {
    hostname: 'identitytoolkit.googleapis.com',
    path: `/admin/v2/projects/${projectId}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'x-goog-user-project': projectId
    }
  };

  console.log('Sending request to Identity Toolkit API...');
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Response: ${data}`);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(body);
  req.end();
}

enableProviders();
