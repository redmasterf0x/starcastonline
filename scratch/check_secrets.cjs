const https = require("https");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("C:\\Users\\ray\\.config\\configstore\\firebase-tools.json", "utf8"));
const token = config.tokens.access_token;
const projectId = "starcastonline-live";

const options = {
  hostname: "secretmanager.googleapis.com",
  path: `/v1/projects/${projectId}/secrets`,
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

https.get(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    try {
      const json = JSON.parse(data);
      console.log("Secrets in Secret Manager:");
      if (json.secrets) {
        json.secrets.forEach(s => console.log("- " + s.name.split("/").pop()));
      } else {
        console.log(json);
      }
    } catch (e) {
      console.log(data);
    }
  });
}).on("error", console.error);
