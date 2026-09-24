import { Router } from "express";
import { upload } from "../config/cloudinary.js";
import {
  changePassword,
  deleteAccount,
  getMe,
  login,
  register,
  resendOtp,
  updateProfile,
  verifyOtp,
} from "../controllers/auth.controller.js";
import {
  forgotPassword,
  resetPassword,
  verifyResetOtp,
} from "../controllers/password.controller.js";
import { protectMw } from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", upload.single("image"), register);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/resend-otp", resendOtp);

authRouter.post("/login", login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/verify-resend-otp", verifyResetOtp);

authRouter.post("/reset-password", resetPassword);

authRouter.get("/me", protectMw, getMe);

authRouter.patch("/profile", protectMw, upload.single("image"), updateProfile);
authRouter.patch(
  "/password",
  protectMw,
  upload.single("image"),
  changePassword,
);
authRouter.delete("/account", protectMw, deleteAccount);

export default authRouter;
