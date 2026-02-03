const { AccountModel } = require("../models/account.model");
const { BookingModel } = require("../models/booking.model");
const { TrailerModel } = require("../models/trailer.model");
const bcrypt = require("bcryptjs")
const { uploadFile, generatePin } = require("../utils/function");
const { createNotification } = require("./notification.service");
const { sendDynamicMail } = require("../utils/email");
const axios = require("axios");



const createAccount = async (req, res) => {
    try {
        let { email, password, role, name, phone } = req.body;

        let findUser = await AccountModel.findOne({ email });
        if (findUser) {
            return res.status(400).json({ msg: "Account already exists", code: 400 });
        }

        let hash = await bcrypt.hash(password, 10);
        let pin = generatePin();
        let result = await AccountModel.create({
            email,
            password: hash,
            role,
            name,
            phone,
            otp: pin
        });

        try {
            await sendDynamicMail("register", email, name || "User", pin);
        } catch (mailError) {
            console.error("Email sending failed during registration:", mailError.message);
            // We continue even if email fails, so the account is at least created
        }

        return res.status(200).json({ data: result, msg: "Account Created. Please verify your email.", status: 200 });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};


const loginAccount = async (req, res) => {
    try {
        let { email, password, } = req.body
        let findUser = await AccountModel.findOne({ email })
        if (!findUser) {
            return res.status(400).json({ data: null, msg: "Account not exits", code: 400 })
        }
        else if (findUser?.accountBlocked) {
            return res.status(400).json({ data: null, msg: "Account has been deleted", code: 400 })
        }
        else {
            let compare = await bcrypt.compare(password, findUser.password)
            if (compare) {
                return res.status(200).json({ data: findUser, msg: "Login Sucessful", code: 200 })
            }
            else {
                return res.status(403).json({ data: null, msg: "Invalid credentails", code: 403 })
            }
        }
    }
    catch (error) {
        console.log(error)
    }
}

const deleteAccount = async (req, res) => {
    try {
        let { id } = req.params
        await AccountModel.findByIdAndUpdate(id, { accountBlocked: true })
        return res.status(200).json({ data: null, msg: "Account Deleted", code: 200 })
    }
    catch (error) {
        console.log(error)
    }
}
const reactivateAccount = async (req, res) => {
    try {
        let { id } = req.params
        await AccountModel.findByIdAndUpdate(id, { accountBlocked: false })
        return res.status(200).json({ data: null, msg: "Account Activated", code: 200 })
    }
    catch (error) {
        console.log(error)
    }
}

const getAccountById = async (req, res) => {
    try {
        let findUser = await AccountModel.findById(req.params.id)
        return res.status(200).json({ data: findUser, code: 200 })
    }
    catch (error) {
        console.log(error)
    }
}
const getAllAccount = async (req, res) => {
    try {
        let findUser = await AccountModel.find()
        return res.status(200).json({ data: findUser, code: 200 })

    }
    catch (error) {
        console.log(error)
    }
}

const dashboardData = async (req, res) => {
    let { id } = req?.params
    let booking = await BookingModel.find({ owner_id: id }).populate("trailerId").populate("user_id")
    let trailer = await TrailerModel.find({ userId: id })
    return res.status(200).json({ data: { booking, trailer } })
}

const uploadPicture = async (req, res) => {

}

const updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, street, state, country } = req.body;

        let user = await AccountModel.findById(id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        // Handle file uploads
        if (req.files) {
            if (req.files.profilePicture) {
                user.profilePicture = await uploadFile(req.files.profilePicture[0]);
            }
            if (req.files.licenseFrontImage) {
                user.licenseFrontImage = await uploadFile(req.files.licenseFrontImage[0]);
            }
            if (req.files.licenseBackImage) {
                user.licenseBackImage = await uploadFile(req.files.licenseBackImage[0]);
            }
            if (req.files.trailerInsurancePolicyImage) {
                user.trailerInsurancePolicyImage = await uploadFile(req.files.trailerInsurancePolicyImage[0]);
            }
            if (req.files.carInsurancePolicyImage) {
                user.carInsurancePolicyImage = await uploadFile(req.files.carInsurancePolicyImage[0]);
            }
            if (req.files.trailerRegistrationImage) {
                user.trailerRegistrationImage = await uploadFile(req.files.trailerRegistrationImage[0]);
            }
        }

        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.address = address || user.address;
        user.street = street || street
        user.state = state || user.state
        user.country = country || user.country

        await user.save();
        return res.status(200).json({ data: user, msg: "Profile updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

// --- Update KYC Status ---
const updateKYC = async (req, res) => {
    try {
        const { id } = req.params;
        const { kycVerified } = req.body;

        let user = await AccountModel.findByIdAndUpdate(
            id,
            { kycVerified },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // create notification
        await createNotification({
            userId: id,
            title: kycVerified ? "KYC Approved" : "KYC Declined",
            description: kycVerified
                ? "Your KYC verification has been approved."
                : "Your KYC request has been declined. Please upload valid documents."
        });

        return res.status(200).json({ data: user, msg: "KYC status updated successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};



const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        const user = await AccountModel.findById(id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({ msg: "Password changed successfully", data: null });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
};

const resendOtp = async (req, res) => {
    try {
        let { email } = req.params
        let user = await AccountModel.findOne({ email: email })
        if (!user) {
            return res.status(400).json({ data: null, msg: "Account not exits", code: 400 })
        }
        else {
            let name = user?.name?.length > 0 ? user?.name : "anonymous"
            let pin = generatePin()
            try {
                await sendDynamicMail("forget", email, name, pin);
            } catch (mailError) {
                console.error("Email sending failed during OTP resend:", mailError.message);
                return res.status(500).json({ data: null, msg: "Failed to send OTP email. Please try again later.", code: 500 });
            }
            await AccountModel.findByIdAndUpdate(user?._id, { otp: pin }, { new: true })
            return res.status(200).json({ data: null, msg: "OTP send sucessfully", code: 200 })

        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ data: null, msg: "Internal Server Error", code: 500 });
    }
}

const verifyOtp = async (req, res) => {
    try {
        let { email, otp } = req.body
        let user = await AccountModel.findOne({ email: email })
        if (!user) {
            return res.status(400).json({ data: null, msg: "Account not exits", code: 400 })
        }
        else {
            if (otp == user?.otp) {
                await AccountModel.findByIdAndUpdate(user?._id, { otp: null, otpVerified: true }, { new: true })
                return res.status(200).json({ data: user, msg: "Otp Verified", code: 200 })
            }
            else {
                return res.status(403).json({ msg: "Invalid Otp", code: 403 })
            }

        }
    }
    catch (error) {
        console.log(error)
    }
}

const changePasswordByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) return res.status(400).json({ msg: "New password is required" });

        const user = await AccountModel.findOne({ email });
        if (!user) return res.status(404).json({ msg: "User not found" });

        // Optional: Ensure user has verified OTP before allowing password change
        if (!user.otpVerified) return res.status(403).json({ msg: "OTP not verified" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({ msg: "Password changed successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
};



const googleAuthCallback = async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "https://clownfish-app-aaokq.ondigitalocean.app";
    try {
        const { code } = req.query;
        if (!code) return res.redirect(`${frontendUrl}/login?error=no_code`);


        const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
        const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

        // Exchange code for tokens
        const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code",
        });

        const { access_token } = tokenResponse.data;

        // Get user info
        const userResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { sub: googleId, email, name, picture } = userResponse.data;

        let user = await AccountModel.findOne({ email });

        if (!user) {
            // Create a new user if not exists
            user = await AccountModel.create({
                email,
                name,
                googleId,
                isGoogleLogin: true,
                role: "renter", // Default role
                profilePicture: picture,
                otpVerified: true,
                password: await bcrypt.hash(googleId, 10), // Placeholder password
                phone: "0000000000" // Placeholder phone
            });
        } else {
            // Update existing user if they haven't logged in with Google before
            if (!user.googleId) {
                user.googleId = googleId;
                user.isGoogleLogin = true;
                await user.save();
            }
        }

        // Redirect back to frontend with user info
        return res.redirect(`${frontendUrl}/login?userId=${user._id}&role=${user.role}&googleLogin=success`);


    } catch (error) {
        console.error("Google Auth Error:", error.response?.data || error.message);
        return res.redirect(`${frontendUrl}/login?error=google_failed`);
    }

};

module.exports = {
    uploadPicture, createAccount, loginAccount, getAccountById, getAllAccount,
    deleteAccount, reactivateAccount, dashboardData, updateAccount, updateKYC,
    changePassword,
    resendOtp,
    verifyOtp,
    changePasswordByEmail,
    googleAuthCallback
};
