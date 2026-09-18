### ⚙️ 2. Backend `README.md`

```markdown
# ⚙️ GK's Fitness Shop — Core Backend API

Scalable RESTful API powering inventory management, user authentication, orders, and payment lifecycles for GK's Fitness Shop. Deployed on an AWS EC2 Ubuntu instance behind an Nginx reverse proxy.

## 🚀 Key Architecture & Features
- **Real-Time Inventory Management:** Transaction-safe stock deduction on order confirmation and automated inventory restoration upon customer or admin order cancellation.
- **Secure Authentication & Verification:** JWT-based stateless auth, bcrypt password hashing, and timed Email OTP verification routines.
- **Parallel Media Streaming:** Direct RAM-buffer streaming to Cloudinary using `Promise.all` for high-throughput image uploads.
- **Admin Command Center:** Full CRUD endpoints for managing product catalogs, categorizing gear, managing order statuses, and accessing shipping addresses.
- **Infrastructure:** AWS EC2 (Ubuntu), Nginx reverse proxy, PM2 process management, and automated GitHub Actions deployment.

## 🛠️ Tech Stack
- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB Atlas via Mongoose ODM
- **Media Storage:** Cloudinary API
- **Payments:** Razorpay Node SDK
- **Infrastructure & Hosting:** AWS EC2, Nginx, PM2, GitHub Actions CI/CD

## 📋 Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas Account / Cluster
- Razorpay Account
- Cloudinary Account
- Gmail account with an App Password (for OTP emails)

## ⚙️ Environment Variables
Create a `.env` file in the root directory. Use the template below:

```env
# .env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/gks-fitness

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Image Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service (For OTP verification)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
💻 Local Development Setup
Clone the repository:

Bash
git clone [https://github.com/gokulkrishna12/Gk-s-Fitness-Shop-BACKEND.git](https://github.com/gokulkrishna12/Gk-s-Fitness-Shop-BACKEND.git)
cd Gk-s-Fitness-Shop-BACKEND
Install dependencies:

Bash
npm install
Start the development server:

Bash
# Run standard node server
npm start 

# OR run with nodemon for hot-reloading
npm run dev
The API will be available at http://localhost:5000.
