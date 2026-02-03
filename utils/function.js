const { storage } = require("../config/firebase.config");
const { getDownloadURL, ref, uploadBytes } = require("@firebase/storage");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI('AIzaSyAIN_DwYdnX0wwSx_3sFejTq25CgNX9S3o');
const QRCode = require('qrcode');
const twilio = require('twilio');
require("dotenv").config()

const accountSid = "";
const authToken = "";
const twilioPhoneNumber = "";

const client = twilio(accountSid, authToken);


module.exports = {
    uploadFile: (async (file) => {
        const uniqueFilename = `${Date.now()}-${file.originalname}`;
        const storageRef = ref(storage, `${uniqueFilename}`);
        await uploadBytes(storageRef, file.buffer);
        const result = await getDownloadURL(storageRef);
        let downloadUrl = result;
        return downloadUrl
    }),
    sendOtp: async (phoneNumber, otp) => {
        try {
            const message = await client.messages.create({ body: `Your OTP for hop on account verification is: ${otp}`, from: twilioPhoneNumber, to: phoneNumber, });
            console.log('Message sent:', message.sid);
            return { success: true, sid: message.sid };
        }
        catch (error) {
            console.error('Error sending OTP:', error);
            return { success: false, error: error.message };
        }
    },
    generatePin: () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },
    gennerateRapLine: async (word) => {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent([
            ` Analyze the word: ${word}. and generate a rap verse which include that word. make sure only return generated line in reponse
            `
        ]);
        return result.response.text()
    },
    aISuggestion: async (note) => {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent([` Give suggestion on this note : ${note}. make sure the response is in one line`]);
        return result.response.text()
    },
    aISuggestionOnRap: async (note) => {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent([` Give suggestion on this rap line : ${note}. make sure the response is in one line and only give suggestion about the line`]);
        return result.response.text()
    },
    aIPerformanceAnalysis: async (note) => {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent([`Analyze this rap  : ${note}. and give perforamce analysis in the form of object only return object in response no additional text 
            {
                smoothness:80,
                creativity:10,
                versality10
            }
            `]);
        return result.response.text()
    },
    audioToText: async (file) => {
        return file
    },
    uploadQR:async (fileBuffer, filename) => {
        try {
            const uniqueFilename = `${filename}-${Date.now()}.png`; // Append timestamp for uniqueness
            const storageRef = ref(storage, uniqueFilename);
            await uploadBytes(storageRef, fileBuffer); // Upload the QR code buffer
            return await getDownloadURL(storageRef); // Get the file URL
        } catch (err) {
            console.error(err);
            throw err;
        }
    },
    generateQRCodeBuffer: async (text) => {
        try {
            return await QRCode.toBuffer(text);
        } catch (err) {
            console.error(err);
        }
    },


}