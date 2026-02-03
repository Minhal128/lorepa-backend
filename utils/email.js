const nodeMailer = require("nodemailer");
const { verficationEmailTemplate } = require("./template");
require("dotenv").config()

const getSubject = (emailType) => {
    switch (emailType) {
        case "forget":
            return "LOREPA - Forget Password Email";
        case "register":
            return "LOREPA - Welcome! Please verify your account";
        default:
            return "LOREPA - Account Verification Email";
    }
};

const selectTemplate = (emailType, name, otp) => {
    switch (emailType) {
        case "forget":
            return verficationEmailTemplate(name, otp, "Reset Password");
        case "register":
            return verficationEmailTemplate(name, otp, "Welcome to Lorepa");
        default:
            return verficationEmailTemplate(name, otp, "Account Verification");
    }
};

const sendDynamicMail = async (mailType, email, name, otp) => {
    try {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASSWORD;

        console.log(`Attempting to send email via ${user}`);

        let transporter = nodeMailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // Use STARTTLS
            auth: {
                user: user,
                pass: pass,
            }
        });

        let html = await selectTemplate(mailType, name, otp);
        const mailOptions = {
            from: `"Lorepa" <${user}>`,
            to: email,
            subject: getSubject(mailType),
            html: html
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to", email);
        return { status: 200, message: "Email sent successfully" };
    }
    catch (err) {
        console.error("Error in sendDynamicMail:", err.message);
        throw err; // Throw the error so the calling function can catch it
    }
}

module.exports = { sendDynamicMail }
