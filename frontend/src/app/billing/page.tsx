"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import APIServiceManager from "@/services/APIServiceManager";
import styles from "./billing.module.css";
import { withAuth } from "@/components/auth/withAuth";
import { ToWords } from "to-words";
import { useRouter } from "next/navigation";

interface Medicine {
  _id: string;
  name: string;
  price: number;
  stock: string;
  stockQuantity: number;
  expiryDate: string;
}

interface BillItem {
  medicineId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Bill {
  patientName: string;
  mobileNumber: string;
  address: string;
  items: BillItem[];
  totalAmount: number;
  billingDate: string;
}

const toWords = new ToWords({
  localeCode: "en-NP",
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: true,
    doNotAddOnly: false,
    currencyOptions: {
      // can be used to override defaults for the selected locale
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

function BillingPage() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [bill, setBill] = useState<Bill>({
    patientName: "",
    mobileNumber: "",
    address: "",
    items: [],
    totalAmount: 0,
    billingDate: new Date().toISOString(),
  });
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const api = APIServiceManager.getInstance();
      const response = await api.getAllMedicines();
      const data = response as unknown as Medicine[];
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to fetch medicines");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBill((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMedicineSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim().length > 0) {
      // First filter by name
      const nameFiltered = medicines.filter((med) =>
        med.name.toLowerCase().includes(value.toLowerCase())
      );

      // Then filter out zero quantity medicines if there are other stocks of the same medicine
      const filteredSuggestions = nameFiltered.filter((medicine) => {
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

      setSuggestions(filteredSuggestions.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (medicine: Medicine) => {
    setSelectedMedicine(medicine._id);
    setSearchTerm(medicine.name);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.suggestionContainer}`)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddMedicine = () => {
    if (!selectedMedicine || quantity <= 0) return;

    const medicine = medicines.find((m) => m._id === selectedMedicine);
    if (!medicine) return;

    if (quantity > medicine.stockQuantity) {
      setError("Quantity exceeds available stock");
      return;
    }

    const newItem: BillItem = {
      medicineId: medicine._id,
      name: medicine.name,
      quantity: quantity,
      price: medicine.price,
      total: medicine.price * quantity,
    };

    setBillItems((prev) => [...prev, newItem]);
    setBill((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
      totalAmount: prev.totalAmount + newItem.total,
    }));

    // Reset selection
    setSelectedMedicine("");
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    const removedItem = billItems[index];
    setBillItems((prev) => prev.filter((_, i) => i !== index));
    setBill((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      totalAmount: prev.totalAmount - removedItem.total,
    }));
  };

  const handleSaveBill = async () => {
    if (!bill.patientName || !bill.mobileNumber || bill.items.length === 0) {
      setError(
        "Please fill in all required fields and add at least one medicine"
      );
      return;
    }

    try {
      setLoading(true);
      const api = APIServiceManager.getInstance();

      // Create the bill using the billing API
      const billData = {
        patientName: bill.patientName,
        mobileNumber: Number(bill.mobileNumber),
        address: bill.address,
        items: bill.items,
        totalAmount: bill.totalAmount,
      };

      const response = await api.createBill(billData);

      if (response.success) {
        // Refresh medicines list to get updated stock quantities
        await fetchMedicines();

        // Reset form
        setBill({
          patientName: "",
          mobileNumber: "",
          address: "",
          items: [],
          totalAmount: 0,
          billingDate: new Date().toISOString(),
        });
        setBillItems([]);
        setError(null);

        // Show success message
        alert("Bill created successfully!");
      } else {
        throw new Error(response.message || "Failed to create bill");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save bill");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBill = () => {
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
      <div className={styles.billingContainer}>
        <h1>Create Bill</h1>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.billingForm}>
          <div className={styles.patientInfo}>
            <h2>Patient Information</h2>
            <div className={styles.formGroup}>
              <label htmlFor="patientName">Patient Name *</label>
              <input
                type="text"
                id="patientName"
                name="patientName"
                value={bill.patientName}
                onChange={handlePatientInfoChange}
                required
                placeholder="Enter patient name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="mobileNumber">Mobile Number *</label>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                value={bill.mobileNumber}
                onChange={handlePatientInfoChange}
                required
                placeholder="Enter mobile number"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={bill.address}
                onChange={handlePatientInfoChange}
                placeholder="Enter address"
              />
            </div>
          </div>

          <div className={styles.medicineSelection}>
            <h2>Add Medicines</h2>
            <div className={styles.medicineForm}>
              <div className={styles.formGroup}>
                <label htmlFor="medicine">Select Medicine</label>
                <div className={styles.suggestionContainer}>
                  <input
                    type="text"
                    id="medicine"
                    value={searchTerm}
                    onChange={handleMedicineSearch}
                    placeholder="Search medicine..."
                    autoComplete="off"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className={styles.suggestionsList}>
                      {suggestions.map((medicine) => (
                        <li
                          key={medicine._id}
                          onClick={() => handleSuggestionClick(medicine)}
                        >
                          {medicine.name} - Rs. {medicine.price} (Stock:{" "}
                          {medicine.stockQuantity})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="quantity">Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="1"
                  placeholder="Enter quantity"
                />
              </div>

              <button
                className={styles.addButton}
                onClick={handleAddMedicine}
                disabled={!selectedMedicine || quantity <= 0}
              >
                Add to Bill
              </button>
            </div>
          </div>

          <div className={styles.billItems}>
            <h2>Bill Items</h2>
            {billItems.length > 0 ? (
              <table className={styles.billTable}>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>Rs. {item.price.toFixed(2)}</td>
                      <td>Rs. {item.total.toFixed(2)}</td>
                      <td>
                        <button
                          className={styles.removeButton}
                          onClick={() => handleRemoveItem(index)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className={styles.totalLabel}>
                      Total Amount:
                    </td>
                    <td colSpan={2} className={styles.totalAmount}>
                      Rs. {bill.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className={styles.noItems}>No items added to the bill</p>
            )}
          </div>

          <div className={styles.billActions}>
            <button
              className={styles.saveButton}
              onClick={handleSaveBill}
              disabled={loading || billItems.length === 0}
            >
              {loading ? "Saving..." : "Save Bill"}
            </button>
            <button
              className={styles.printButton}
              onClick={handlePrintBill}
              disabled={billItems.length === 0}
            >
              Print Bill
            </button>
          </div>
        </div>
      </div>
      <button
        className={styles.floatingButton}
        onClick={() => router.push("/billing/history")}
      >
        📋 Show Bills
      </button>
    </DashboardLayout>
  );
}

export default withAuth(BillingPage);
