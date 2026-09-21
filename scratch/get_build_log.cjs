const fs = require('fs');
const https = require('https');

async function main() {
  try {
    const configPath = 'C:\\Users\\ray\\.config\\configstore\\firebase-tools.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const accessToken = config.tokens?.access_token;
    const projectId = "713609005713";

    const postData = JSON.stringify({
      resourceNames: [`projects/${projectId}`],
      pageSize: 10
    });

    const req = https.request('https://logging.googleapis.com/v2/entries:list', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log("Response:", data);
      });
    });
    req.write(postData);
    req.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
