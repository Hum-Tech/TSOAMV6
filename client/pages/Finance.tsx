import React, { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Filter,
  Receipt,
  Building,
  BookOpen,
  Calculator,
  Target,
  PieChart,
  BarChart3,
  Printer,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  CreditCard,
  Wallet,
  Home,
  Book,
  Landmark,
  ShoppingCart,
  TrendingDown as ExpenseIcon,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { exportService } from "@/services/ExportService";
import { offlineService } from "@/services/OfflineService";
import { financialTransactionService } from "@/services/FinancialTransactionService";
import { FinanceApprovalCenter } from "@/components/FinanceApprovalCenter";

// Real-time dashboard refresh utility
const triggerDashboardRefresh = () => {
  localStorage.setItem("dashboard_refresh", Date.now().toString());
  // Also trigger refresh event for cross-tab communication
  window.dispatchEvent(new CustomEvent("finance_data_updated"));
};

// Enhanced types for comprehensive financial management
interface Transaction {
  id: string;
  date: string;
  type: "Income" | "Expense" | "Investment";
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  reference: string;
  status: "Pending" | "Completed" | "Cancelled";
  preacher?: string;
  serviceType?: string;
  giverName?: string;
  supplier?: string;
  receiptNumber?: string;
  approvedBy?: string;
  vatAmount?: number;
  vatNumber?: string;
  accountCode: string;
  department?: string;
  notes?: string;
  investmentType?: string;
  roi?: number;
  timestamp: string;
  is_demo_data?: boolean;
}

interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  supplier: string;
  receiptNumber: string;
  approvedBy: string;
  status: "Pending" | "Approved" | "Rejected" | "Paid";
  vatAmount?: number;
  vatNumber?: string;
  accountCode: string;
  department: string;
  notes?: string;
  timestamp: string;
  is_demo_data?: boolean;
}

interface InvestmentRecord {
  id: string;
  type:
    | "Book Sales Revenue"
    | "Property Rental Income"
    | "Equipment Rental Income"
    | "Fixed Deposit Returns"
    | "Stock Dividends"
    | "Business Partnership Returns"
    | "Real Estate Investment Returns"
    | "Church Investment Fund Returns"
    | "Other Investment Income";
  title: string;
  description: string;
  initialAmount: number;
  currentValue: number;
  income: number;
  expenses: number;
  roi: number;
  startDate: string;
  status: "Active" | "Inactive" | "Completed";
  location?: string;
  notes?: string;
  timestamp: string;
  is_demo_data?: boolean;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  terms: string;
  notes?: string;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
  timestamp: string;
  is_demo_data?: boolean;
}

// Church expense categories
const CHURCH_EXPENSE_CATEGORIES = {
  "Ministry Operations": [
    "Pastoral Allowances",
    "Evangelism Programs",
    "Sunday School Materials",
    "Youth Ministry",
    "Women's Ministry",
    "Men's Ministry",
    "Children's Ministry",
    "Worship Equipment",
    "Bible Study Materials",
    "Missions Support",
  ],
  "Facility Management": [
    "Electricity Bills",
    "Water Bills",
    "Internet & Phone",
    "Security Services",
    "Cleaning Supplies",
    "Maintenance & Repairs",
    "Rent/Mortgage",
    "Insurance",
    "Property Taxes",
    "Landscaping",
  ],
  Administrative: [
    "Office Supplies",
    "Printing & Stationery",
    "Bank Charges",
    "Legal & Professional Fees",
    "Accounting Services",
    "Audit Fees",
    "Licenses & Permits",
    "Software Subscriptions",
    "Equipment Purchase",
    "Training & Development",
  ],
  Personnel: [
    "Pastoral Salaries",
    "Staff Salaries",
    "Employee Benefits",
    "NSSF Contributions",
    "NHIF Contributions",
    "PAYE Tax",
    "Housing Levy",
    "Medical Insurance",
    "Transport Allowances",
    "Overtime Pay",
  ],
  "Welfare & Community": [
    "Medical Assistance",
    "Educational Support",
    "Emergency Relief",
    "Food Distribution",
    "Widows Support",
    "Orphan Care",
    "Community Outreach",
    "Charity Events",
    "Donations to Needy",
    "Funeral Assistance",
  ],
  "Events & Programs": [
    "Conference Expenses",
    "Revival Meetings",
    "Special Services",
    "Christmas Programs",
    "Easter Events",
    "Wedding Ceremonies",
    "Funeral Services",
    "Baptism Events",
    "Youth Camps",
    "Retreat Programs",
  ],
};

