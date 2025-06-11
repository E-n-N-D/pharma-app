import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

interface LoginResponse {
  success: boolean;
  user: {
    username: string;
    isAdmin: boolean;
  };
  token: string;
}

interface UserResponse {
  success: boolean;
  user: {
    username: string;
    isAdmin: boolean;
  };
}

interface Stock {
  _id: string;
  stockDate: string;
}

interface StockResponse {
  success: boolean;
  data: Stock | Stock[];
  message?: string;
}

interface Medicine {
  _id: string;
  name: string;
  price: number;
  stock: string;
  stockQuantity: number;
  expiryDate: string;
}

interface MedicineResponse {
  success: boolean;
  data: Medicine | Medicine[];
  message?: string;
}

interface BillItem {
  medicineId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Bill {
  _id: string;
  billingDate: string;
  patientName: string;
  mobileNumber: number;
  address: string;
  items: BillItem[];
  totalAmount: number;
}

interface BillResponse {
  success: boolean;
  data: Bill | Bill[];
  message?: string;
}

interface BillingStats {
  totalSales: number;
  totalBills: number;
  averageBillAmount: number;
}

interface BillingStatsResponse {
  success: boolean;
  data: BillingStats;
  message?: string;
}

class APIServiceManager {
  private static instance: APIServiceManager;
  private api: AxiosInstance;
  private token: string | null = null;

  private constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Load token from localStorage if it exists
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
      if (this.token) {
        this.setAuthToken(this.token);
      }
    }

    // Add response interceptor for handling token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearAuthToken();
          // Redirect to login page if token is invalid
          // if (typeof window !== "undefined") {
          //   window.location.href = "/";
          // }
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): APIServiceManager {
    if (!APIServiceManager.instance) {
      APIServiceManager.instance = new APIServiceManager();
    }
    return APIServiceManager.instance;
  }

  private setAuthToken(token: string): void {
    this.token = token;
    this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  }

  private clearAuthToken(): void {
    this.token = null;
    delete this.api.defaults.headers.common["Authorization"];
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }

  // Auth Services
  public async login(
    username: string,
    password: string
  ): Promise<LoginResponse> {
    try {
      const response = await this.api.post<LoginResponse>("/users/login", {
        username,
        password,
      });
      if (response.data.success && response.data.token) {
        this.setAuthToken(response.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async getCurrentUser(): Promise<UserResponse> {
    try {
      const response = await this.api.get<UserResponse>("/users/me");
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public logout(): void {
    this.clearAuthToken();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }

  // Generic request method for future API calls
  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.request<T>(config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  // Stock Services
  public async createStock(): Promise<StockResponse> {
    try {
      const response = await this.api.post<StockResponse>("/stocks");
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async getStockById(id: string): Promise<StockResponse> {
    try {
      const response = await this.api.get<StockResponse>(`/stocks/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async getAllStocks(): Promise<StockResponse> {
    try {
      const response = await this.api.get<StockResponse>("/stocks");
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  // Medicine Services
  public async getAllMedicines(): Promise<MedicineResponse> {
    try {
      const response = await this.api.get<MedicineResponse>("/medicines");
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async getMedicineById(id: string): Promise<MedicineResponse> {
    try {
      const response = await this.api.get<MedicineResponse>(`/medicines/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async getMedicinesByStock(stockId: string): Promise<MedicineResponse> {
    try {
      const response = await this.api.get<MedicineResponse>(
        `/medicines/stock/${stockId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async createMedicine(
    medicineData: Omit<Medicine, "_id">
  ): Promise<MedicineResponse> {
    try {
      const response = await this.api.post<MedicineResponse>(
        "/medicines",
        medicineData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async updateMedicine(
    id: string,
    medicineData: Partial<Medicine>
  ): Promise<MedicineResponse> {
    try {
      const response = await this.api.put<MedicineResponse>(
        `/medicines/${id}`,
        medicineData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async deleteMedicine(id: string): Promise<MedicineResponse> {
    try {
      const response = await this.api.delete<MedicineResponse>(
        `/medicines/${id}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  // Billing Services
  public async createBill(
    billData: Omit<Bill, "_id" | "billingDate">
  ): Promise<BillResponse> {
    try {
      const response = await this.api.post<BillResponse>("/bills", billData);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async getAllBills(): Promise<BillResponse> {
    try {
      const response = await this.api.get<BillResponse>("/bills");
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async getBillById(id: string): Promise<BillResponse> {
    try {
      const response = await this.api.get<BillResponse>(`/bills/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async getBillsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<BillResponse> {
    try {
      const response = await this.api.get<BillResponse>("/bills/date-range", {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async getBillsByPatient(mobileNumber: number): Promise<BillResponse> {
    try {
      const response = await this.api.get<BillResponse>(
        `/bills/patient/${mobileNumber}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async deleteBill(id: string): Promise<BillResponse> {
    try {
      const response = await this.api.delete<BillResponse>(`/bills/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  public async getBillingStats(
    startDate?: string,
    endDate?: string
  ): Promise<BillingStatsResponse> {
    try {
      const response = await this.api.get<BillingStatsResponse>(
        "/bills/stats",
        {
          params: { startDate, endDate },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<{ message: string }>);
    }
  }

  private handleError(error: AxiosError<{ message: string }>): Error {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return new Error(error.response.data?.message || "An error occurred");
    } else if (error.request) {
      // The request was made but no response was received
      return new Error("No response from server");
    } else {
      // Something happened in setting up the request that triggered an Error
      return new Error(error.message || "An error occurred");
    }
  }
}

export default APIServiceManager;
