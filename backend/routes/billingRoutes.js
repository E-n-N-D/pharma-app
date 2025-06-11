const express = require("express");
const billingController = require("../controllers/billingController");

const router = express.Router();

// Get billing statistics
router.get("/stats", billingController.getBillingStats);

// Get bills by date range
router.get("/date-range", billingController.getBillsByDateRange);

// Get bills by patient
router.get("/patient/:mobileNumber", billingController.getBillsByPatient);

// Create a new bill
router.post("/", billingController.createBill);

// Get all bills
router.get("/", billingController.getAllBills);

// Get bill by ID
router.get("/:id", billingController.getBillById);

// Delete bill
router.delete("/:id", billingController.deleteBill);

module.exports = router;
