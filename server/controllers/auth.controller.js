import { uploadToCloudinary } from "../config/cloudinary.js";
import { sendOtpEmail } from "../config/mailer.js";
import CommentModel from "../models/Comment.model.js";
import PollModel from "../models/Poll.model.js";
import UserModel from "../models/User.model.js";
import { genreateOtp, otpExpiry } from "../utils/otp.js";

// register user through otp verification to email
export const register = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser)
      return res.status(400).json({
        message: "Email or username already taken",
      });
    let avatar = "";
    if (req.file) {
      // upload image to cloudinary
      try {
        avatar = await uploadToCloudinary(req.file.buffer);
      } catch (error) {
        console.warn("⚠️ Avatar upload skipped:", error.message);
      }
    }

    // generate OTP
    const otp = genreateOtp();
    await UserModel.create({
      name,
      email,
      username,
      password,
      avatar,
      otp,
      otpExpires: otpExpiry(),
    });

    // send OTP through email
    await sendOtpEmail(email, otp, "verify your Polling account");
    res.status(200).json({
      needVerification: true,
      email,
    });
  } catch (error) {
    console.log("🔴ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
