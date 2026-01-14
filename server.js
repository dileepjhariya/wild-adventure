const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Razorpay = require('razorpay');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); 

// 🔴 RAZORPAY SETTINGS (Test Mode)
const RAZORPAY_KEY_ID = 'rzp_test_S2gHdEXUA554D9';
const RAZORPAY_KEY_SECRET = 'Q6g7wvjFMoSa5dN5wSm5IsqC';

// 🔴 EMAIL SETTINGS (Brevo)
const MY_EMAIL = 'wildadventure1998@gmail.com'; 
// Note: Password ab Render ke "Environment Variable" se aayega (Secure Tareeka)
const MY_EMAIL_PASSWORD = process.env.BREVO_KEY; 

const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

// --- ORDER CREATE API ---
app.post('/create-order', async (req, res) => {
    try {
        const options = {
            amount: req.body.amount * 100,
            currency: 'INR',
            receipt: 'receipt_' + Math.random()
        };
        const order = await razorpay.orders.create(options);
        res.json(order); 
    } catch (error) { res.status(500).send(error); }
});

// --- EMAIL SEND API (Fixed with Port 2525) ---
app.post('/send-email', (req, res) => {
    console.log("📨 Sending Email via Brevo (Port 2525)...");
    const data = req.body;

    // Passenger List HTML banana
    let passengerRows = '';
    if (data.passengers && data.passengers.length > 0) {
        data.passengers.forEach((p, index) => {
            passengerRows += `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding:8px; text-align:center;">${index + 1}</td>
                    <td style="padding:8px;"><strong>${p.name}</strong></td>
                    <td style="padding:8px;">${p.gender}</td>
                    <td style="padding:8px;">${p.age}</td>
                    <td style="padding:8px;">${p.id_number}</td>
                </tr>
            `;
        });
    } else {
        passengerRows = '<tr><td colspan="5">No Passenger Data</td></tr>';
    }

    // 🛠️ MAGIC FIX: Port 2525 use kiya hai jo kabhi block nahi hota
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 2525,              // 👈 SABSE ZAROORI CHANGE
        secure: false, 
        auth: {
            user: MY_EMAIL,
            pass: MY_EMAIL_PASSWORD // Render se key uthayega
        }
    });

    const mailOptions = {
        from: `Wild Adventure <${MY_EMAIL}>`,
        to: MY_EMAIL, // Filhal aapko hi mail aayega (check karne ke liye)
        subject: `🐅 Booking Alert: ${data.name} (${data.passengers.length} Persons)`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #ddd;">
                <h2 style="background: #28a745; color: white; padding: 10px; margin: 0; text-align: center;">New Booking Confirmed</h2>
                
                <div style="padding: 20px;">
                    <h3>📍 Trip Details</h3>
                    <p><strong>Booked By:</strong> ${data.name}</p>
                    <p><strong>Mobile:</strong> ${data.mobile}</p>
                    <p><strong>Date:</strong> ${data.date}</p>
                    <p><strong>Shift:</strong> ${data.shift}</p>
                    <p><strong>Gate:</strong> ${data.gate}</p>
                    <p><strong>Vehicle:</strong> ${data.vehicle}</p>
                    <p><strong>Total Amount:</strong> ₹${data.amount}</p>
                    <p><strong>Payment ID:</strong> ${data.payment_id}</p>

                    <hr>

                    <h3>👥 Passenger List (${data.passengers.length} Members)</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <thead style="background-color: #f2f2f2;">
                            <tr>
                                <th style="padding:8px; border:1px solid #ddd;">#</th>
                                <th style="padding:8px; border:1px solid #ddd;">Name</th>
                                <th style="padding:8px; border:1px solid #ddd;">Gender</th>
                                <th style="padding:8px; border:1px solid #ddd;">Age</th>
                                <th style="padding:8px; border:1px solid #ddd;">ID Proof</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${passengerRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) { 
            console.log("❌ Email Error:", error); 
            res.status(500).send('Fail'); 
        } 
        else { 
            console.log("✅ Email Sent Successfully via Port 2525!"); 
            res.status(200).send('Sent'); 
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));