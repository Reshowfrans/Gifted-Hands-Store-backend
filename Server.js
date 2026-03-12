require("dotenv").config()

const express = require("express")
const cors = require("cors")
const { Resend } = require("resend")

const app = express()

app.use(cors())
app.use(express.json())

const resend = new Resend(process.env.RESEND_API_KEY)

console.log("Resend key loaded:", process.env.RESEND_API_KEY ? "YES" : "NO")

const FROM_EMAIL = process.env.FROM_EMAIL || "info@giftedhandsstore.co.za"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@giftedhandsstore.co.za"



/* ===============================
   ORDER EMAILS
================================ */

app.post("/save-order", async (req, res) => {

  const { orderId, providerOrderId, email, items, amount } = req.body
  const finalOrderId = orderId || providerOrderId || "(no-order-id)"

  console.log("Order received", req.body)

  try {

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">
          <img src="${item.image}" width="120" style="border-radius:6px;" />
        </td>

        <td style="padding:10px;border-bottom:1px solid #eee;">
          <strong>${item.title}</strong>
        </td>

        <td style="padding:10px;border-bottom:1px solid #eee;">
          ${item.quantity}
        </td>

        <td style="padding:10px;border-bottom:1px solid #eee;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join("")



    /* ADMIN EMAIL */

    await resend.emails.send({
      from: `Gifted Hands <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: "New Order Received",
      html: `
      <div style="font-family:Arial, sans-serif; max-width:650px; margin:auto;">

        <h2>New Order Received</h2>

        <p><strong>Order ID:</strong> ${finalOrderId}</p>
        <p><strong>Customer Email:</strong> ${email}</p>
        <p><strong>Total Paid:</strong> $${amount}</p>

        <h3 style="margin-top:30px;">Order Items</h3>

        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <thead>
            <tr style="text-align:left;border-bottom:2px solid #ddd;">
              <th style="padding:10px;">Preview</th>
              <th style="padding:10px;">Design</th>
              <th style="padding:10px;">Qty</th>
              <th style="padding:10px;">Price</th>
            </tr>
          </thead>

          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <p style="margin-top:30px;">
          Please prepare and send the final design files to the client.
        </p>

      </div>
      `
    })



    /* CUSTOMER EMAIL */

    await resend.emails.send({
      from: `Gifted Hands <${FROM_EMAIL}>`,
      to: [email],
      subject: "Your Gifted Hands Order Confirmation",
      html: `
        <h2>Payment Received</h2>

        <p>Thank you for your purchase.</p>

        <p><strong>Order Reference:</strong> ${finalOrderId}</p>
        <p><strong>Total Paid:</strong> $${amount}</p>

        <p>Your design files will be prepared and sent to you within 24 hours.</p>

        <p>If you have questions, reply to this email.</p>

        <p>Gifted Hands</p>
      `
    })

    res.json({ success: true })

  } catch (error) {

    console.error("Order email error:", error)

    res.status(500).json({ success: false })

  }

})



/* ===============================
   CONTACT FORM
================================ */

app.post("/contact", async (req, res) => {

  const { name, email, message } = req.body

  console.log("Contact request:", req.body)

  try {

    await resend.emails.send({

      from: `Gifted Hands <${FROM_EMAIL}>`,

      to: [ADMIN_EMAIL],

      subject: "New Contact Message",

      html: `
        <h2>New Contact Message</h2>

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>

        <h3>Message</h3>

        <p>${message}</p>
      `

    })

    res.json({ success: true })

  } catch (error) {

    console.error("Contact email error:", error)

    res.status(500).json({ success: false })

  }

})



/* ===============================
   CUSTOM DESIGN REQUEST
================================ */

app.post("/custom-request", async (req, res) => {

  const {
    fullName,
    email,
    phone,
    company,
    city,
    environment,
    stageWidth,
    stageDepth,
    stageHeight,
    venueWidth,
    venueDepth,
    venueHeight,
    units,
    designBrief,
    venueFiles,
    floorFiles,
    referenceFiles
  } = req.body

  console.log("Custom request received:", req.body)

  try {

    const filesList = [
      ...(venueFiles || []),
      ...(floorFiles || []),
      ...(referenceFiles || [])
    ].join("<br/>")



    const messageHtml = `

      <h2>New Custom Design Request</h2>

      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>City:</strong> ${city}</p>
      <p><strong>Environment:</strong> ${environment}</p>

      <h3>Stage Dimensions</h3>
      <p>${stageWidth} x ${stageDepth} x ${stageHeight} ${units}</p>

      <h3>Venue Dimensions</h3>
      <p>${venueWidth} x ${venueDepth} x ${venueHeight} ${units}</p>

      <h3>Design Brief</h3>
      <p>${designBrief}</p>

      <h3>Uploaded Files</h3>
      <p>${filesList}</p>
    `



    /* ADMIN EMAIL */

    await resend.emails.send({
      from: `Gifted Hands <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: "New Custom Design Request",
      html: messageHtml
    })



    /* CUSTOMER CONFIRMATION */

    await resend.emails.send({
      from: `Gifted Hands <${FROM_EMAIL}>`,
      to: [email],
      subject: "Your Custom Design Request Was Received",
      html: `
        <h2>Thank you for your request</h2>

        <p>Hello ${fullName},</p>

        <p>We have received your custom stage design request.</p>

        <p>Our team will review your venue details and contact you within 24 to 48 hours.</p>

        <p>If you have additional references you can reply to this email.</p>

        <p>Gifted Hands</p>
      `
    })

    res.json({ success: true })

  } catch (error) {

    console.error("Custom request email error:", error)

    res.status(500).json({ success: false })

  }

})



/* ===============================
   SERVER START
================================ */

const PORT = process.env.PORT || 4242

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`)

})