const jwt = require("jsonwebtoken");

const generateToken = (userId, email) => {
  const secret = process.env.JWT_SECRET || "codecatalyst_super_secret_jwt_key_2026";
  return jwt.sign({ id: userId, email }, secret, {
    expiresIn: "7d",
  });
};

module.exports = generateToken;
