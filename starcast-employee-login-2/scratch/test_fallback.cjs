const { Resend } = require("resend");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testFallback() {
  console.log("Testing onboarding@resend.dev with current key...");
  const res = await resend.emails.send({
    from: "StarCast Media <onboarding@resend.dev>",
    to: "raystarnes816@gmail.com",
    subject: "StarCast Test Fallback",
    html: "<p>Testing fallback with current key</p>",
  });
  console.log("Result:", JSON.stringify(res, null, 2));
}

testFallback().catch(console.error);
