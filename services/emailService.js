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

module.exports = { sendEmail };