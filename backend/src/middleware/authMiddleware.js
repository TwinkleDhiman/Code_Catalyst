const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendError } = require("../utils/apiResponse");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const secret = process.env.JWT_SECRET || "codecatalyst_super_secret_jwt_key_2026";
      const decoded = jwt.verify(token, secret);

      // Fetch user from DB, excluding password
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return sendError(res, "User not found or authorization token invalid", 401);
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error("[Auth Middleware Error]:", error.message);
      return sendError(res, "Not authorized, token failed or expired", 401);
    }
  }

  if (!token) {
    return sendError(res, "Not authorized, no token provided", 401);
  }
};

module.exports = { protect };
