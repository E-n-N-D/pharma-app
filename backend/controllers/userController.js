const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");

// Login user
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });

    // Check if user exists and password matches
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Return user info and token
    res.status(200).json({
      success: true,
      user: {
        username: user.username,
        isAdmin: user.isAdmin,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        username: user.username,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user data",
      error: error.message,
    });
  }
};

module.exports = {
  loginUser,
  getCurrentUser,
};
