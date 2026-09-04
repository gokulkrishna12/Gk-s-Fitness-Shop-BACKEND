const nodemailer = require('nodemailer');
const Otp = require('../models/Otp'); // Using the model you already created!

exports.sendOTP = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // 1. Delete any old OTPs for this email so they don't pile up
        await Otp.findOneAndDelete({ email });

        // 2. Save new OTP to your MongoDB (it will auto-delete after 5 mins based on your schema)
        const newOtp = new Otp({ email, otp: otpCode });
        await newOtp.save();

        // 3. Send the Email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Add this to your backend .env
                pass: process.env.EMAIL_PASS, // Add your 16-digit Google App Password to .env
            },
        });

        await transporter.sendMail({
            from: `"GK's Fitness" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "GK's Fitness - Verification Code",
            html: `
        <div style="font-family: Arial; text-align: center; padding: 20px;">
          <h2 style="color: #e63946;">GK's Fitness</h2>
          <p>Welcome Athlete! Your verification code is:</p>
          <h1 style="background: #f4f4f4; padding: 10px; letter-spacing: 5px;">${otpCode}</h1>
          <p style="color: #888;">This code expires in 5 minutes.</p>
        </div>
      `,
        });

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('OTP Error:', error);
        res.status(500).json({ message: 'Failed to send OTP email' });
    }
};

exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const record = await Otp.findOne({ email });

        if (!record) {
            return res.status(400).json({ message: 'OTP expired or not found. Please request a new one.' });
        }

        if (record.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP code' });
        }
        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Verify Error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
};