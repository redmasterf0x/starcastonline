const https = require("https");
const fs = require("fs");
const path = require("path");

const config = JSON.parse(fs.readFileSync("C:\\Users\\ray\\.config\\configstore\\firebase-tools.json", "utf8"));
const token = config.tokens.access_token;

const buildId = "8338e0bc-32f7-498f-8cdf-ff906bfe224b";
const projectId = "713609005713";
const region = "us-central1";

const options = {
  hostname: "cloudbuild.googleapis.com",
  path: `/v1/projects/${projectId}/locations/${region}/builds/${buildId}`,
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
      console.log("Build Status:", json.status);
      console.log("Status Detail:", json.statusDetail);
      if (json.steps) {
        json.steps.forEach((s, idx) => {
          console.log(`Step ${idx} (${s.name}): ${s.status}`);
        });
      }
      if (json.failureInfo) {
        console.log("Failure Info:", JSON.stringify(json.failureInfo, null, 2));
      }
      console.log("Logs URL:", json.logUrl);
    } catch (e) {
      console.log("Raw Response:", data);
    }
  });
}).on("error", console.error);
