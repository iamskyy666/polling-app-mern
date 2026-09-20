import { sendOtpEmail } from "../config/mailer.js";
import UserModel from "../models/User.model.js";
import { genreateOtp, otpExpiry, otpValid } from "../utils/otp.js";

//! forgot-password (via email-OTP)
export const forgotPassword = async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email!" });
    }
    user.otp = genreateOtp();
    user.otpExpires = otpExpiry();
    await user.save();

    await sendOtpEmail(user.email, user.otp, "reset your Pollix password");
    res.json({
      message: "OTP sent to your email!",
    });
  } catch (error) {
    console.log("🔴ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

//! check whether OTP is valid
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!otpValid(user, otp))
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    res.json({ ok: true });
  } catch (error) {
    console.log("🔴ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

//! reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be atleast 8 characters." });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!otpValid(user, otp))
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });

    user.password = password;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    res.json({ message: "Password reset successfully!" });
  } catch (error) {
    console.log("🔴ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
