const Bill = require("../models/Billing");
const Medicine = require("../models/Medicine");
const mongoose = require("mongoose");

// Create a new bill
const createBill = async (req, res) => {
  try {
    const { patientName, mobileNumber, address, items, totalAmount } = req.body;

    // Validate items and update medicine stock
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `Medicine with ID ${item.medicineId} not found`,
        });
      }

      if (medicine.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stockQuantity}`,
        });
      }

      // Update medicine stock
      medicine.stockQuantity -= item.quantity;
      await medicine.save();
    }

    // Create new bill
    const bill = new Bill({
      patientName,
      mobileNumber,
      address,
      items,
      totalAmount,
    });

    await bill.save();

    res.status(201).json({
      success: true,
      data: bill,
      message: "Bill created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating bill",
      error: error.message,
    });
  }
};

// Get all bills
const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find().sort({ billingDate: -1 });
    res.status(200).json({
      success: true,
      data: bills,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bills",
      error: error.message,
    });
  }
};

// Get bill by ID
const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }
    res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bill",
      error: error.message,
    });
  }
};

// Get bills by date range
const getBillsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const bills = await Bill.find({
      billingDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ billingDate: -1 });

    res.status(200).json({
      success: true,
      data: bills,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bills by date range",
      error: error.message,
    });
  }
};

// Get bills by patient
const getBillsByPatient = async (req, res) => {
  try {
    const { mobileNumber } = req.params;
    const bills = await Bill.find({ mobileNumber }).sort({ billingDate: -1 });

    res.status(200).json({
      success: true,
      data: bills,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching patient bills",
      error: error.message,
    });
  }
};

// Delete bill (with stock restoration)
const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    // Restore medicine stock
    for (const item of bill.items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (medicine) {
        medicine.stockQuantity += item.quantity;
        await medicine.save();
      }
    }

    await Bill.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Bill deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting bill",
      error: error.message,
    });
  }
};

// Get billing statistics
const getBillingStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.billingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const stats = await Bill.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          totalBills: { $sum: 1 },
          averageBillAmount: { $avg: "$totalAmount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalSales: 0,
        totalBills: 0,
        averageBillAmount: 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching billing statistics",
      error: error.message,
    });
  }
};

module.exports = {
  createBill,
  getAllBills,
  getBillById,
  getBillsByDateRange,
  getBillsByPatient,
  deleteBill,
  getBillingStats,
};
