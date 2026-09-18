import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { resolve } from "nodemailer/lib/shared/url.js";

// cloudinary keys
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// upload images or 4 images
export const upload = multer({ storage: multer.memoryStorage() });

// upload img to cloudinary
export const uploadToCloudinary = (buff) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "polling_app" },
      (err, result) => (err ? reject(err) : resolve(result.secure_url)),
    );
    stream.end(buff);
  });

export default cloudinary;
