const { Resend } = require("resend");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const resend = new Resend(process.env.RESEND_API_KEY);

async function verify() {
  const res = await resend.domains.verify("fcc6c80c-de56-47ab-90ec-93d2d72dfacf");
  console.log("Verification trigger result:", JSON.stringify(res, null, 2));
}

verify().catch(console.error);
