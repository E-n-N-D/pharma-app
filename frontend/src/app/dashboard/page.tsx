"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import APIServiceManager from "@/services/APIServiceManager";
import styles from "./dashboard.module.css";
import { withAuth } from "@/components/auth/withAuth";
import { stockTypes, expiryAlert } from "../utilities/stockAlert";

interface Medicine {
  _id: string;
  name: string;
  price: number;
  stock: string;
  stockQuantity: number;
  expiryDate: string;
  stockDate?: string;
  batchNo: string;
  manufactureDate: string;
  mrp: number;
  strength: string;
  form: string;
}

interface Stock {
  _id: string;
  stockDate: string;
}

type StockStatus = "out-of-stock" | "low-stock" | "optimal-stock" | "overstock";

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

function DashboardPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const api = APIServiceManager.getInstance();
        const response = await api.getAllMedicines();
        const data = response as unknown as Medicine[];
        const medicinesWithStock = await Promise.all(
          data.map(async (meds) => {
            const stock: Stock = (await api.getStockById(meds.stock))
              .data as Stock;
            return { ...meds, stockDate: stock.stockDate };
          })
        );
        setMedicines(medicinesWithStock);
        console.log(data);
      } catch (err) {
        setError("Failed to fetch medicines");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  const getExpiringMedicines = () => {
    if (medicines.length === 0) return [];
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + new expiryAlert().DAYS);

    return medicines.filter((medicine) => {
      const expiryDate = new Date(medicine.expiryDate);
      return expiryDate <= expiryThreshold && expiryDate >= new Date();
    });
  };

  const getStockStatus = (quantity: number): StockStatus => {
    if (quantity === 0) return "out-of-stock";
    if (quantity < new stockTypes().LOW_STOCK) return "low-stock";
    if (quantity < new stockTypes().OPTIMAL_STOCK) return "optimal-stock";
    return "overstock";
  };

  const getLowStockMedicines = () => {
    // Group medicines by name and combine their quantities
    const combinedMedicines = medicines.reduce((acc, medicine) => {
      const existingMedicine = acc.find((m) => m.name === medicine.name);
      if (existingMedicine) {
        existingMedicine.stockQuantity += medicine.stockQuantity;
        // Keep the most recent stock date
        if (
          new Date(medicine.stockDate!) > new Date(existingMedicine.stockDate!)
        ) {
          existingMedicine.stockDate = medicine.stockDate;
        }
        // Keep the latest price
        existingMedicine.price = medicine.price;
      } else {
        acc.push({ ...medicine });
      }
      return acc;
    }, [] as Medicine[]);

    // Filter medicines with combined quantity below LOW_STOCK threshold
    return combinedMedicines.filter(
      (medicine) => medicine.stockQuantity < new stockTypes().LOW_STOCK
    );
  };

  if (loading)
    return (
      <DashboardLayout>
        <div>Loading...</div>
      </DashboardLayout>
    );
  if (error)
    return (
      <DashboardLayout>
        <div className={styles.error}>{error}</div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className={styles.dashboard}>
        <h1>Dashboard</h1>

        <div className={styles.alertsContainer}>
          <div className={styles.alertSection}>
            <h2>Medicines Expiring Soon</h2>
            <div className={styles.alertList}>
              {medicines.length === 0 || getExpiringMedicines().length === 0 ? (
                <p className={styles.noAlerts}>No medicines expiring soon</p>
              ) : (
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
                      <th>Status</th>
                      <th>Manufacture Date</th>
                      <th>Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getExpiringMedicines().map((medicine: Medicine) => {
                      const status = getStockStatus(medicine.stockQuantity);
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
                              className={`${styles.stockStatus} ${styles[status]}`}
                            >
                              {getStockStatusText(status)}
                            </span>
                          </td>
                          <td>
                            {new Date(
                              medicine.manufactureDate
                            ).toLocaleDateString()}
                          </td>
                          <td>
                            <span
                              className={`${styles.stockStatus} ${styles["out-of-stock"]}`}
                            >
                              {new Date(
                                medicine.expiryDate
                              ).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className={styles.alertSection}>
            <h2>Low Stock Alert</h2>
            <div className={styles.alertList}>
              {getLowStockMedicines().length === 0 ? (
                <p className={styles.noAlerts}>No low stock alerts</p>
              ) : (
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
                      <th>Status</th>
                      <th>Manufacture Date</th>
                      <th>Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getLowStockMedicines().map((medicine: Medicine) => {
                      const status = getStockStatus(medicine.stockQuantity);
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
                              className={`${styles.stockStatus} ${styles[status]}`}
                            >
                              {getStockStatusText(status)}
                            </span>
                          </td>
                          <td>
                            {new Date(
                              medicine.manufactureDate
                            ).toLocaleDateString()}
                          </td>
                          <td>
                            {new Date(medicine.expiryDate).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DashboardPage);
