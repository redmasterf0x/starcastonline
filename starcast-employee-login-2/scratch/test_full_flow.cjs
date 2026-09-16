const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

async function testFull() {
  console.log("Testing verification email send simulation...");
  const FROM = "StarCast Media <noreply@starcast.online>";
  const to = "raystarnes816@gmail.com";
  
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your StarCast Media account [Test]",
    html: "<p>Verification test link: <a href='https://starcast.online'>Click here</a></p>",
  });

  if (error) {
    console.log("Primary domain error:", error.message);
    console.log("Executing fallback to onboarding@resend.dev...");
    const fb = await resend.emails.send({
      from: "StarCast Media <onboarding@resend.dev>",
      to,
      subject: "Verify your StarCast Media account [Test Fallback]",
      html: "<p>Verification fallback test link: <a href='https://starcast.online'>Click here</a></p>",
    });
    console.log("Fallback result:", JSON.stringify(fb, null, 2));
  } else {
    console.log("Sent successfully with primary domain! ID:", data?.id);
  }
}

testFull().catch(console.error);
