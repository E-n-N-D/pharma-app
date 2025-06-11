const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
  }
);

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true},
    totalPrice: { type: Number, required: true}
  }
)

const purchaseOrderSchema = new mongoose.Schema(
  {
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    orderDate: { type: Date, required: true, default: Date.now },
    items: { type: [purchaseOrderItemSchema], required: true, validate: v => v.length > 0 },
    status: {
      type: String,
      enum: ['Pending', 'Ordered', 'Partially Received', 'Received', 'Cancelled'],
      default: 'Pending',
    },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    receivedDate: Date,
  }
)

const Supplier = mongoose.model("Supplier", supplierSchema);
const PurchaseOrderItem = mongoose.model("PurchaseOrderItem", purchaseOrderItemSchema);
const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);

module.exports = {Supplier, PurchaseOrderItem, PurchaseOrder};
