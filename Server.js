require("dotenv").config()
const express = require("express")
const cors = require("cors")
const axios = require("axios")
const { Resend } = require("resend")

const app = express()

app.use(cors())
app.use(express.json())

const resend = new Resend(process.env.RESEND_API_KEY)
console.log("Resend key loaded:", process.env.RESEND_API_KEY ? "YES" : "NO")

const FROM_EMAIL = process.env.FROM_EMAIL || "info@giftedhandsstore.co.za"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@giftedhandsstore.co.za"



/* PAYSTACK TEMPORARILY DISABLED

app.post("/initialize-payment", async (req, res) => {
  const { email, amount } = req.body

  if (!email || !amount) {
    return res.status(400).json({
      error: "email and amount are required",
    })
  }

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount,
        callback_url: "http://localhost:5173/payment-success",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )

    return res.json(response.data)

  } catch (error) {
    return res.status(400).json({
      error: error.response?.data || error.message,
    })
  }
})

app.get("/verify-payment/:reference", async (req, res) => {
  const { reference } = req.params

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    return res.json(response.data)

  } catch (error) {
    return res.status(400).json({
      error: error.response?.data || error.message,
    })
  }
})

*/



app.post("/save-order", async (req, res) => {

  const { orderId, providerOrderId, email, items, amount } = req.body
  const finalOrderId = orderId || providerOrderId || "(no-order-id)"
  const adminEmail = ADMIN_EMAIL
  console.log("Order received", req.body)
  try {

    const itemsList = items
      .map(i => `${i.title} x${i.quantity}`)
      .join("<br/>")

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

    await resend.emails.send({
  from: "info@giftedhandsstore.co.za",
  to: [adminEmail],
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

    await resend.emails.send({
      from: "info@giftedhandsstore.co.za",
      to: [email],
      subject: "Your Gifted Hands Order Confirmation",
      html: `
        <h2>Payment Received</h2>

        <p>Thank you for your purchase.</p>

        <p><strong>Order Reference:</strong> ${orderId}</p>
        <p><strong>Total Paid:</strong> $${amount}</p>

        <p>Your design files will be prepared and sent to you within 24 hours.</p>

        <p>If you have questions, reply to this email.</p>

        <p>Gifted Hands</p>
      `
    })
    
    res.json({ success: true })

  } catch (error) {

    console.error("Resend error:", error)
    res.status(500).json({ success: false })

  }

})
app.post("/contact", async (req, res) => {

  const { name, email, country, city, message } = req.body

  const adminEmail = ADMIN_EMAIL

  try {

    await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmail],
      subject: "New Contact Message",
      html: `
        <h2>New Contact Message</h2>

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>City:</strong> ${city}</p>

        <h3>Message</h3>

        <p>${message}</p>
      `
    })

    res.json({success:true})

  } catch(error){

    console.error(error)

    res.status(500).json({success:false})

  }

})




const PORT = process.env.PORT || 4242

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})