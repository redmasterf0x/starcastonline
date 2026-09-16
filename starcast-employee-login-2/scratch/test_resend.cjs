const { Resend } = require("resend");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  console.log("Testing Resend with key:", process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.slice(0, 10) + "..." : "NONE");
  
  // 1. Test sending with noreply@starcast.online
  console.log("\nAttempting send from noreply@starcast.online...");
  const res1 = await resend.emails.send({
    from: "StarCast Media <noreply@starcast.online>",
    to: "raystarnes816@gmail.com",
    subject: "Test Verification - Domain Test",
    html: "<p>This is a test from noreply@starcast.online</p>",
  });
  console.log("Result from noreply@starcast.online:", JSON.stringify(res1, null, 2));

  // 2. Check domains list in Resend
  console.log("\nChecking registered domains in Resend account...");
  try {
    const domains = await resend.domains.list();
    console.log("Domains in Resend:", JSON.stringify(domains, null, 2));
  } catch (e) {
    console.log("Error fetching domains:", e.message);
  }
}

test().catch(console.error);
