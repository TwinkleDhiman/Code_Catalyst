const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendSuccess, sendError } = require("../utils/apiResponse");

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    // Validation
    if (!fullname || !email || !password) {
      return sendError(res, "Please provide full name, email, and password", 400);
    }

    if (password.length < 6) {
      return sendError(res, "Password must be at least 6 characters long", 400);
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return sendError(res, "User with this email already exists", 400);
    }

    // Create user in MongoDB (Password is automatically hashed via Mongoose pre-save hook)
    const user = await User.create({
      fullname,
      email: email.toLowerCase(),
      password,
    });

    if (user) {
      const token = generateToken(user._id, user.email);
      return sendSuccess(
        res,
        {
          user: {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
          },
          token,
        },
        "User registered successfully",
        201
      );
    } else {
      return sendError(res, "Invalid user data", 400);
    }
  } catch (error) {
    console.error("[Register Error]:", error);
    return sendError(res, error.message || "Failed to register user", 500);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Please enter both email and password", 400);
    }

    // Find user in MongoDB
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return sendError(res, "Invalid email or password", 401);
    }

    // Verify password using bcrypt matchPassword method
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, "Invalid email or password", 401);
    }

    // Generate JWT token
    const token = generateToken(user._id, user.email);

    return sendSuccess(
      res,
      {
        user: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
        },
        token,
      },
      "Logged in successfully"
    );
  } catch (error) {
    console.error("[Login Error]:", error);
    return sendError(res, error.message || "Failed to log in", 500);
  }
};

/**
 * @desc    Get logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return sendError(res, "User profile not found", 404);
    }

    return sendSuccess(res, {
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[GetMe Error]:", error);
    return sendError(res, "Failed to fetch user profile", 500);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
