"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { withAuth } from "@/components/auth/withAuth";
import APIServiceManager from "@/services/APIServiceManager";
import styles from "./stock.module.css";
import Link from "next/link";
import { stockTypes, expiryAlert } from "../utilities/stockAlert";

interface Medicine {
  _id?: string;
  name: string;
  price: number;
  stock: string;
  stockQuantity: number;
  expiryDate: string;
  batchNo: string;
  manufactureDate: string;
  mrp: number;
  strength: string;
  form: string;
}

interface Stock {
  _id: string;
  stockDate: string;
  medicines?: Medicine[];
}

type StockStatus = "out-of-stock" | "low-stock" | "optimal-stock" | "overstock";
type ExpiryStatus = "expiring" | "not-expiring";

function StockPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStockStatuses, setSelectedStockStatuses] = useState<
    Set<StockStatus>
  >(new Set());
  const [selectedExpiryStatus, setSelectedExpiryStatus] = useState<
    Set<ExpiryStatus>
  >(new Set());

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const api = APIServiceManager.getInstance();

      // Fetch all stocks
      const stocksResponse = await api.getAllStocks();
      if (stocksResponse.success) {
        const stocks = Array.isArray(stocksResponse.data)
          ? stocksResponse.data
          : [];
        setAllStocks(stocks);
      }

      // Fetch all medicines
      const medicinesResponse = await api.getAllMedicines();
      const medicines = Array.isArray(medicinesResponse)
        ? medicinesResponse
        : [];

      // Filter out zero quantity medicines if there are other stocks of the same medicine
      const filteredMedicines = medicines.filter((medicine) => {
        if (medicine.stockQuantity === 0) {
          // Check if there are other stocks of the same medicine with non-zero quantity
          const hasOtherStocks = medicines.some(
            (med) =>
              med.name === medicine.name &&
              med.stockQuantity > 0 &&
              med.stock !== medicine.stock
          );
          // Only include if there are no other stocks with non-zero quantity
          return !hasOtherStocks;
        }
        return true;
      });

      setAllMedicines(medicines);
      setFilteredMedicines(filteredMedicines);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    applyFilters(date, selectedStockStatuses, selectedExpiryStatus);
  };

  const handleStockStatusChange = (status: StockStatus) => {
    const newSelectedStatuses = new Set(selectedStockStatuses);
    if (newSelectedStatuses.has(status)) {
      newSelectedStatuses.delete(status);
    } else {
      newSelectedStatuses.add(status);
    }
    setSelectedStockStatuses(newSelectedStatuses);
    applyFilters(selectedDate, newSelectedStatuses, selectedExpiryStatus);
  };

  const handleExpiryStatusChange = (status: ExpiryStatus) => {
    const newSelectedStatuses = new Set(selectedExpiryStatus);
    if (newSelectedStatuses.has(status)) {
      newSelectedStatuses.delete(status);
    } else {
      newSelectedStatuses.add(status);
    }
    setSelectedExpiryStatus(newSelectedStatuses);
    applyFilters(selectedDate, selectedStockStatuses, newSelectedStatuses);
  };

  const applyFilters = (
    date: string,
    stockStatuses: Set<StockStatus>,
    expiryStatuses: Set<ExpiryStatus>
  ) => {
    let filtered = [...allMedicines];

    // Apply date filter
    if (date) {
      const selectedStock = allStocks.find(
        (stock) =>
          new Date(stock.stockDate).toISOString().split("T")[0] === date
      );
      if (selectedStock) {
        filtered = filtered.filter(
          (medicine) => medicine.stock === selectedStock._id
        );
      }
    } else {
      // If no date is selected, exclude medicines with zero quantity if there are other stocks of the same medicine
      filtered = filtered.filter((medicine) => {
        if (medicine.stockQuantity === 0) {
          // Check if there are other stocks of the same medicine with non-zero quantity
          const hasOtherStocks = allMedicines.some(
            (med) =>
              med.name === medicine.name &&
              med.stockQuantity > 0 &&
              med.stock !== medicine.stock
          );
          // Only include if there are no other stocks with non-zero quantity
          return !hasOtherStocks;
        }
        return true;
      });
    }

    // Apply stock status filters based on combined quantities
    if (stockStatuses.size > 0) {
      filtered = filtered.filter((medicine) =>
        stockStatuses.has(getCombinedStockStatus(medicine.name))
      );
    }

    // Apply expiry status filters
    if (expiryStatuses.size > 0) {
      filtered = filtered.filter((medicine) =>
        expiryStatuses.has(getExpiryStatus(medicine.expiryDate))
      );
    }

    setFilteredMedicines(filtered);
  };

  const getCombinedStockStatus = (medicineName: string): StockStatus => {
    const combinedQuantity = allMedicines
      .filter((med) => med.name === medicineName)
      .reduce((sum, med) => sum + med.stockQuantity, 0);

    if (combinedQuantity === 0) return "out-of-stock";
    if (combinedQuantity < new stockTypes().LOW_STOCK) return "low-stock";
    if (combinedQuantity < new stockTypes().OPTIMAL_STOCK)
      return "optimal-stock";
    return "overstock";
  };

  const getExpiryStatus = (expiryDate: string): ExpiryStatus => {
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + new expiryAlert().DAYS);
    const medicineExpiryDate = new Date(expiryDate);
    return medicineExpiryDate <= expiryThreshold &&
      medicineExpiryDate >= new Date()
      ? "expiring"
      : "not-expiring";
  };

  const getStockStatusText = (status: StockStatus): string => {
    switch (status) {
      case "out-of-stock":
        return "Out of Stock";
      case "low-stock":
        return "Low Stock";
      case "optimal-stock":
        return "Optimal Stock";
      case "overstock":
        return "Overstock";
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.stockContainer}>
        <h1>Stock Management</h1>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.stockFilters}>
          <div className={styles.filterRow}>
            <div className={styles.dateFilter}>
              <label htmlFor="stockDate">Select Stock Date:</label>
              <select
                id="stockDate"
                value={selectedDate}
                onChange={handleDateChange}
                className={styles.dateSelect}
              >
                <option value="">All Dates</option>
                {allStocks.map((stock) => (
                  <option
                    key={stock._id}
                    value={
                      new Date(stock.stockDate).toISOString().split("T")[0]
                    }
                  >
                    {new Date(stock.stockDate).toLocaleDateString()} (ID:{" "}
                    {stock._id})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.statusFilter}>
              <label>Filter by Stock Status:</label>
              <div className={styles.statusCheckboxes}>
                <label
                  className={`${styles.statusCheckbox} ${styles["out-of-stock"]}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStockStatuses.has("out-of-stock")}
                    onChange={() => handleStockStatusChange("out-of-stock")}
                  />
                  <span>Out of Stock</span>
                </label>
                <label
                  className={`${styles.statusCheckbox} ${styles["low-stock"]}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStockStatuses.has("low-stock")}
                    onChange={() => handleStockStatusChange("low-stock")}
                  />
                  <span>Low Stock</span>
                </label>
                <label
                  className={`${styles.statusCheckbox} ${styles["optimal-stock"]}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStockStatuses.has("optimal-stock")}
                    onChange={() => handleStockStatusChange("optimal-stock")}
                  />
                  <span>Optimal Stock</span>
                </label>
                <label
                  className={`${styles.statusCheckbox} ${styles["overstock"]}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStockStatuses.has("overstock")}
                    onChange={() => handleStockStatusChange("overstock")}
                  />
                  <span>Overstock</span>
                </label>
              </div>
            </div>

            <div className={styles.statusFilter}>
              <label>Filter by Expiry Status:</label>
              <div className={styles.statusCheckboxes}>
                <label
                  className={`${styles.statusCheckbox} ${styles["expiring"]}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedExpiryStatus.has("expiring")}
                    onChange={() => handleExpiryStatusChange("expiring")}
                  />
                  <span>Expiring Soon</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.stockContent}>
          <div className={styles.medicinesTableContainer}>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : filteredMedicines.length ? (
              <table className={styles.medicinesTable}>
                <thead>
                  <tr>
                    <th>Batch No</th>
                    <th>Name</th>
                    <th>Strength</th>
                    <th>Form</th>
                    <th>MRP</th>
                    <th>Price</th>
                    <th>Stock Quantity</th>
                    <th>Stock Status</th>
                    <th>Manufacture Date</th>
                    <th>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map((medicine: Medicine) => {
                    const stockStatus = getCombinedStockStatus(medicine.name);
                    const expiryStatus = getExpiryStatus(medicine.expiryDate);
                    return (
                      <tr key={medicine._id}>
                        <td>{medicine.batchNo}</td>
                        <td>{medicine.name}</td>
                        <td>{medicine.strength}</td>
                        <td>{medicine.form}</td>
                        <td>Rs. {medicine.mrp}</td>
                        <td>Rs. {medicine.price}</td>
                        <td>{medicine.stockQuantity}</td>
                        <td>
                          <span
                            className={`${styles.stockStatus} ${styles[stockStatus]}`}
                          >
                            {getStockStatusText(stockStatus)}
                          </span>
                        </td>
                        <td>
                          {new Date(
                            medicine.manufactureDate
                          ).toLocaleDateString()}
                        </td>
                        <td>
                          <span
                            className={`${styles.stockStatus} ${
                              expiryStatus === "expiring"
                                ? styles["expiring"]
                                : ""
                            }`}
                          >
                            {new Date(medicine.expiryDate).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className={styles.noMedicines}>No medicines in stock</p>
            )}
          </div>
        </div>

        <Link href="/stock/create">
          <button className={styles.floatingButton} style={{ display: "flex" }}>
            <span>+</span>
            <span>Add New Stock</span>
          </button>
        </Link>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(StockPage);
