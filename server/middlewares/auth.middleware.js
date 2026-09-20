import jwt from "jsonwebtoken";

export const protectMw = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

  if (!token)
    return res
      .status(401)
      .json({ message: "UNAUTHORIZED - Not authorized, no token!" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
        console.log("🔴ERROR:", error);
        res
          .status(401)
          .json({ message: "UNAUTHORIZED - Not authorized, no token!" });
  }
};
