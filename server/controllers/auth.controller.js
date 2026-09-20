import { uploadToCloudinary } from "../config/cloudinary.js";
import { sendOtpEmail } from "../config/mailer.js";
import CommentModel from "../models/Comment.model.js";
import PollModel from "../models/Poll.model.js";
import UserModel from "../models/User.model.js";
import { genreateOtp, otpExpiry, otpValid } from "../utils/otp.js";
import jwt from "jsonwebtoken";

// for token-generation
const makeToken = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const clean = (u) => ({
  // clean-user - exclude password field.
  _id: u._id,
  name: u.name,
  email: u.email,
  username: u.username,
  avatar: u.avatar,
  bio: u.bio,
});

//! register user through otp verification to email
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
    await sendOtpEmail(email, otp, "verify your Pollix account");
    res.status(200).json({
      needVerification: true,
      email,
    });
  } catch (error) {
    console.log("🔴ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

//! to verify otp
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    if (!user.isVerified && !otpValid(user, otp)) {
      return res.status(400).json({ message: "Invalid or expired OTP!" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // generate token
    res.json({
      token: makeToken(user._id),
      user: clean(user),
    });
  } catch (error) {
    console.log("🔴ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

//! resend OTP
export const resendOtp = async (req, res) => {
  try {
    const user = findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "User NOT FOUND!" });
    user.otp = genreateOtp();
    user.otpExpires = otpExpiry();

    await user.save();

    await sendOtpEmail(user.email, user.otp, "Verify your Pollix account");
    res.json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.log("🔴ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

//! login/sign-in user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
        needsVerification: true,
        email,
      });
    }

    res.json({
      token: makeToken(user._id),
      user: clean(user),
    });
  } catch (error) {
    console.log("🔴ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

//! update profile (after logging/signing-in)
export const updateProfile = async (req, res) => {
  try {
    const { name, username, bio } = req.body;
    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username && username !== user.username) {
      const taken = await UserModel.findOne({ username });
      if (taken)
        return res.status(400).json({ message: "Username already taken" });
      user.username = username;
    }
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (req.file) {
      try {
        user.avatar = await uploadToCloudinary(req.file.buffer);
      } catch (e) {
        console.warn("Avatar upload skipped:", e.message);
      }
    }
    await user.save();
    res.json({ user: clean(user) });
  } catch (err) {
    console.log("🔴ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

//! to change password
export const changePassword = async (req, res) => {
  try {
    const { currPassword, newPassword } = req.bdoy;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: "New Password must be atleast 8 characters!",
      });
    }
    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!(await user.matchPassword(currPassword))) {
      return res.status(400).json({
        message: "Current password is incorrect!",
      });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully!" });
  } catch (err) {
    console.log("🔴ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

//! delete user-account
export const deleteAccount = async (req, res) => {
  try {
    const id = req.userId;
    const myPolls = await PollModel.find({ creator: id }).select("_id");
    const pollIds = myPolls.map((poll) => poll._id);

    await CommentModel.deleteMany({
      $or: [{ user: id }, { poll: { $in: pollIds } }],
    });

    await PollModel.deleteMany({ creator: id });
    await PollModel.updateMany({}, { $pull: { votes: { user: id } } });
    await UserModel.findByIdAndDelete(id);

    res.json({ message: "Account deleted successfully!" });
  } catch (err) {
    console.log("🔴ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

//! get logged-in user's details
export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found!" });
    const [created, voted] = await Promise.all([
      PollModel.countDocuments({ creator: user._id }),
      PollModel.countDocuments({ "votes.user": user._id }),
    ]);
    res.json({
      user: clean(user),
      stats: {
        created,
        voted,
        bookmarked: user.bookmarks.length,
      },
    });
  } catch (err) {
    console.log("🔴ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
