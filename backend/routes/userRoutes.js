const express = require("express");
const router = express.Router();
const { loginUser, getCurrentUser } = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

// Public routes
router.post("/login", loginUser);

// Protected routes
router.get("/me", verifyToken, getCurrentUser);

module.exports = router;