const OFFERING_TYPES = [
  "Normal Offering",
  "Thanksgiving Offering",
  "Tithe",
  "Prophetic Seed",
  "Sacrifice",
  "Project Offering",
  "Building Fund",
  "Missions Offering",
  "Special Collection",
  "Emergency Fund",
];

const SERVICE_TYPES = [
  "Main Service",
  "Mid-week Service",
  "Sunday School",
  "Youth Service",
  "Prayer Meeting",
  "Bible Study",
  "Special Service",
  "Conference",
  "Revival",
  "Wedding",
  "Funeral",
];

const INVESTMENT_TYPES = [
  "Book Sales Revenue",
  "Property Rental Income",
  "Equipment Rental Income",
  "Conference Hall Rental Income",
  "Parking Fees Income",
  "Fixed Deposit Returns",
  "Treasury Bills Returns",
  "Church Investment Fund Returns",
  "Business Partnership Income",
  "Real Estate Investment Returns",
  "Other Investment Income",
];

const PAYMENT_METHODS = [
  "Cash",
  "M-Pesa",
  "Bank Transfer",
  "Cheque",
  "EFT",
  "Credit Card",
];

// Data management with demo/real separation
class FinanceDataManager {
  private static instance: FinanceDataManager;
  private subscribers: Array<() => void> = [];
  private data: {
    transactions: Transaction[];
    expenses: ExpenseRecord[];
    investments: InvestmentRecord[];
    invoices: InvoiceData[];
  };

  constructor() {
    this.data = this.loadFromStorage();
    this.setupPeriodicSync();
  }

  static getInstance(): FinanceDataManager {
    if (!FinanceDataManager.instance) {
      FinanceDataManager.instance = new FinanceDataManager();
    }
    return FinanceDataManager.instance;
  }

  subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  }

  private notify() {
    this.subscribers.forEach((callback) => callback());
  }

  private loadFromStorage() {
    const stored = localStorage.getItem("tsoam-finance-data");
    if (stored) {
      return JSON.parse(stored);
    }
    return this.getInitialData();
  }

  private saveToStorage() {
    localStorage.setItem("tsoam-finance-data", JSON.stringify(this.data));
    this.syncToNetwork();
  }

  private async syncToNetwork() {
    try {
      const networkData = localStorage.getItem("tsoam-network-sync");
      if (networkData) {
        const parsed = JSON.parse(networkData);
        if (
          parsed.lastUpdate &&
          new Date(parsed.lastUpdate) >
            new Date(this.data.transactions[0]?.timestamp || 0)
        ) {
          this.data = parsed.data;
          this.notify();
        }
      }

      localStorage.setItem(
        "tsoam-network-sync",
        JSON.stringify({
          data: this.data,
          lastUpdate: new Date().toISOString(),
        }),
      );
    } catch (error) {
      console.error("Network sync error:", error);
    }
  }

  private setupPeriodicSync() {
    setInterval(() => {
      this.syncToNetwork();
    }, 5000);
  }

  private getInitialData() {
    return {
      transactions: [
        {
          id: "TXN-2025-001",
          date: "2025-01-15",
          type: "Income" as const,
          category: "Normal Offering",
          subcategory: "Main Service",
          description: "Sunday main service offering collection",
          amount: 45000,
          currency: "KSH",
          paymentMethod: "Cash",
          reference: "CASH-001-2025",
          status: "Completed" as const,
          preacher: "Pastor John Kamau",
          serviceType: "Main Service",
          giverName: "Anonymous",
          accountCode: "4001",
          notes: "Sunday main service collection",
          timestamp: new Date().toISOString(),
          is_demo_data: true,
        },
      ],
      expenses: [
        {
          id: "EXP-2025-001",
          date: "2025-01-15",
          category: "Facility Management",
          subcategory: "Electricity Bills",
          description: "Kenya Power - January 2025 electricity bill",
          amount: 25000,
          currency: "KSH",
          paymentMethod: "Bank Transfer",
          supplier: "Kenya Power & Lighting Co.",
          receiptNumber: "KP-789456123",
          approvedBy: "Pastor John Kamau",
          status: "Paid" as const,
          vatAmount: 4000,
          vatNumber: "P051234567M",
          accountCode: "6001",
          department: "Facilities",
          notes: "Monthly electricity bill for church premises",
          timestamp: new Date().toISOString(),
          is_demo_data: true,
        },
      ],
      investments: [
        {
          id: "INV-2025-001",
          type: "Book Sales Revenue" as const,
          title: "Christian Literature Sales Revenue",
          description:
            "Income generated from sales of Christian books and materials at church bookstore",
          initialAmount: 50000,
          currentValue: 75000,
          income: 45000,
          expenses: 20000,
          roi: 50.0,
          startDate: "2024-01-01",
          status: "Active" as const,
          location: "Church Bookstore",
          notes:
            "Revenue from book sales - monthly inventory restocking required",
          timestamp: new Date().toISOString(),
          is_demo_data: true,
        },
        {
          id: "INV-2025-002",
          type: "Property Rental Income" as const,
          title: "Church Hall Rental Revenue",
          description:
            "Income from renting church hall for weddings, conferences and events",
          initialAmount: 0,
          currentValue: 150000,
          income: 150000,
          expenses: 25000,
          roi: 83.3,
          startDate: "2024-06-01",
          status: "Active" as const,
          location: "Main Church Hall",
          notes: "Popular venue for community events - good revenue stream",
          timestamp: new Date().toISOString(),
          is_demo_data: true,
        },
        {
          id: "INV-2025-003",
          type: "Fixed Deposit Returns" as const,
          title: "Bank Fixed Deposit Interest",
          description:
            "Returns from church fixed deposit account with KCB Bank",
          initialAmount: 500000,
          currentValue: 540000,
          income: 40000,
          expenses: 0,
          roi: 8.0,
          startDate: "2024-01-01",
          status: "Active" as const,
          location: "KCB Bank Kahawa West",
          notes: "12-month fixed deposit at 8% annual interest rate",
          timestamp: new Date().toISOString(),
          is_demo_data: true,
        },
      ],
      invoices: [
        {
          id: "INV-001",
          invoiceNumber: "TSOAM-2025-001",
          date: "2025-01-15",
          clientName: "Community Development Group",
          clientAddress: "P.O. Box 123, Nairobi",
          clientPhone: "+254 700 123456",
          clientEmail: "info@cdg.co.ke",
          items: [
            {
              description: "Conference Hall Rental - 3 Days",
              quantity: 3,
              unitPrice: 15000,
              total: 45000,
            },
          ],
          subtotal: 45000,
          vatRate: 16,
          vatAmount: 7200,
          total: 52200,
          terms: "Payment due within 30 days",
          status: "Sent" as const,
          timestamp: new Date().toISOString(),
          is_demo_data: true,
        },
      ],
    };
  }

  getData() {
    return this.data;
  }

  addTransaction(transaction: Omit<Transaction, "id" | "timestamp">) {
    const newTransaction: Transaction = {
      ...transaction,
      id: `TXN-2025-${(this.data.transactions.length + 1).toString().padStart(3, "0")}`,
      timestamp: new Date().toISOString(),
      is_demo_data: false, // Real data
    };
    this.data.transactions.unshift(newTransaction);
    this.saveToStorage();
    this.notify();
    return newTransaction;
  }

  addExpense(expense: Omit<ExpenseRecord, "id" | "timestamp">) {
    const newExpense: ExpenseRecord = {
      ...expense,
      id: `EXP-2025-${(this.data.expenses.length + 1).toString().padStart(3, "0")}`,
      timestamp: new Date().toISOString(),
      is_demo_data: false, // Real data
    };
    this.data.expenses.unshift(newExpense);
    this.saveToStorage();
    this.notify();
    return newExpense;
  }

  addInvestment(investment: Omit<InvestmentRecord, "id" | "timestamp">) {
    const newInvestment: InvestmentRecord = {
      ...investment,
      id: `INV-2025-${(this.data.investments.length + 1).toString().padStart(3, "0")}`,
      timestamp: new Date().toISOString(),
      is_demo_data: false, // Real data
    };
    this.data.investments.unshift(newInvestment);
    this.saveToStorage();
    this.notify();
    return newInvestment;
  }

  addInvoice(invoice: Omit<InvoiceData, "id" | "invoiceNumber" | "timestamp">) {
    const newInvoice: InvoiceData = {
      ...invoice,
      id: `INV-${(this.data.invoices.length + 1).toString().padStart(3, "0")}`,
      invoiceNumber: `TSOAM-2025-${(this.data.invoices.length + 1).toString().padStart(3, "0")}`,
      timestamp: new Date().toISOString(),
      is_demo_data: false, // Real data
    };
    this.data.invoices.unshift(newInvoice);
    this.saveToStorage();
    this.notify();
    return newInvoice;
  }
}

