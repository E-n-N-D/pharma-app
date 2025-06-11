const Stock = require("../models/Stock");
const Medicine = require("../models/Medicine");

// Create a new stock
exports.createStock = async (req, res) => {
  try {
    const stock = new Stock({
      stockDate: new Date(),
    });
    await stock.save();
    res.status(201).json({
      success: true,
      data: stock,
      message: "Stock created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error creating stock",
    });
  }
};

// Get all stocks
exports.getAllStocks = async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.status(200).json({
      success: true,
      data: stocks,
      message: "Stocks retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving stocks",
    });
  }
};

// Get stock by ID
exports.getStockById = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }
    res.status(200).json({
      success: true,
      data: stock,
      message: "Stock retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving stock",
    });
  }
};

// Delete stock
exports.deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    // Delete all medicines associated with this stock
    await Medicine.deleteMany({ stock: req.params.id });

    // Delete the stock
    await stock.deleteOne();

    res.status(200).json({
      success: true,
      message: "Stock and associated medicines deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting stock",
    });
  }
};
