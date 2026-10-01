const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    pool: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        // 🔥 FIX: We MUST throw the error so the controller knows it crashed!
        throw new Error('Failed to send email. Check Gmail App Passwords.');
    }
};

// 🔥 NEW: Professional HTML Order Receipt
const sendOrderReceipt = async (userEmail, userName, order, paymentId) => {
    try {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2b2b2b;">Order Confirmed! 🎉</h2>
                <p>Hi ${userName || 'Athlete'},</p>
                <p>Thank you for shopping at <strong>GK's Fitness Shop</strong>. Your payment was successful, and we are getting your gear ready to ship!</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <h3>Order Summary</h3>
                <p><strong>Order ID:</strong> ${order._id}</p>
                <p><strong>Payment ID:</strong> ${paymentId}</p>
                <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
                <p><strong>Status:</strong> Processing</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p>We will notify you the moment it ships. Keep grinding!</p>
                <p style="color: #777; font-size: 12px;">- The GK Fitness Team</p>
            </div>
        `;

        await transporter.sendMail({
            from: `"GK's Fitness Shop" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `Order Confirmed! Receipt for ₹${order.totalAmount}`,
            html: htmlContent
        });
        console.log(`✅ Order receipt email sent to ${userEmail}`);
    } catch (error) {
        console.error("🚨 Error sending receipt email:", error.message);
    }
};

module.exports = { sendEmail, sendOrderReceipt };