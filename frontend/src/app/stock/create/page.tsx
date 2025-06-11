"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { withAuth } from "@/components/auth/withAuth";
import APIServiceManager from "@/services/APIServiceManager";
import styles from "../stock.module.css";

interface Medicine {
  _id?: string;
  name: string;
  price: number;
  stock: string;
  stockQuantity: number;
  expiryDate: string;
  batchNo: string;
  manufactureDate: string;
  strength: string;
  form: string;
  mrp: number;
}

interface Stock {
  _id: string;
  stockDate: string;
  medicines?: Medicine[];
}

function StockPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockMedicines, setStockMedicines] = useState<Medicine[]>([]);
  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
  const [stock, setStock] = useState<Stock | null>(null);
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<string>("");

  const [medicine, setMedicine] = useState<Omit<Medicine, "_id">>({
    name: "",
    price: 0,
    stock: "",
    stockQuantity: 0,
    expiryDate: "",
    batchNo: "",
    manufactureDate: "",
    strength: "",
    form: "",
    mrp: 0,
  });
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  // Fetch all medicines and stocks when component mounts
  useEffect(() => {
    fetchMedicines();
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const api = APIServiceManager.getInstance();
      const response = await api.getAllStocks();
      if (response.success && Array.isArray(response.data)) {
        setAllStocks(response.data);
      }
    } catch (err) {
      setError("Failed to fetch stocks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const api = APIServiceManager.getInstance();
      const response = await api.getAllMedicines();
      if (Array.isArray(response)) {
        setAllMedicines(response);
      }
    } catch (err) {
      setError("Failed to fetch medicines");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const api = APIServiceManager.getInstance();

      if (editingMedicine?._id) {
        // Update existing medicine
        const updateResponse = await api.updateMedicine(
          editingMedicine._id,
          medicine
        );
        if (!updateResponse.message) {
          // Update the medicine in the stockMedicines array
          setStockMedicines((prev) =>
            prev.map((m) =>
              m._id === editingMedicine._id
                ? { ...m, ...medicine, _id: m._id }
                : m
            )
          );
        } else {
          throw updateResponse;
        }
      } else {
        let stockId = "";
        if (!stock) {
          const stockResponse = await api.createStock();
          if (stockResponse.success) {
            stockId = (stockResponse.data as Stock)._id;
            setStock(stockResponse.data as Stock);
          }
        } else {
          stockId = stock._id;
        }

        console.log(stockId);
        // Create new medicine with the stock ID
        const createResponse = await api.createMedicine({
          ...medicine,
          stock: stockId,
        });

        if (!createResponse.message) {
          let newMedicine = createResponse as unknown as Medicine;
          newMedicine = { ...newMedicine, stock: stockId };
          console.log("New Medicine: ", newMedicine);
          setStockMedicines((prev) => [...prev, newMedicine]);
        } else {
          throw { message: "Failed to add medicine" };
        }
      }

      // Reset form
      setMedicine({
        name: "",
        price: 0,
        stock: "",
        stockQuantity: 0,
        expiryDate: "",
        batchNo: "",
        manufactureDate: "",
        strength: "",
        form: "",
        mrp: 0,
      });
      setEditingMedicine(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save medicine");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setMedicine({
      name: medicine.name,
      price: medicine.price,
      stock: medicine.stock,
      stockQuantity: medicine.stockQuantity,
      expiryDate: new Date(medicine.expiryDate).toISOString().split("T")[0],
      batchNo: medicine.batchNo,
      manufactureDate: new Date(medicine.manufactureDate)
        .toISOString()
        .split("T")[0],
      strength: medicine.strength,
      form: medicine.form,
      mrp: medicine.mrp,
    });
    setEditingMedicine(medicine);
  };

  const handleDelete = async (medicineId: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;

    try {
      setLoading(true);
      const api = APIServiceManager.getInstance();
      await api.deleteMedicine(medicineId);

      // Remove medicine from both arrays
      setAllMedicines((prev) => prev.filter((m) => m._id !== medicineId));
      setStockMedicines((prev) => prev.filter((m) => m._id !== medicineId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete medicine"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setMedicine((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "mrp" || name === "stockQuantity"
          ? Number(value)
          : value,
    }));

    // Show suggestions when typing in medicine name
    if (name === "name") {
      const searchTerm = value.toLowerCase().trim();
      if (searchTerm.length > 0) {
        console.log(searchTerm);
        const filteredSuggestions = allMedicines.filter((med) =>
          med.name.toLowerCase().includes(searchTerm)
        );
        console.log(filteredSuggestions);
        setSuggestions(filteredSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  const handleSuggestionClick = (suggestedMedicine: Medicine) => {
    setMedicine((prev) => ({
      ...prev,
      name: suggestedMedicine.name,
      price: suggestedMedicine.price,
    }));
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

  const handleStockChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stockId = e.target.value;
    setSelectedStockId(stockId);

    if (stockId === "new") {
      setStock(null);
      setStockMedicines([]);
      return;
    }

    try {
      setLoading(true);
      const api = APIServiceManager.getInstance();
      const response = await api.getStockById(stockId);
      if (response.success) {
        const selectedStock = response.data as Stock;
        setStock(selectedStock);

        // Fetch medicines for the selected stock
        try {
          const medicinesResponse = await api.getMedicinesByStock(stockId);
          if (Array.isArray(medicinesResponse)) {
            setStockMedicines(medicinesResponse);
          }
        } catch (err) {
          setStockMedicines([]);
          console.log(err);
        }
      }
    } catch (err) {
      setError("Failed to fetch stock details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.stockContainer}>
        <h1>Add Stock</h1>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.stockContent}>
          <div className={styles.addFormContainer}>
            <h2>{editingMedicine ? "Edit Medicine" : "Add New Medicine"}</h2>
            <form onSubmit={handleSubmit} className={styles.addForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="stockSelect">Select Stock</label>
                  <select
                    id="stockSelect"
                    value={selectedStockId}
                    onChange={handleStockChange}
                    className={styles.stockSelect}
                    required
                  >
                    <option value="">Select a stock</option>
                    <option value="new">Create New Stock</option>
                    {allStocks.map((stock) => (
                      <option key={stock._id} value={stock._id}>
                        {stock._id} -{" "}
                        {new Date(stock.stockDate).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Medicine Name</label>
                  <div className={styles.suggestionContainer}>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={medicine.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter medicine name"
                      autoComplete="off"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className={styles.suggestionsList}>
                        {suggestions.map((suggestion) => (
                          <li
                            key={suggestion._id}
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion.name} - Rs. {suggestion.price}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="batchNo">Batch Number</label>
                  <input
                    type="text"
                    id="batchNo"
                    name="batchNo"
                    value={medicine.batchNo}
                    onChange={handleChange}
                    required
                    placeholder="Enter batch number"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="manufactureDate">Manufacture Date</label>
                  <input
                    type="date"
                    id="manufactureDate"
                    name="manufactureDate"
                    value={medicine.manufactureDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="strength">Strength</label>
                  <input
                    type="text"
                    id="strength"
                    name="strength"
                    value={medicine.strength}
                    onChange={handleChange}
                    required
                    placeholder="Enter strength (e.g., 500mg)"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="form">Form</label>
                  <input
                    type="text"
                    id="form"
                    name="form"
                    value={medicine.form}
                    onChange={handleChange}
                    required
                    placeholder="Enter form (e.g., Tablet, Capsule)"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="mrp">MRP</label>
                  <input
                    type="number"
                    id="mrp"
                    name="mrp"
                    value={medicine.mrp}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter MRP"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="price">Cost Price</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={medicine.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter Cost Price"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="stockQuantity">Quantity</label>
                  <input
                    type="number"
                    id="stockQuantity"
                    name="stockQuantity"
                    value={medicine.stockQuantity}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="Enter quantity"
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : editingMedicine
                    ? "Update Medicine"
                    : "Add Medicine"}
                </button>
              </div>
            </form>
          </div>

          <div className={styles.medicinesTableContainer}>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : stockMedicines.length ? (
              <table className={styles.medicinesTable}>
                <thead>
                  <tr>
                    <th>Stock ID</th>
                    <th>Name</th>
                    <th>Batch No</th>
                    <th>Strength</th>
                    <th>Form</th>
                    <th>MRP</th>
                    <th>Price</th>
                    <th>Stock Quantity</th>
                    <th>Manufacture Date</th>
                    <th>Expiry Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stockMedicines.map((medicine: Medicine) => {
                    return (
                      <tr key={medicine._id}>
                        <td>{(medicine.stock as unknown as Stock)._id}</td>
                        <td>{medicine.name}</td>
                        <td>{medicine.batchNo}</td>
                        <td>{medicine.strength}</td>
                        <td>{medicine.form}</td>
                        <td>Rs. {medicine.mrp}</td>
                        <td>Rs. {medicine.price}</td>
                        <td>{medicine.stockQuantity}</td>
                        <td>
                          {new Date(
                            medicine.manufactureDate
                          ).toLocaleDateString()}
                        </td>
                        <td>
                          {new Date(medicine.expiryDate).toLocaleDateString()}
                        </td>
                        <td className={styles.tableActions}>
                          <button
                            className={styles.editButton}
                            onClick={() => handleEdit(medicine)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() =>
                              medicine._id && handleDelete(medicine._id)
                            }
                            title="Delete"
                          >
                            {/* 🗑️ */}
                            ❌
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className={styles.noMedicines}>
                No medicines added in the stock
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(StockPage);
