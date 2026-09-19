import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;
const app = express();

// BuiltIn-Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (_, res) => {
  res.json({ code: 200, message: "Pollify-API Working ✅" });
});

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    app.listen(PORT, () => {
      console.log(`🔵 Server running on: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("🔴 Failed to start server");
    console.error(error);
    process.exit(1);
  }
};

start();

//00.39.03
