const nodeMailer = require("nodemailer");
require("dotenv").config();

const testSMTP = async () => {
    console.log("Testing SMTP with the following credentials:");
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASSWORD?.replace(/\s/g, "");

    console.log("User:", user);
    console.log("Pass (masked):", pass ? "****" : "MISSING");

    try {
        let transporter = nodeMailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: user,
                pass: pass,
            }
        });

        console.log("Verifying connection...");
        await transporter.verify();
        console.log("Connection successful! Your credentials are correct.");

        console.log("Sending a test email...");
        await transporter.sendMail({
            from: `Lorepa <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "SMTP Test Email",
            text: "This is a test email to verify your SMTP settings."
        });
        console.log("Test email sent successfully to", process.env.EMAIL_USER);
    } catch (err) {
        console.error("SMTP Test Failed Error:", err.message);
        if (err.message.includes("535")) {
            console.error("Verification: 535-5.7.8 Username and Password not accepted.");
            console.error("Action Required: Please check if 2FA is enabled and if you are using a valid Google App Password.");
        }
    }
};

testSMTP();
