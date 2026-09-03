import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_build_placeholder")

export async function POST(req: NextRequest) {
  try {
    const { email, companyName, packageName } = await req.json()

    if (!email || !companyName || !packageName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await resend.emails.send({
      from: "StarCast Media <noreply@starcast.online>",
      to: email,
      subject: `Thank you for your sponsorship, ${companyName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #05052d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #05052d; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #0c0c3f; border-radius: 12px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #20205a;">
                      <h1 style="color: #ea6f2a; font-size: 28px; margin: 0 0 10px;">StarCast Media</h1>
                      <p style="color: #9a9fc4; font-size: 14px; margin: 0;">Thank you for your sponsorship!</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #f5f7ff; font-size: 22px; margin: 0 0 20px;">Welcome, ${companyName}!</h2>
                      
                      <p style="color: #9a9fc4; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        We're thrilled to have you on board as a sponsor! Your purchase of the <strong style="color: #ea6f2a;">${packageName}</strong> has been confirmed.
                      </p>
                      
                      <p style="color: #9a9fc4; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        Our team will be in touch at our earliest convenience to discuss the next steps and how we can best showcase your brand across our programming.
                      </p>
                      
                      <div style="background-color: #05052d; border-radius: 8px; padding: 20px; margin: 30px 0;">
                        <p style="color: #f5f7ff; font-size: 14px; margin: 0 0 10px;"><strong>What happens next?</strong></p>
                        <ul style="color: #9a9fc4; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                          <li>We'll review your company information</li>
                          <li>Our team will reach out to coordinate your sponsorship</li>
                          <li>We'll schedule your live reads and promotional content</li>
                        </ul>
                      </div>
                      
                      <p style="color: #9a9fc4; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        We've also created an account for you. Check your inbox for a magic link to access your sponsor dashboard!
                      </p>
                      
                      <p style="color: #9a9fc4; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                        Questions? Reply to this email or contact us at <a href="mailto:starcastlivemedia@gmail.com" style="color: #ea6f2a;">starcastlivemedia@gmail.com</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; background-color: #05052d; text-align: center; border-top: 1px solid #20205a;">
                      <p style="color: #9a9fc4; font-size: 12px; margin: 0;">
                        StarCast Media &bull; Topeka, Kansas<br>
                        <a href="https://www.starcast.online" style="color: #ea6f2a;">www.starcast.online</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to send sponsor thank you email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
