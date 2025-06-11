const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    billingDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    patientName: {type: String, required: true},
    mobileNumber: {type: Number, required: true},
    address: {type: String, required: true},
    items: [{
      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine",
        required: true,
      },
      name: {type: String, required: true},
      quantity: {type: Number, required: true},
      price: {type: Number, required: true},
      total: {type: Number, required: true},
    }],
    totalAmount: {type: Number, required: true},
  }
);

const Bill = mongoose.model("Bill", billSchema);

module.exports = Bill;


// interface Bill {
//   patientName: string;
//   mobileNumber: string;
//   address: string;
//   items: BillItem[];
//   totalAmount: number;
//   date: string;
// }

// interface BillItem {
//   medicineId: string;
//   name: string;
//   quantity: number;
//   price: number;
//   total: number;
// }
