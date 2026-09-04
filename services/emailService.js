const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // 🔥 Direct host instead of 'service: gmail'
    port: 465,              // 🔥 Force direct SSL (much faster than STARTTLS on port 587)
    secure: true,           // 🔥 True for 465
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
    }
};

module.exports = { sendEmail };