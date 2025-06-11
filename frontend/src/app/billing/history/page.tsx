"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import APIServiceManager from "@/services/APIServiceManager";
import { withAuth } from "@/components/auth/withAuth";
import styles from "./history.module.css";
import { ToWords } from "to-words";

interface Bill {
  _id: string;
  billingDate: string;
  patientName: string;
  mobileNumber: number;
  address: string;
  items: {
    medicineId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  totalAmount: number;
}

interface BillingStats {
  totalSales: number;
  totalBills: number;
  averageBillAmount: number;
}

const toWords = new ToWords({
  localeCode: "en-NP",
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: true,
    doNotAddOnly: false,
    currencyOptions: {
      name: "Rupee",
      plural: "Rupees",
      symbol: "₹",
      fractionalUnit: {
        name: "Paisa",
        plural: "Paise",
        symbol: "",
      },
    },
  },
});

function BillingHistoryPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    mobileNumber: "",
  });

  useEffect(() => {
    fetchStats();
    fetchBills();
  }, []);

  const fetchStats = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      const api = APIServiceManager.getInstance();
      const response = await api.getBillingStats(startDate, endDate);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      setError("Failed to fetch billing statistics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      const api = APIServiceManager.getInstance();
      let response;

      if (filters.mobileNumber) {
        response = await api.getBillsByPatient(Number(filters.mobileNumber));
      } else if (filters.startDate && filters.endDate) {
        response = await api.getBillsByDateRange(
          filters.startDate,
          filters.endDate
        );
      } else {
        response = await api.getAllBills();
      }

      if (response.success) {
        setBills(
          Array.isArray(response.data) ? response.data : [response.data]
        );
      }
    } catch (err) {
      setError("Failed to fetch bills");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBills();
    fetchStats(filters.startDate, filters.endDate);
  };

  const handleReset = () => {
    setFilters({
      startDate: "",
      endDate: "",
      mobileNumber: "",
    });
    fetchBills();
    fetchStats();
  };

  const handleBillClick = (bill: Bill) => {
    setSelectedBill(bill);
  };

  const handleCloseModal = () => {
    setSelectedBill(null);
  };

  const handlePrintBill = (bill: Bill) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const billContent = `
      <html>
        <head>
          <title>Mahendrajhyadi Health Post</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 5px; margin: 0;}
            h1,h2,h3,h4,p {margin: 10px;}
            .header { text-align: center; margin-bottom: 20px; }
            .patient-info { margin-bottom: 20px; }
            .words {font-size: 1rem; font-weight: bold;}
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .total { text-align: right; font-weight: bold; margin-bottom: 25px;}
            .total > p {margin: 5px;}
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>Mahendra Jhyadi Health Post</h3>
            <h4>Hariharpurgadhi Rural Municipality - 4, Sindhuli</h4>
            <p>PAN NO.: 1234</p>
            <p>INVOICE BILL</p>
            <p>Date: ${new Date(bill.billingDate).toLocaleDateString()}</p>
          </div>
          
          <div class="patient-info">
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> ${bill.patientName}</p>
            <p><strong>Mobile:</strong> ${bill.mobileNumber}</p>
            <p><strong>Address:</strong> ${bill.address}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>S.N.</th>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items
                .map(
                  (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>Rs. ${item.price.toFixed(2)}</td>
                  <td>Rs. ${item.total.toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="total">
            <p>Bill Amount: Rs.${bill.totalAmount.toFixed(2)}</p>
            <p>Total Amount: Rs.${bill.totalAmount.toFixed(2)}</p>
            <p>Tender Amount: Rs.${bill.totalAmount.toFixed(2)}</p>
          </div>
          <p class="words">Rupees in Words: ${toWords.convert(
            bill.totalAmount.toFixed(2) as unknown as number
          )}</p>

          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()">Print Bill</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(billContent);
    printWindow.document.close();
  };

  return (
    <DashboardLayout>
      <div className={styles.historyContainer}>
        <h1>Billing History</h1>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.statsContainer}>
          {stats && (
            <>
              <div className={styles.statCard}>
                <h3>Total Sales</h3>
                <p>Rs. {stats.totalSales.toFixed(2)}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Total Bills</h3>
                <p>{stats.totalBills}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Average Bill Amount</h3>
                <p>Rs. {stats.averageBillAmount.toFixed(2)}</p>
              </div>
            </>
          )}
        </div>

        <div className={styles.filterContainer}>
          <h2>Filter Bills</h2>
          <form onSubmit={handleFilterSubmit} className={styles.filterForm}>
            <div className={styles.formGroup}>
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="mobileNumber">Mobile Number</label>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                value={filters.mobileNumber}
                onChange={handleFilterChange}
                placeholder="Enter mobile number"
              />
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleReset}
                className={styles.resetButton}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className={styles.billsContainer}>
          <h2>Bills</h2>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : bills.length > 0 ? (
            <div className={styles.tableContainer}>
              <table className={styles.billsTable}>
                <thead>
                  <tr>
                    <th>Bill ID</th>
                    <th>Patient Name</th>
                    <th>Mobile</th>
                    <th>Total Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr
                      key={bill._id}
                      onClick={() => handleBillClick(bill)}
                      className={styles.tableRow}
                    >
                      <td>#{bill._id.slice(-6)}</td>
                      <td>{bill.patientName}</td>
                      <td>{bill.mobileNumber}</td>
                      <td>Rs. {bill.totalAmount.toFixed(2)}</td>
                      <td>{new Date(bill.billingDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.noBills}>No bills found</p>
          )}
        </div>

        {selectedBill && (
          <div className={styles.modalOverlay} onClick={handleCloseModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.closeButton} onClick={handleCloseModal}>
                ×
              </button>
              <div className={styles.modalHeader}>
                <h2>Bill Details</h2>
                <p>#{selectedBill._id.slice(-6)}</p>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.billInfo}>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(selectedBill.billingDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Patient:</strong> {selectedBill.patientName}
                  </p>
                  <p>
                    <strong>Mobile:</strong> {selectedBill.mobileNumber}
                  </p>
                  <p>
                    <strong>Address:</strong> {selectedBill.address}
                  </p>
                </div>
                <div className={styles.billItems}>
                  <h3>Items</h3>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBill.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>Rs. {item.price.toFixed(2)}</td>
                          <td>Rs. {item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className={styles.totalLabel}>
                          Total Amount:
                        </td>
                        <td className={styles.totalAmount}>
                          Rs. {selectedBill.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className={styles.modalActions}>
                  <button
                    className={styles.printButton}
                    onClick={() => handlePrintBill(selectedBill)}
                  >
                    Print Bill
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default withAuth(BillingHistoryPage);
