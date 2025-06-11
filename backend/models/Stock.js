const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    stockDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  }
);

const Stock = mongoose.model("Stock", stockSchema);

module.exports = Stock;
