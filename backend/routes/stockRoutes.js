const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");
// const { authenticateToken } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
// router.use(authenticateToken);

// Create a new stock
router.post("/", stockController.createStock);

// Get all stocks
router.get("/", stockController.getAllStocks);

// Get stock by ID
router.get("/:id", stockController.getStockById);

// Delete stock
router.delete("/:id", stockController.deleteStock);

module.exports = router;