export default function Finance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(new Date());

  // Data management
  const dataManager = FinanceDataManager.getInstance();
  const [data, setData] = useState(dataManager.getData());
  const [centralizedTransactions, setCentralizedTransactions] = useState(
    financialTransactionService.getTransactions(),
  );
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    const unsubscribe = dataManager.subscribe(() => {
      setData(dataManager.getData());
      setLastSync(new Date());
    });

    // Subscribe to centralized financial transactions
    const handleCentralizedUpdate = () => {
      setCentralizedTransactions(financialTransactionService.getTransactions());
      setLastSync(new Date());
    };

    const handleApprovalUpdate = (pendingCount: number) => {
      setPendingApprovals(pendingCount);
    };

    financialTransactionService.subscribe(handleCentralizedUpdate);
    financialTransactionService.subscribeToApprovals(handleApprovalUpdate);

    return () => {
      unsubscribe();
      financialTransactionService.unsubscribe(handleCentralizedUpdate);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Form states
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: "Income",
    category: "",
    subcategory: "",
    description: "",
    amount: 0,
    currency: "KSH",
    paymentMethod: "",
    reference: "",
    status: "Completed",
    accountCode: "4001",
    notes: "",
  });

  const [newExpense, setNewExpense] = useState<Partial<ExpenseRecord>>({
    category: "",
    subcategory: "",
    description: "",
    amount: 0,
    currency: "KSH",
    paymentMethod: "",
    supplier: "",
    receiptNumber: "",
    department: "",
    status: "Pending",
    accountCode: "6001",
    notes: "",
  });

  // Calculations - using centralized transaction data
  const centralizedSummary = financialTransactionService.getFinancialSummary();

  const totalIncome =
    centralizedSummary.totalIncome +
    data.transactions
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses =
    centralizedSummary.totalExpenses +
    data.expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const totalInvestmentIncome = data.investments.reduce(
    (sum, inv) => sum + inv.income,
    0,
  );

  const netIncome = totalIncome + totalInvestmentIncome - totalExpenses;

  // Export functions using ExportService
  const exportToExcel = async (
    dataToExport: any[],
    filename: string,
    title: string,
  ) => {
    try {
      await exportService.export({
        filename,
        title: `TSOAM Church - ${title}`,
        subtitle: `Total Records: ${dataToExport.length}`,
        data: dataToExport,
        format: "excel",
      });
      return true;
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Export failed: " + error.message);
      return false;
    }
  };

  const generatePrintableReport = (content: string, title: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .church-name {
                color: #8B4513;
                font-size: 28px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 10px;
                text-transform: uppercase;
              }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8B4513; padding-bottom: 15px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #8B4513; color: white; font-weight: bold; }
              .total-row { font-weight: bold; background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            <div class="church-name">TSOAM CHURCH INTERNATIONAL</div>
            <div class="header">
              <h2>${title}</h2>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="content">
              ${content}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      return true;
    }
    return false;
  };

  // Form handlers
  const addTransaction = async () => {
    if (!newTransaction.category || !newTransaction.amount) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // Add to local data manager
      dataManager.addTransaction({
        ...newTransaction,
        date: new Date().toISOString().split("T")[0],
        status: "Completed",
      } as Omit<Transaction, "id" | "timestamp">);

      // Send to server for persistence
      const response = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTransaction,
          date: new Date().toISOString().split("T")[0],
          status: "Completed",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add transaction");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to add transaction");
      }

      // Trigger real-time dashboard refresh
      localStorage.setItem("dashboard_refresh", Date.now().toString());

      // Log the transaction
      await fetch("/api/system-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "Transaction Added",
          module: "Finance",
          details: `${newTransaction.type} transaction: ${newTransaction.category} - KSH ${newTransaction.amount}`,
          severity: "Info",
        }),
      });

      setNewTransaction({
        type: "Income",
        category: "",
        subcategory: "",
        description: "",
        amount: 0,
        currency: "KSH",
        paymentMethod: "",
        reference: "",
        status: "Completed",
        accountCode: "4001",
        notes: "",
      });
      setIsTransactionDialogOpen(false);
      alert(
        `Transaction ${newTransaction.type} added successfully! Amount: KSH ${newTransaction.amount.toLocaleString()}`,
      );
    } catch (error) {
      console.error("Failed to add transaction:", error);

      // Show user-friendly error message
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        alert(
          "Unable to save transaction to server. Transaction saved locally only.\nPlease check your internet connection and try again later.",
        );
      } else {
        alert(`Failed to add transaction: ${error.message}`);
      }
    }
  };

  const addExpense = async () => {
    if (!newExpense.category || !newExpense.amount || !newExpense.supplier) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // Add to local data manager
      dataManager.addExpense({
        ...newExpense,
        date: new Date().toISOString().split("T")[0],
        approvedBy: "Pending",
        status: "Pending",
      } as Omit<ExpenseRecord, "id" | "timestamp">);

      // Send to server for persistence
      const response = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newExpense,
          date: new Date().toISOString().split("T")[0],
          approved_by: "Pending",
          status: "Pending",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add expense");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to add expense");
      }

      // Trigger real-time dashboard refresh
      localStorage.setItem("dashboard_refresh", Date.now().toString());

      // Log the expense
      await fetch("/api/system-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "Expense Added",
          module: "Finance",
          details: `Expense: ${newExpense.category} - KSH ${newExpense.amount} (${newExpense.supplier})`,
          severity: "Info",
        }),
      });

      setNewExpense({
        category: "",
        subcategory: "",
        description: "",
        amount: 0,
        currency: "KSH",
        paymentMethod: "",
        supplier: "",
        receiptNumber: "",
        department: "",
        status: "Pending",
        accountCode: "6001",
        notes: "",
      });
      setIsExpenseDialogOpen(false);
      alert(
        `Expense added successfully! Amount: KSH ${newExpense.amount.toLocaleString()} - ${newExpense.supplier}`,
      );
    } catch (error) {
      console.error("Failed to add expense:", error);

      // Show user-friendly error message
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        alert(
          "Unable to save expense to server. Expense saved locally only.\nPlease check your internet connection and try again later.",
        );
      } else {
        alert(`Failed to add expense: ${error.message}`);
      }
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Church Finance Management"
        description={
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm text-muted-foreground">
              {isOnline ? "Online" : "Offline"} • Last sync:{" "}
              {lastSync.toLocaleTimeString()}
            </span>
          </div>
        }
        actions={
          <>
            <Dialog
              open={isTransactionDialogOpen}
              onOpenChange={setIsTransactionDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Transaction Type</Label>
                      <Select
                        value={newTransaction.type}
                        onValueChange={(value) =>
                          setNewTransaction({
                            ...newTransaction,
                            type: value as "Income" | "Expense" | "Investment",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Income">Income</SelectItem>
                          <SelectItem value="Expense">Expense</SelectItem>
                          <SelectItem value="Investment">
                            Investment Revenue
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={newTransaction.category}
                        onValueChange={(value) =>
                          setNewTransaction({
                            ...newTransaction,
                            category: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {newTransaction.type === "Income" &&
                            OFFERING_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          {newTransaction.type === "Investment" &&
                            INVESTMENT_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          {newTransaction.type === "Expense" &&
                            Object.keys(CHURCH_EXPENSE_CATEGORIES).map(
                              (cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ),
                            )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newTransaction.description}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          description: e.target.value,
                        })
                      }
                      placeholder="Transaction description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={newTransaction.amount}
                        onChange={(e) =>
                          setNewTransaction({
                            ...newTransaction,
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        onFocus={(e) => {
                          if (
                            e.target.value === "0" ||
                            e.target.value === "0.00"
                          ) {
                            setNewTransaction({
                              ...newTransaction,
                              amount: "" as any,
                            });
                          }
                        }}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select
                        value={newTransaction.paymentMethod}
                        onValueChange={(value) =>
                          setNewTransaction({
                            ...newTransaction,
                            paymentMethod: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-2">
                    <Label>Supporting Documents</Label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                      <div className="text-center">
                        <FileText className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="mt-2">
                          <label
                            htmlFor="financeDocuments"
                            className="cursor-pointer"
                          >
                            <span className="text-sm text-blue-600 hover:text-blue-500">
                              Upload receipts, invoices, or supporting documents
                            </span>
                            <input
                              id="financeDocuments"
                              type="file"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files) {
                                  // Handle file upload here
                                  console.log(
                                    "Files uploaded:",
                                    e.target.files,
                                  );
                                }
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, Excel, DOC, JPG up to 10MB each
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={addTransaction}>Add Transaction</Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsTransactionDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isExpenseDialogOpen}
              onOpenChange={setIsExpenseDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Receipt className="h-4 w-4 mr-2" />
                  Record Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Record Church Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Expense Category</Label>
                      <Select
                        value={newExpense.category}
                        onValueChange={(value) =>
                          setNewExpense({ ...newExpense, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(CHURCH_EXPENSE_CATEGORIES).map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Subcategory</Label>
                      <Select
                        value={newExpense.subcategory}
                        onValueChange={(value) =>
                          setNewExpense({ ...newExpense, subcategory: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {newExpense.category &&
                            CHURCH_EXPENSE_CATEGORIES[
                              newExpense.category as keyof typeof CHURCH_EXPENSE_CATEGORIES
                            ]?.map((subcat) => (
                              <SelectItem key={subcat} value={subcat}>
                                {subcat}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newExpense.description}
                      onChange={(e) =>
                        setNewExpense({
                          ...newExpense,
                          description: e.target.value,
                        })
                      }
                      placeholder="Detailed expense description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Amount (KSH)</Label>
                      <Input
                        type="number"
                        value={newExpense.amount}
                        onChange={(e) =>
                          setNewExpense({
                            ...newExpense,
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        onFocus={(e) => {
                          if (
                            e.target.value === "0" ||
                            e.target.value === "0.00"
                          ) {
                            setNewExpense({
                              ...newExpense,
                              amount: "" as any,
                            });
                          }
                        }}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Supplier</Label>
                      <Input
                        value={newExpense.supplier}
                        onChange={(e) =>
                          setNewExpense({
                            ...newExpense,
                            supplier: e.target.value,
                          })
                        }
                        placeholder="Supplier/vendor name"
                      />
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-2">
                    <Label>Supporting Documents</Label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                      <div className="text-center">
                        <FileText className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="mt-2">
                          <label
                            htmlFor="expenseDocuments"
                            className="cursor-pointer"
                          >
                            <span className="text-sm text-blue-600 hover:text-blue-500">
                              Upload receipts, invoices, or supporting documents
                            </span>
                            <input
                              id="expenseDocuments"
                              type="file"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files) {
                                  // Handle file upload here
                                  console.log(
                                    "Files uploaded:",
                                    e.target.files,
                                  );
                                }
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, Excel, DOC, JPG up to 10MB each
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={addExpense}>Record Expense</Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsExpenseDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  KSH {totalIncome.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Income
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  KSH {totalExpenses.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Expenses
                </div>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  KSH {totalInvestmentIncome.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Revenue from Investments
                </div>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  KSH {netIncome.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Net Income</div>
              </div>
              <Calculator className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <div className="flex justify-between items-center">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="approvals" className="relative">
              Approvals
              {pendingApprovals > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {pendingApprovals}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Real-time sync
            </div>
            <span>•</span>
            <span>{centralizedTransactions.length} transactions</span>
            <span>•</span>
            <span>Last sync: {lastSync.toLocaleTimeString()}</span>
          </div>
        </div>

        <TabsContent value="approvals">
          <FinanceApprovalCenter />
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions (All Modules)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {centralizedTransactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-3 border rounded"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {transaction.module}
                          </Badge>
                          <span className="font-medium text-sm">
                            {transaction.description}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.category} • {transaction.date}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-medium ${transaction.type === "Income" ? "text-green-600" : "text-red-600"}`}
                        >
                          {transaction.type === "Income" ? "+" : "-"}KSH{" "}
                          {transaction.amount.toLocaleString()}
                        </div>
                        <Badge variant="default">{transaction.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export & Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    const txnData = data.transactions.map((txn) => ({
                      "Transaction ID": txn.id,
                      Date: txn.date,
                      Type: txn.type,
                      Category: txn.category,
                      Description: txn.description,
                      "Amount (KSH)": txn.amount,
                      Status: txn.status,
                    }));
                    exportToExcel(
                      txnData,
                      "TSOAM_Transactions",
                      "Transactions",
                    );
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Transactions
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    const content = `
                      <table>
                        <thead>
                          <tr><th colspan="2" style="text-align: center; font-size: 18px; background-color: #8B4513; color: white;">PROFIT & LOSS STATEMENT</th></tr>
                        </thead>
                        <tbody>
                          <tr><td colspan="2"><strong>INCOME</strong></td></tr>
                          <tr><td>Total Income</td><td>KSH ${totalIncome.toLocaleString()}</td></tr>
                          <tr><td>Investment Income</td><td>KSH ${totalInvestmentIncome.toLocaleString()}</td></tr>
                          <tr class="total-row"><td><strong>Total Income</strong></td><td><strong>KSH ${(totalIncome + totalInvestmentIncome).toLocaleString()}</strong></td></tr>
                          <tr><td colspan="2"><strong>EXPENSES</strong></td></tr>
                          <tr><td>Total Expenses</td><td>KSH ${totalExpenses.toLocaleString()}</td></tr>
                          <tr class="total-row"><td><strong>Net Income</strong></td><td><strong>KSH ${netIncome.toLocaleString()}</strong></td></tr>
                        </tbody>
                      </table>
                    `;
                    generatePrintableReport(content, "Profit & Loss Statement");
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print P&L Statement
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Display centralized transactions from all modules */}
                  {centralizedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.id}
                      </TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.type === "Income"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${
                            transaction.module === "HR"
                              ? "bg-blue-50 text-blue-700"
                              : transaction.module === "Welfare"
                                ? "bg-purple-50 text-purple-700"
                                : transaction.module === "Events"
                                  ? "bg-orange-50 text-orange-700"
                                  : transaction.module === "Inventory"
                                    ? "bg-yellow-50 text-yellow-700"
                                    : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {transaction.module}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell
                        className={`font-semibold ${transaction.type === "Income" ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.type === "Income" ? "+" : "-"}
                        {transaction.currency}{" "}
                        {transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{transaction.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Church Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.id}
                      </TableCell>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.supplier}</TableCell>
                      <TableCell className="font-semibold">
                        {expense.currency} {expense.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            expense.status === "Paid" ? "default" : "secondary"
                          }
                        >
                          {expense.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    const expenseData = data.expenses.map((exp) => ({
                      "Expense ID": exp.id,
                      Date: exp.date,
                      Category: exp.category,
                      Description: exp.description,
                      Supplier: exp.supplier,
                      "Amount (KSH)": exp.amount,
                      Status: exp.status,
                    }));
                    exportToExcel(
                      expenseData,
                      "TSOAM_Expense_Report",
                      "Expenses",
                    );
                  }}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Export Expense Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Connection Status:</span>
                    <Badge variant={isOnline ? "default" : "secondary"}>
                      {isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Sync:</span>
                    <span className="text-sm">
                      {lastSync.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Records:</span>
                    <span className="text-sm">
                      {data.transactions.length + data.expenses.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
