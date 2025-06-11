const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const medicineRoutes = require("./routes/medicineRoutes");
const userRoutes = require("./routes/userRoutes");
const stockRoutes = require("./routes/stockRoutes");
const billingRoutes = require("./routes/billingRoutes");

dotenv.config();

const app = express();

const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
  })
);
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/medicines", medicineRoutes);
app.use("/users", userRoutes);
app.use("/stocks", stockRoutes);
app.use("/bills", billingRoutes);

// Basic route
app.get("/", (req, res) => {
  res.send("Medicine Inventory API");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
