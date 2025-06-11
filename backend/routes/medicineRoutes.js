const express = require("express");
const {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getMedicinesByStock,
} = require("../controllers/medicineController.js");

const router = express.Router();

// Create a new medicine
router.post("/", createMedicine);

// Get all medicines
router.get("/", getAllMedicines);

// Get medicines by stock ID
router.get("/stock/:stockId", getMedicinesByStock);

// Get a single medicine
router.get("/:id", getMedicineById);

// Update a medicine
router.put("/:id", updateMedicine);

// Delete a medicine
router.delete("/:id", deleteMedicine);

module.exports = router;
