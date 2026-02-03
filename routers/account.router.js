const router = require("express").Router()
const { multipleupload } = require("../config/multer.config")
const { createAccount, loginAccount, getAccountById, getAllAccount, deleteAccount, reactivateAccount, dashboardData, updateAccount, updateKYC, changePassword, resendOtp, verifyOtp, changePasswordByEmail } = require("../services/account.service")

router.post("/register", createAccount)
router.post("/login", loginAccount)
router.delete("/delete/account/:id", deleteAccount)
router.put("/reactivate/account/:id", reactivateAccount)
router.get("/single/:id", getAccountById)
router.get("/details/:id", dashboardData)
router.get("/all", getAllAccount)
router.put("/update/:id", multipleupload.fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "licenseFrontImage", maxCount: 1 },
  { name: "licenseBackImage", maxCount: 1 },
  { name: "trailerRegistrationImage", maxCount: 1 },
  { name: "trailerInsurancePolicyImage", maxCount: 1 },
  { name: "carInsurancePolicyImage", maxCount: 1 }
]), updateAccount);
router.put("/kyc/:id", updateKYC);
router.put("/change-password/:id", changePassword);
router.post("/send/otp/:email", resendOtp)
router.post("/verify/otp", verifyOtp)
router.put("/change-password-email/:email", changePasswordByEmail);
router.get("/google", (req, res) => {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email&prompt=select_account`;
  res.redirect(url);
});
const { googleAuthCallback } = require("../services/account.service");
router.get("/google/callback", googleAuthCallback);

module.exports = router
