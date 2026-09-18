import mongoose from "mongoose";

const connectDB = async (url) => {
  try {
    const connection = await mongoose.connect(url);
    console.log(`🟢 MongoDB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:");
    console.error(error.message);
    throw new Error("Database connection failed.");
  }
};

export default connectDB;
