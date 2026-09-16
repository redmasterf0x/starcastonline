const { Resend } = require("resend");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const resend = new Resend(process.env.RESEND_API_KEY);

async function checkDomain() {
  const domain = await resend.domains.get("fcc6c80c-de56-47ab-90ec-93d2d72dfacf");
  console.log("Domain records and status:", JSON.stringify(domain, null, 2));

  // Also test if Resend default test sender `onboarding@resend.dev` works (can only send to verified account email)
  console.log("\nTesting fallback sender onboarding@resend.dev to account email...");
  const res2 = await resend.emails.send({
    from: "StarCast Media <onboarding@resend.dev>",
    to: "raystarnes816@gmail.com",
    subject: "StarCast Test via onboarding@resend.dev",
    html: "<p>Test email delivered via onboarding@resend.dev fallback.</p>",
  });
  console.log("Fallback sender result:", JSON.stringify(res2, null, 2));
}

checkDomain().catch(console.error);
