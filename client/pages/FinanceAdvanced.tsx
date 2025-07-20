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
  Euro,
  CreditCard,
  Banknote,
  Printer,
  Save,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  PlusCircle,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  Loader2,
  Heart,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from "xlsx";
// jsPDF will be dynamically imported where needed
import {
  financialTransactionService,
  type FinancialTransaction,
  type OfferingData,
} from "@/services/FinancialTransactionService";

// Types for advanced accounting
interface AccountEntry {
  id: string;
  date: string;
  account: string;
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
  category: string;
  subCategory: string;
}

interface BalanceSheetItem {
  account: string;
  code: string;
  currentYear: number;
  previousYear: number;
  category: "assets" | "liabilities" | "equity";
  subCategory: string;
}

interface ProfitLossItem {
  account: string;
  code: string;
  currentPeriod: number;
  previousPeriod: number;
  budget: number;
  variance: number;
  category: "income" | "expense";
  subCategory: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  client: string;
  clientEmail: string;
  clientAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "processed";
  notes: string;
  paymentTerms: string;
  processedDate?: string;
  transactionId?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatApplicable: boolean;
}

// LPO (Local Purchase Order) interfaces
interface LPOItem {
  id: number;
  description: string;
  specification: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface LPO {
  id: string;
  lpoNumber: string;
  date: string;
  supplier: string;
  supplierEmail: string;
  supplierPhone: string;
  supplierAddress: string;
  items: LPOItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "pending" | "approved" | "sent" | "fulfilled" | "cancelled";
  notes: string;
  deliveryDate: string;
  paymentTerms: string;
  approvedBy: string;
  createdBy: string;
}

// TSOAM Service Summary Form interface
interface TSOAMServiceForm {
  id: string;
  date: string;
  theme: string;
  serviceType: string;
  minister: string;
  sermonTitle: string;
  attendance: {
    men: number;
    women: number;
    children: number;
    newComers: number;
    newConverts: number;
    cars: number;
  };
  sundaySchool: {
    teacher: string;
    attendance: number;
    offering: number;
    topic: string;
  };
  offerings: {
    wOffering: number;
    tithe: number;
    thanksgiving: number;
    sacrifice: number;
    till: number;
    sSchool: number;
    targeted: number;
    others: number;
  };
  cheques: Array<{
    number: string;
    amount: number;
    details: string;
  }>;
  foreignCurrency: number;
  otherAmounts: number;
  officials: {
    residentPastor: {
      name: string;
      date: string;
      signed: boolean;
    };
    churchAccountant: {
      name: string;
      date: string;
      signed: boolean;
    };
  };
  titheRecords: Array<{
    name: string;
    mode: string;
    amount: number;
  }>;
  expenses: Array<{
    particulars: string;
    unit: number;
    amount: number;
  }>;
  mpesaTill: number;
  comments: string;
}

// Original transaction and expense interfaces
interface Transaction {
  id: string;
  date: string;
  type: "Income" | "Expense";
  category: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  reference: string;
  mpesaTransactionId?: string;
  status: "Pending" | "Completed" | "Cancelled" | "Approved";
  notes?: string;
}

interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  currency?: string;
  supplier?: string;
  receiptNumber: string;
  status: "Pending" | "Approved" | "Paid";
  paymentMethod?: string;
  vendor?: string;
  approvedBy?: string;
  module?: string;
  notes?: string;
}

// Service categories and types
const OFFERING_TYPES = [
  "Sunday Service Offering",
  "Wednesday Offering",
  "Tithe",
  "Thanksgiving",
  "Special Offering",
  "Building Fund",
  "Missions",
  "Others",
];

const EXPENSE_CATEGORIES = [
  "Utilities",
  "Office Supplies",
  "Maintenance",
  "Transportation",
  "Catering",
  "Equipment",
  "Ministry Expenses",
  "Pastor's Appreciation",
  "Others",
];

// Function to calculate balance sheet from actual system data
const calculateBalanceSheetFromData = (
  transactions: Transaction[],
  expenses: ExpenseRecord[],
  invoices: any[] = [],
  lpos: any[] = [],
): BalanceSheetItem[] => {
  // Calculate cash from transactions
  const totalIncome = transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate invoice revenue (processed invoices)
  const invoiceRevenue = invoices
    .filter((inv) => inv.status === "processed")
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Calculate accounts receivable (unpaid invoices)
  const accountsReceivable = invoices
    .filter((inv) => inv.status !== "processed" && inv.status !== "cancelled")
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Calculate LPO commitments (pending/approved/sent LPOs)
  const lpoCommitments = lpos
    .filter((lpo) => ["pending", "approved", "sent"].includes(lpo.status))
    .reduce((sum, lpo) => sum + (lpo.total || 0), 0);

  // Calculate fulfilled LPO expenses
  const lpoExpenses = lpos
    .filter((lpo) => lpo.status === "fulfilled")
    .reduce((sum, lpo) => sum + (lpo.total || 0), 0);

  const baseCash = 575000; // Starting cash position
  const totalCashFlow =
    totalIncome + invoiceRevenue - totalExpenses - lpoExpenses;
  const cashBalance = baseCash + totalCashFlow;

  // Dynamic balance sheet based on actual data
  return [
    // CURRENT ASSETS
    {
      account: "Cash in Hand",
      code: "1101",
      currentYear: Math.round(Math.max(0, cashBalance * 0.08)), // 8% of total cash
      previousYear: 38000,
      category: "assets",
      subCategory: "current",
    },
    {
      account: "Cash at Bank - Main Account",
      code: "1102",
      currentYear: Math.round(Math.max(0, cashBalance * 0.48)), // 48% of total cash
      previousYear: 220000,
      category: "assets",
      subCategory: "current",
    },
    {
      account: "Cash at Bank - Tithe Account",
      code: "1103",
      currentYear: Math.round(Math.max(0, cashBalance * 0.26)), // 26% of total cash
      previousYear: 125000,
      category: "assets",
      subCategory: "current",
    },
    {
      account: "Short-term Investments",
      code: "1104",
      currentYear: Math.round(Math.max(0, cashBalance * 0.17)), // 17% of total cash
      previousYear: 80000,
      category: "assets",
      subCategory: "current",
    },
    {
      account: "Accounts Receivable",
      code: "1110",
      currentYear: Math.round(accountsReceivable), // From unpaid invoices
      previousYear: 18000,
      category: "assets",
      subCategory: "current",
    },
    {
      account: "Prepaid Expenses",
      code: "1120",
      currentYear: 15000,
      previousYear: 12000,
      category: "assets",
      subCategory: "current",
    },

    // NON-CURRENT ASSETS
    {
      account: "Church Building",
      code: "1201",
      currentYear: 1500000,
      previousYear: 1500000,
      category: "assets",
      subCategory: "noncurrent",
    },
    {
      account: "Land",
      code: "1202",
      currentYear: 800000,
      previousYear: 800000,
      category: "assets",
      subCategory: "noncurrent",
    },
    {
      account: "Office Equipment",
      code: "1210",
      currentYear: 85000,
      previousYear: 95000,
      category: "assets",
      subCategory: "noncurrent",
    },
    {
      account: "Sound & Audio Equipment",
      code: "1211",
      currentYear: 120000,
      previousYear: 140000,
      category: "assets",
      subCategory: "noncurrent",
    },
    {
      account: "Vehicles",
      code: "1220",
      currentYear: 450000,
      previousYear: 500000,
      category: "assets",
      subCategory: "noncurrent",
    },
    {
      account: "Furniture & Fixtures",
      code: "1230",
      currentYear: 75000,
      previousYear: 85000,
      category: "assets",
      subCategory: "noncurrent",
    },
    {
      account: "Less: Accumulated Depreciation",
      code: "1250",
      currentYear: -180000,
      previousYear: -145000,
      category: "assets",
      subCategory: "noncurrent",
    },

    // CURRENT LIABILITIES
    {
      account: "Accounts Payable",
      code: "2101",
      currentYear: Math.round(Math.max(0, totalExpenses * 0.1)), // 10% of expenses as payables
      previousYear: 28000,
      category: "liabilities",
      subCategory: "current",
    },
    {
      account: "LPO Commitments",
      code: "2105",
      currentYear: Math.round(lpoCommitments), // From pending/approved/sent LPOs
      previousYear: 0,
      category: "liabilities",
      subCategory: "current",
    },
    // CURRENT LIABILITIES - Only those with real system data
    // Note: Church has minimal liability data - most are tracked elsewhere or don't exist

    // EQUITY (calculated to balance)
    {
      account: "Church Foundation Fund",
      code: "3101",
      currentYear: 1200000,
      previousYear: 1200000,
      category: "equity",
      subCategory: "capital",
    },
    {
      account: "Building Fund",
      code: "3102",
      currentYear: 300000,
      previousYear: 250000,
      category: "equity",
      subCategory: "restricted",
    },
    {
      account: "Mission Fund",
      code: "3103",
      currentYear: 180000,
      previousYear: 160000,
      category: "equity",
      subCategory: "restricted",
    },
    {
      account: "General Reserve",
      code: "3110",
      currentYear: 220000,
      previousYear: 180000,
      category: "equity",
      subCategory: "unrestricted",
    },
    {
      account: "Retained Surplus",
      code: "3120",
      currentYear: Math.round(totalIncome - totalExpenses + 1105500), // Dynamic retained earnings
      previousYear: 1098800,
      category: "equity",
      subCategory: "unrestricted",
    },
  ];
};

export default function FinanceAdvanced() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("transactions");
  const [ledgerEntries, setLedgerEntries] = useState<AccountEntry[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetItem[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLossItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [centralizedTransactions, setCentralizedTransactions] = useState<
    FinancialTransaction[]
  >([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [tsoamForms, setTsoamForms] = useState<TSOAMServiceForm[]>([]);
  const [offeringsData, setOfferingsData] = useState<OfferingData[]>([]);
  const [editableBalanceSheet, setEditableBalanceSheet] = useState<
    BalanceSheetItem[]
  >([]);
  const [isEditingBalanceSheet, setIsEditingBalanceSheet] = useState(false);
  const [balanceSheetEdits, setBalanceSheetEdits] = useState<{
    [key: string]: number;
  }>({});
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showTSOAMForm, setShowTSOAMForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // LPO states
  const [lpos, setLpos] = useState<LPO[]>([]);
  const [showNewLPO, setShowNewLPO] = useState(false);
  const [selectedLPO, setSelectedLPO] = useState<LPO | null>(null);
  const [isGeneratingLPO, setIsGeneratingLPO] = useState(false);
  const [currentLPOSaved, setCurrentLPOSaved] = useState(false);

  // Church settings (normally fetched from settings service)
  const [churchSettings] = useState({
    name: "THE SEED OF ABRAHAM MINISTRY (TSOAM)",
    address: "P.O. Box 12345, Nairobi, Kenya",
    phone: "+254 700 000 000",
    email: "info@tsoam.org",
    website: "www.tsoam.org",
    logo: "https://cdn.builder.io/api/v1/image/assets%2F0627183da1a04fa4b6c5a1ab36b4780e%2F24ea526264444b8ca043118a01335902?format=webp&width=800",
  });

  // Form states
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: "Income",
    category: "",
    description: "",
    amount: 0,
    currency: "KSH",
    paymentMethod: "Cash",
    reference: "",
    status: "Completed",
    notes: "",
  });

  const [newExpense, setNewExpense] = useState<Partial<ExpenseRecord>>({
    category: "",
    description: "",
    amount: 0,
    currency: "KSH",
    supplier: "",
    receiptNumber: "",
    status: "Pending",
    notes: "",
  });

  // Invoice form state management
  const [invoiceForm, setInvoiceForm] = useState({
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    clientPhone: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    invoiceNumber: `INV-${Date.now()}`,
    paymentTerms: "Net 30",
    notes: "",
    items: [
      {
        id: "1",
        description: "",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        vatApplicable: true,
      },
    ],
  });
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState<any>(null);

  // LPO form state
  const [lpoForm, setLpoForm] = useState({
    supplier: "",
    supplierEmail: "",
    supplierPhone: "",
    supplierAddress: "",
    lpoNumber: `LPO-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    paymentTerms: "Net 30",
    notes: "",
    approvedBy: "",
    items: [
      {
        id: 1,
        description: "",
        specification: "",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ],
  });

  // Print, save to system and close form
  const printSaveAndClose = async () => {
    try {
      // First print the invoice
      await printInvoice();

      // Then add to system
      const vatDetails = calculateVATDetails();
      const subtotal = vatDetails.vatExclusive;
      const taxAmount = vatDetails.vatAmount;
      const total = vatDetails.vatInclusive;

      const newInvoice = {
        id: Date.now().toString(),
        number: invoiceForm.invoiceNumber,
        client: invoiceForm.clientName,
        amount: total,
        date: invoiceForm.invoiceDate,
        dueDate: invoiceForm.dueDate,
        status: "sent" as const,
        items: invoiceForm.items,
        paymentTerms: invoiceForm.paymentTerms,
        subtotal: subtotal,
        tax: taxAmount,
        total: total,
        notes: invoiceForm.notes,
        clientEmail: invoiceForm.clientEmail,
        clientAddress: invoiceForm.clientAddress,
        invoiceNumber: invoiceForm.invoiceNumber,
      };

      setInvoices([...invoices, newInvoice]);

      // Close form and reset
      setShowNewInvoice(false);
      resetInvoiceForm();

      alert("Invoice printed and saved to system successfully!");
    } catch (error) {
      console.error("Error printing and saving invoice:", error);
      alert("Failed to print and save invoice. Please try again.");
    }
  };

  // Invoice helper functions
  const addInvoiceToSystem = async () => {
    try {
      const vatDetails = calculateVATDetails();
      const subtotal = vatDetails.vatExclusive;
      const taxAmount = vatDetails.vatAmount;
      const total = vatDetails.vatInclusive;

      const newInvoice = {
        id: Date.now().toString(),
        number: invoiceForm.invoiceNumber,
        client: invoiceForm.clientName,
        amount: total,
        date: invoiceForm.invoiceDate,
        dueDate: invoiceForm.dueDate,
        status: "sent" as const,
        items: invoiceForm.items,
        paymentTerms: invoiceForm.paymentTerms,
        subtotal: subtotal,
        tax: taxAmount,
        total: total,
        notes: invoiceForm.notes,
        clientEmail: invoiceForm.clientEmail,
        clientAddress: invoiceForm.clientAddress,
        invoiceNumber: invoiceForm.invoiceNumber,
      };

      setInvoices([...invoices, newInvoice]);
      setLastGeneratedInvoice(newInvoice);
      alert("Invoice added to system successfully!");
    } catch (error) {
      console.error("Error adding invoice to system:", error);
      alert("Failed to add invoice to system. Please try again.");
    }
  };

  const resetInvoiceForm = () => {
    setInvoiceForm({
      clientName: "",
      clientEmail: "",
      clientAddress: "",
      clientPhone: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      invoiceNumber: `INV-${Date.now()}`,
      paymentTerms: "Net 30",
      notes: "",
      items: [
        {
          id: "1",
          description: "",
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          vatApplicable: true,
        },
      ],
    });
    setInvoiceGenerated(false);
    setLastGeneratedInvoice(null);
  };

  // Invoice helper functions
  const addInvoiceItem = () => {
    const newItem = {
      id: String(invoiceForm.items.length + 1),
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      vatApplicable: true,
    };
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, newItem] as InvoiceItem[],
    });
  };

  const removeInvoiceItem = (id: string | number) => {
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.filter((item) => item.id !== id),
    });
  };

  const updateInvoiceItem = (
    id: string | number,
    field: string,
    value: any,
  ) => {
    const updatedItems = invoiceForm.items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Calculate amount when quantity or unitPrice changes
        if (field === "quantity" || field === "unitPrice") {
          updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    });
    setInvoiceForm({
      ...invoiceForm,
      items: updatedItems,
    });
  };

  const calculateInvoiceTotal = () => {
    return invoiceForm.items.reduce((total, item) => total + item.amount, 0);
  };

  const calculateVATDetails = () => {
    const vatExclusiveTotal = invoiceForm.items.reduce(
      (total, item) => total + item.amount,
      0,
    );
    const vatAmount = invoiceForm.items.reduce((total, item) => {
      if (item.vatApplicable) {
        return total + item.amount * 0.16; // 16% VAT
      }
      return total;
    }, 0);
    const vatInclusiveTotal = vatExclusiveTotal + vatAmount;

    return {
      vatExclusive: vatExclusiveTotal,
      vatAmount: vatAmount,
      vatInclusive: vatInclusiveTotal,
    };
  };

  // Calculate invoice status based on due date and payment terms
  const calculateInvoiceStatus = (invoice: any) => {
    if (invoice.status === "processed" || invoice.status === "paid") {
      return { status: "processed", label: "Processed", variant: "default" };
    }

    const today = new Date();
    const dueDate = new Date(invoice.dueDate);

    if (dueDate < today) {
      return { status: "overdue", label: "Overdue", variant: "destructive" };
    }

    return { status: "pending", label: "Pending", variant: "secondary" };
  };

  // Get days until/past due
  const getDaysFromDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else {
      return `${diffDays} days remaining`;
    }
  };

  // LPO helper functions
  const addLPOItem = () => {
    const newItem = {
      id: lpoForm.items.length + 1,
      description: "",
      specification: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setLpoForm({
      ...lpoForm,
      items: [...lpoForm.items, newItem],
    });
  };

  const removeLPOItem = (id: number) => {
    setLpoForm({
      ...lpoForm,
      items: lpoForm.items.filter((item) => item.id !== id),
    });
  };

  const updateLPOItem = (id: number, field: string, value: any) => {
    const updatedItems = lpoForm.items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    });
    setLpoForm({
      ...lpoForm,
      items: updatedItems,
    });
  };

  const calculateLPOTotal = () => {
    return lpoForm.items.reduce((total, item) => total + item.amount, 0);
  };

  // Update LPO status
  const updateLPOStatus = (lpoId: string, newStatus: string) => {
    setLpos(
      lpos.map((lpo) =>
        lpo.id === lpoId ? { ...lpo, status: newStatus as any } : lpo,
      ),
    );

    // If status is set to fulfilled, this means the LPO has been completed
    // This would typically happen when goods are received
    if (newStatus === "fulfilled") {
      console.log("📦 LPO marked as fulfilled (goods received):", lpoId);
    }

    alert(`LPO status updated to: ${newStatus}`);
  };

  // Get LPO status options
  const getLPOStatusOptions = (currentStatus: string) => {
    const allStatuses = [
      "pending",
      "approved",
      "sent",
      "fulfilled",
      "cancelled",
    ];
    return allStatuses.filter((status) => status !== currentStatus);
  };

  // Generate LPO PDF
  const generateLPOPDF = async () => {
    setIsGeneratingLPO(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      const pdf = new jsPDF();

      // Add church logo if available
      if (churchSettings.logo) {
        try {
          // Convert image to base64 for PDF
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = churchSettings.logo;
          });

          // Create canvas to convert image
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx!.drawImage(img, 0, 0);
          const imgData = canvas.toDataURL("image/png");

          // Add logo to PDF (top-left, small size)
          pdf.addImage(imgData, "PNG", 20, 10, 20, 20);
        } catch (error) {
          console.log("Could not load church logo for PDF");
        }
      }

      // Header using church settings from state (adjusted for logo)
      pdf.setFontSize(14);
      pdf.setTextColor(128, 0, 32);
      pdf.text(String(churchSettings.name || "TSOAM Church"), 50, 22);

      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(String(churchSettings.address || "N/A"), 50, 29);
      pdf.text(
        `Phone: ${String(churchSettings.phone || "N/A")} | Email: ${String(churchSettings.email || "N/A")}`,
        50,
        34,
      );
      pdf.text(`Website: ${String(churchSettings.website || "N/A")}`, 50, 39);

      // LPO title - positioned to not overlap
      pdf.setFontSize(18);
      pdf.setTextColor(128, 0, 32);
      pdf.text("LOCAL PURCHASE ORDER", 120, 22);

      // LPO details
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`LPO #: ${String(lpoForm.lpoNumber || "N/A")}`, 150, 35);
      pdf.text(
        `Date: ${new Date(lpoForm.date || Date.now()).toLocaleDateString()}`,
        150,
        42,
      );
      pdf.text(
        `Delivery Date: ${lpoForm.deliveryDate ? new Date(lpoForm.deliveryDate).toLocaleDateString() : "N/A"}`,
        150,
        49,
      );
      pdf.text(
        `Payment Terms: ${String(lpoForm.paymentTerms || "N/A")}`,
        150,
        56,
      );

      // Supplier information
      pdf.setFontSize(12);
      pdf.setTextColor(128, 0, 32);
      pdf.text("Supplier:", 20, 70);

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(String(lpoForm.supplier || "N/A"), 20, 80);
      if (lpoForm.supplierEmail)
        pdf.text(String(lpoForm.supplierEmail), 20, 88);
      if (lpoForm.supplierPhone)
        pdf.text(String(lpoForm.supplierPhone), 20, 96);
      if (lpoForm.supplierAddress) {
        const addressLines = String(lpoForm.supplierAddress).split("\n");
        addressLines.forEach((line, index) => {
          pdf.text(String(line || ""), 20, 104 + index * 6);
        });
      }

      // Items table
      const tableData = lpoForm.items.map((item) => [
        String(item.description || "N/A"),
        String(item.specification || "N/A"),
        String((item.quantity || 0).toString()),
        `KSH ${(item.unitPrice || 0).toLocaleString()}`,
        `KSH ${(item.amount || 0).toLocaleString()}`,
      ]);

      const autoTableModule = await import("jspdf-autotable");
      const autoTableFunction = autoTableModule.default;
      autoTableFunction(pdf, {
        startY: 115,
        head: [["Description", "Specification", "Qty", "Unit Price", "Amount"]],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [128, 0, 32], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 },
      });

      // Totals
      const subtotal = calculateLPOTotal();
      const finalY = (pdf as any).lastAutoTable
        ? (pdf as any).lastAutoTable.finalY + 20
        : 160;

      pdf.text("Subtotal:", 130, finalY);
      pdf.text(`KSH ${(subtotal || 0).toLocaleString()}`, 160, finalY);

      pdf.setFontSize(12);
      pdf.setFont(undefined, "bold");
      pdf.text("Total:", 130, finalY + 15);
      pdf.text(`KSH ${(subtotal || 0).toLocaleString()}`, 160, finalY + 15);

      // Notes and approval
      if (lpoForm.notes && String(lpoForm.notes).trim()) {
        pdf.setFontSize(10);
        pdf.setFont(undefined, "normal");
        pdf.text("Notes:", 20, finalY + 40);
        const splitNotes = pdf.splitTextToSize(String(lpoForm.notes), 170);
        pdf.text(splitNotes, 20, finalY + 50);
      }

      // Approval section
      pdf.setFontSize(10);
      pdf.text("Prepared by: TSOAM Procurement Department", 20, finalY + 70);
      if (lpoForm.approvedBy) {
        pdf.text(`Approved by: ${String(lpoForm.approvedBy)}`, 20, finalY + 80);
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        "This LPO was generated by TSOAM Church Management System",
        20,
        280,
      );

      // Save PDF
      const safeLpoNumber = String(lpoForm.lpoNumber || "Unknown").replace(
        /[^a-zA-Z0-9]/g,
        "_",
      );
      const safeDate = new Date().toISOString().split("T")[0];
      const filename = `TSOAM_LPO_${safeLpoNumber}_${safeDate}.pdf`;
      pdf.save(filename);

      alert("LPO generated successfully!");
    } catch (error) {
      console.error("Error generating LPO:", error);
      alert("Failed to generate LPO. Please try again.");
    } finally {
      setIsGeneratingLPO(false);
    }
  };

  // Transaction approval functions
  const approveTransaction = async (transactionId: string) => {
    setApprovalProcessing(transactionId);
    try {
      const approvedTransaction = pendingApprovals.find(
        (t) => t.id === transactionId,
      );

      if (!approvedTransaction) {
        alert("Transaction not found!");
        return;
      }

      // Check if transaction is already approved or processed
      if (
        approvedTransaction.status === "Approved" ||
        approvedTransaction.status === "Completed"
      ) {
        alert("This transaction has already been approved!");
        return;
      }

      // Call the financial service to approve transaction
      financialTransactionService.approveTransaction(
        transactionId,
        "Finance Manager",
      );

      // Update local state - remove from pending
      setPendingApprovals(
        pendingApprovals.filter((t) => t.id !== transactionId),
      );

      // Add approved transaction to main transactions list
      const updatedTransaction = {
        ...approvedTransaction,
        status: "Approved" as const,
        approvedBy: "Finance Manager",
        notes: `${approvedTransaction.notes} - Approved by Finance on ${new Date().toLocaleDateString()}`,
      };
      setTransactions([...transactions, updatedTransaction]);

      // Add to expenses if it's an expense transaction
      if (approvedTransaction.type === "Expense") {
        const expenseRecord = {
          id: Date.now().toString(),
          date: approvedTransaction.date,
          category: approvedTransaction.category,
          subcategory: approvedTransaction.subcategory || "General",
          description: approvedTransaction.description,
          amount: approvedTransaction.amount,
          currency: "KSh",
          paymentMethod: approvedTransaction.paymentMethod,
          receiptNumber: approvedTransaction.reference,
          status: "Approved" as const,
          vendor: approvedTransaction.module,
          approvedBy: "Finance Manager",
          module: approvedTransaction.module,
        };
        setExpenses([...expenses, expenseRecord]);
      }

      // If this is a welfare transaction, mark the welfare application as completed
      if (
        approvedTransaction.module === "Welfare" &&
        approvedTransaction.moduleReference
      ) {
        console.log("💰 Finance approving welfare transaction:", {
          transactionId: approvedTransaction.id,
          welfareApplicationId: approvedTransaction.moduleReference,
          amount: approvedTransaction.amount,
        });

        try {
          // Send completion event to welfare module via localStorage
          const completionData = {
            welfareApplicationId: approvedTransaction.moduleReference,
            disbursementDetails: {
              method: approvedTransaction.paymentMethod,
              amount: approvedTransaction.amount,
              approvedBy: "Finance Manager",
              disbursementDate: new Date().toISOString().split("T")[0],
            },
            timestamp: new Date().toISOString(),
          };

          localStorage.setItem(
            "welfare_completion_event",
            JSON.stringify(completionData),
          );
          console.log("✅ Welfare completion event sent via localStorage");

          // Also trigger a storage event for same-window communication
          window.dispatchEvent(
            new StorageEvent("storage", {
              key: "welfare_completion_event",
              newValue: JSON.stringify(completionData),
            }),
          );
        } catch (error) {
          console.error("❌ Could not send welfare completion event:", error);
        }
      }

      // If this is an LPO transaction, mark the LPO as approved and create expense
      if (
        approvedTransaction.module === "Finance" &&
        approvedTransaction.category === "Procurement" &&
        approvedTransaction.subcategory === "Local Purchase Order" &&
        approvedTransaction.moduleReference
      ) {
        console.log("📋 Finance approving LPO transaction:", {
          transactionId: approvedTransaction.id,
          lpoId: approvedTransaction.moduleReference,
          amount: approvedTransaction.amount,
        });

        // Create expense record (automatically deducts money from accounts)
        const expenseRecord = {
          id: Date.now().toString(),
          date: approvedTransaction.date,
          category: "Procurement",
          subcategory: "Local Purchase Order",
          description: approvedTransaction.description,
          amount: approvedTransaction.amount,
          currency: "KSh",
          paymentMethod: approvedTransaction.paymentMethod,
          receiptNumber: approvedTransaction.reference,
          status: "Approved" as const,
          vendor: "LPO Supplier",
          approvedBy: "Finance Manager",
          module: "Finance",
        };
        setExpenses([...expenses, expenseRecord]);

        // Also add to financial transaction service for dashboard integration
        financialTransactionService.addTransaction({
          date: new Date().toISOString().split("T")[0],
          type: "Expense",
          category: "Procurement",
          subcategory: "Local Purchase Order",
          description: `LPO Expense: ${approvedTransaction.description}`,
          amount: approvedTransaction.amount,
          currency: "KSh",
          paymentMethod: approvedTransaction.paymentMethod as any,
          reference: `EXP-${approvedTransaction.reference}`,
          module: "Finance",
          status: "Completed",
          createdBy: user?.name || "Finance Officer",
          requestedBy: user?.name || "Finance Officer",
          requiresApproval: false,
          notes: `Expense created from approved LPO transaction ID: ${approvedTransaction.id}. Supplier: LPO Supplier`,
        });

        console.log("💰 LPO expense created and money deducted:", {
          expenseId: expenseRecord.id,
          amount: expenseRecord.amount,
          lpoNumber: approvedTransaction.reference,
        });

        // Trigger dashboard refresh to show updated financial data
        try {
          localStorage.setItem(
            "dashboard_refresh",
            JSON.stringify({
              module: "Finance",
              action: "LPO_Expense_Created",
              amount: approvedTransaction.amount,
              timestamp: new Date().toISOString(),
            }),
          );

          window.dispatchEvent(
            new StorageEvent("storage", {
              key: "dashboard_refresh",
              newValue: JSON.stringify({
                module: "Finance",
                action: "LPO_Expense_Created",
                amount: approvedTransaction.amount,
                timestamp: new Date().toISOString(),
              }),
            }),
          );
        } catch (error) {
          console.error("❌ Could not trigger dashboard refresh:", error);
        }

        // Update the financial transaction status to completed since expense is created
        financialTransactionService.approveTransaction(
          approvedTransaction.id,
          "Finance Manager",
        );

        try {
          // Send approval event to update LPO status to "sent" (money committed)
          const approvalData = {
            lpoId: approvedTransaction.moduleReference,
            approvalDetails: {
              approvedBy: "Finance Manager",
              approvedDate: new Date().toISOString().split("T")[0],
              amount: approvedTransaction.amount,
              transactionId: approvedTransaction.id,
              expenseId: expenseRecord.id,
              status: "sent", // Money committed, LPO sent to supplier
            },
            timestamp: new Date().toISOString(),
          };

          localStorage.setItem(
            "lpo_approval_event",
            JSON.stringify(approvalData),
          );
          console.log("✅ LPO approval event sent via localStorage");

          // Also trigger a storage event for same-window communication
          window.dispatchEvent(
            new StorageEvent("storage", {
              key: "lpo_approval_event",
              newValue: JSON.stringify(approvalData),
            }),
          );
        } catch (error) {
          console.error("❌ Could not send LPO approval event:", error);
        }
      }

      // If this is an HR/payroll transaction, send disbursement report back to HR
      if (
        approvedTransaction.module === "HR" &&
        approvedTransaction.category === "Payroll"
      ) {
        console.log("💼 Finance approving HR payroll transaction:", {
          transactionId: approvedTransaction.id,
          amount: approvedTransaction.amount,
        });

        try {
          // Get actual payroll data from HR module
          const hrModuleData = JSON.parse(
            localStorage.getItem("hr_module_data") || "{}",
          );
          const payrollRecords = hrModuleData.payrollRecords || [];

          // Get the current month's payroll records
          const currentMonth = new Date().toISOString().slice(0, 7);
          const currentPayrollRecords = payrollRecords.filter(
            (record: any) => record.period === currentMonth,
          );

          // If no specific records found, create demo data based on transaction amount
          let employeeList = [];
          let totalEmployees = 5; // Default employee count
          let totalGrossAmount = 0;
          let totalDeductions = 0;
          let totalNetAmount = approvedTransaction.amount;

          if (currentPayrollRecords.length > 0) {
            // Use actual payroll data
            employeeList = currentPayrollRecords.map((record: any) => ({
              employeeId: record.employeeId,
              employeeName: record.employeeName,
              netSalary: record.netSalary,
              disbursementStatus: "Success" as const,
            }));
            totalEmployees = currentPayrollRecords.length;
            totalGrossAmount = currentPayrollRecords.reduce(
              (sum: number, record: any) => sum + record.grossSalary,
              0,
            );
            totalDeductions = currentPayrollRecords.reduce(
              (sum: number, record: any) => sum + record.totalDeductions,
              0,
            );
            totalNetAmount = currentPayrollRecords.reduce(
              (sum: number, record: any) => sum + record.netSalary,
              0,
            );
          } else {
            // Create demo employee list based on transaction amount
            const avgSalary = approvedTransaction.amount / totalEmployees;
            const demoEmployees = [
              "John Kamau",
              "Mary Wanjiku",
              "Peter Mwangi",
              "Grace Mutua",
              "Samuel Kiprotich",
            ];

            employeeList = demoEmployees.map((name, index) => ({
              employeeId: `EMP${String(index + 1).padStart(3, "0")}`,
              employeeName: name,
              netSalary: Math.round(avgSalary + (Math.random() * 5000 - 2500)), // Slight variation
              disbursementStatus: "Success" as const,
            }));

            totalGrossAmount = Math.round(totalNetAmount * 1.35);
            totalDeductions = totalGrossAmount - totalNetAmount;
          }

          // Create disbursement report data
          const disbursementData = {
            reportId: `DISB-${Date.now()}`,
            batchId:
              approvedTransaction.moduleReference ||
              approvedTransaction.reference,
            period: currentMonth,
            totalEmployees: totalEmployees,
            totalGrossAmount: totalGrossAmount,
            totalDeductions: totalDeductions,
            totalNetAmount: totalNetAmount,
            approvedBy: "Finance Manager",
            approvedDate: new Date().toISOString().split("T")[0],
            disbursementDate: new Date().toISOString().split("T")[0],
            disbursementMethod: approvedTransaction.paymentMethod,
            employees: employeeList,
            notes:
              approvedTransaction.notes ||
              `Payroll disbursement approved for ${totalEmployees} employees`,
          };

          localStorage.setItem(
            "hr_disbursement_event",
            JSON.stringify(disbursementData),
          );
          console.log("✅ HR disbursement report sent via localStorage");

          // Also trigger a storage event for same-window communication
          window.dispatchEvent(
            new StorageEvent("storage", {
              key: "hr_disbursement_event",
              newValue: JSON.stringify(disbursementData),
            }),
          );
        } catch (error) {
          console.error("❌ Could not send HR disbursement report:", error);
        }
      }

      // Update balance sheet with real-time data
      const updatedBalanceSheet = calculateBalanceSheetFromData(
        [...transactions, updatedTransaction],
        [...expenses],
        invoices,
        lpos,
      );
      setBalanceSheet(updatedBalanceSheet);
      setEditableBalanceSheet(updatedBalanceSheet);

      alert(
        `✅ Transaction Approved!\n\n` +
          `💰 Amount: KSh ${approvedTransaction.amount.toLocaleString()}\n` +
          `📊 Module: ${approvedTransaction.module}\n` +
          `🏦 This expense has been deducted from church funds\n` +
          `📋 Balance sheet and financial reports updated automatically` +
          (approvedTransaction.module === "Welfare"
            ? `\n\n����� Welfare application marked as completed and ready for disbursement`
            : "") +
          (approvedTransaction.module === "HR" &&
          approvedTransaction.category === "Payroll"
            ? `\n\n💼 Disbursement report sent to HR module`
            : ""),
      );
    } catch (error) {
      console.error("Error approving transaction:", error);
      alert("Failed to approve transaction. Please try again.");
    } finally {
      setApprovalProcessing(null);
    }
  };

  const rejectTransaction = async (
    transactionId: string,
    reason: string = "",
  ) => {
    setApprovalProcessing(transactionId);
    try {
      const rejectedTransaction = pendingApprovals.find(
        (t) => t.id === transactionId,
      );

      if (!rejectedTransaction) {
        alert("Transaction not found!");
        return;
      }

      // Call the financial service to reject transaction
      financialTransactionService.rejectTransaction(
        transactionId,
        "Finance Manager",
        reason,
      );

      // Send rejection notifications to respective modules
      if (
        rejectedTransaction.module === "Welfare" &&
        rejectedTransaction.moduleReference
      ) {
        try {
          const rejectionData = {
            welfareApplicationId: rejectedTransaction.moduleReference,
            rejectionReason: reason || "No reason provided",
            rejectedBy: "Finance Manager",
            rejectedDate: new Date().toISOString().split("T")[0],
            amount: rejectedTransaction.amount,
          };

          localStorage.setItem(
            "welfare_rejection_event",
            JSON.stringify(rejectionData),
          );
          window.dispatchEvent(
            new StorageEvent("storage", {
              key: "welfare_rejection_event",
              newValue: JSON.stringify(rejectionData),
            }),
          );

          console.log("✅ Welfare rejection notification sent");
        } catch (error) {
          console.error(
            "❌ Could not send welfare rejection notification:",
            error,
          );
        }
      }

      if (
        rejectedTransaction.module === "Finance" &&
        rejectedTransaction.category === "Procurement" &&
        rejectedTransaction.subcategory === "Local Purchase Order" &&
        rejectedTransaction.moduleReference
      ) {
        try {
          const rejectionData = {
            lpoId: rejectedTransaction.moduleReference,
            rejectionReason: reason || "No reason provided",
            rejectedBy: "Finance Manager",
            rejectedDate: new Date().toISOString().split("T")[0],
            amount: rejectedTransaction.amount,
            transactionId: rejectedTransaction.id,
          };

          localStorage.setItem(
            "lpo_rejection_event",
            JSON.stringify(rejectionData),
          );
          window.dispatchEvent(
            new StorageEvent("storage", {
              key: "lpo_rejection_event",
              newValue: JSON.stringify(rejectionData),
            }),
          );

          console.log("✅ LPO rejection notification sent");
        } catch (error) {
          console.error("❌ Could not send LPO rejection notification:", error);
        }
      }

      if (
        rejectedTransaction.module === "HR" &&
        rejectedTransaction.category === "Payroll"
      ) {
        try {
          const rejectionData = {
            batchId:
              rejectedTransaction.moduleReference ||
              rejectedTransaction.reference,
            period: new Date().toISOString().slice(0, 7),
            rejectionReason: reason || "No reason provided",
            rejectedBy: "Finance Manager",
            rejectedDate: new Date().toISOString().split("T")[0],
            amount: rejectedTransaction.amount,
            transactionId: rejectedTransaction.id,
          };

          localStorage.setItem(
            "hr_rejection_event",
            JSON.stringify(rejectionData),
          );
          window.dispatchEvent(
            new StorageEvent("storage", {
              key: "hr_rejection_event",
              newValue: JSON.stringify(rejectionData),
            }),
          );

          console.log("✅ HR payroll rejection notification sent");
        } catch (error) {
          console.error("❌ Could not send HR rejection notification:", error);
        }
      }

      // Update local state
      setPendingApprovals(
        pendingApprovals.filter((t) => t.id !== transactionId),
      );

      alert(
        `❌ Transaction Rejected!\n\n` +
          `💰 Amount: KSh ${rejectedTransaction.amount.toLocaleString()}\n` +
          `📊 Module: ${rejectedTransaction.module}\n` +
          `📋 The requesting module has been notified of rejection\n` +
          `🏦 No funds have been deducted from church accounts` +
          (reason ? `\n\n📝 Reason: ${reason}` : ""),
      );
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      alert("Failed to reject transaction. Please try again.");
    } finally {
      setApprovalProcessing(null);
    }
  };

  // Save LPO without printing
  const saveLPO = async () => {
    try {
      // Add to system
      const subtotal = calculateLPOTotal();
      const newLPO: LPO = {
        id: Date.now().toString(),
        lpoNumber: lpoForm.lpoNumber,
        date: lpoForm.date,
        supplier: lpoForm.supplier,
        supplierEmail: lpoForm.supplierEmail,
        supplierPhone: lpoForm.supplierPhone,
        supplierAddress: lpoForm.supplierAddress,
        items: lpoForm.items,
        subtotal: subtotal,
        tax: 0, // LPOs typically don't include tax
        total: subtotal,
        status: "pending",
        notes: lpoForm.notes,
        deliveryDate: lpoForm.deliveryDate,
        paymentTerms: lpoForm.paymentTerms,
        approvedBy: lpoForm.approvedBy,
        createdBy: "Church Administrator",
      };

      setLpos([...lpos, newLPO]);

      // Create finance transaction for approval
      const lpoTransaction = financialTransactionService.addTransaction({
        date: lpoForm.date,
        type: "Expense",
        category: "Procurement",
        subcategory: "Local Purchase Order",
        description: `LPO #${lpoForm.lpoNumber} - ${lpoForm.supplier}`,
        amount: subtotal,
        currency: "KSH",
        paymentMethod: "Bank Transfer",
        reference: lpoForm.lpoNumber,
        module: "Finance",
        moduleReference: newLPO.id,
        status: "Pending",
        createdBy: "Church Administrator",
        requestedBy: "Procurement Department",
        requiresApproval: true,
        notes: `LPO for ${lpoForm.supplier} - ${lpoForm.items.length} items`,
      });

      console.log("📋 LPO created and sent to Finance for approval:", {
        lpoId: newLPO.id,
        lpoNumber: newLPO.lpoNumber,
        amount: subtotal,
        transactionId: lpoTransaction.id,
        supplier: lpoForm.supplier,
      });

      closeLPODialog();
      alert("LPO saved successfully and sent to Finance for approval!");
    } catch (error) {
      console.error("Error saving LPO:", error);
      alert("Failed to save LPO. Please try again.");
    }
  };

  // Print saved LPO
  const printLPO = async () => {
    try {
      await generateLPOPDF();
      alert("LPO printed successfully!");
    } catch (error) {
      console.error("Error printing LPO:", error);
      alert("Failed to print LPO. Please try again.");
    }
  };

  // Close LPO dialog and reset
  const closeLPODialog = () => {
    // Reset form and states
    setLpoForm({
      supplier: "",
      supplierEmail: "",
      supplierPhone: "",
      supplierAddress: "",
      lpoNumber: `LPO-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      deliveryDate: "",
      paymentTerms: "Net 30",
      notes: "",
      approvedBy: "",
      items: [
        {
          id: 1,
          description: "",
          specification: "",
          quantity: 1,
          unitPrice: 0,
          amount: 0,
        },
      ],
    });
    setCurrentLPOSaved(false);
    setShowNewLPO(false);
  };

  // Process invoice payment
  const processInvoice = async (invoice: any) => {
    try {
      // Update invoice status
      const updatedInvoices = invoices.map((inv) =>
        inv.id === invoice.id
          ? {
              ...inv,
              status: "processed" as const,
              processedDate: new Date().toISOString(),
              transactionId: `TXN-${Date.now()}`,
            }
          : inv,
      );
      setInvoices(updatedInvoices);

      // Add transaction to finance records
      const newTransaction: Transaction = {
        id: `TXN-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        description: `Invoice Payment - ${invoice.client} (${invoice.invoiceNumber})`,
        amount: invoice.total,
        type: "Income",
        category: "Invoice Payment",
        currency: "KSh",
        paymentMethod: "Bank Transfer",
        reference: `INV-${invoice.invoiceNumber}`,
        status: "Completed",
        notes: `Payment for invoice ${invoice.invoiceNumber}`,
      };

      setTransactions([...transactions, newTransaction]);

      alert(`Invoice ${invoice.number} has been processed successfully!`);
    } catch (error) {
      console.error("Error processing invoice:", error);
      alert("Failed to process invoice. Please try again.");
    }
  };

  // Print invoice
  const printInvoice = async (invoice?: any) => {
    try {
      // Use current form data if no invoice provided
      const invoiceData = invoice || {
        invoiceNumber: invoiceForm.invoiceNumber,
        clientName: invoiceForm.clientName,
        clientEmail: invoiceForm.clientEmail,
        clientPhone: invoiceForm.clientPhone,
        clientAddress: invoiceForm.clientAddress,
        invoiceDate: invoiceForm.invoiceDate,
        dueDate: invoiceForm.dueDate,
        paymentTerms: invoiceForm.paymentTerms,
        notes: invoiceForm.notes,
        items: invoiceForm.items,
      };

      // Import jsPDF dynamically
      const { default: jsPDF } = await import("jspdf");
      // Import autoTable and ensure it's added to jsPDF
      await import("jspdf-autotable");

      const pdf = new jsPDF();

      // Church settings
      const churchSettings = {
        name: "THE SEED OF ABRAHAM MINISTRY (TSOAM)",
        address: "P.O. Box 12345, Nairobi, Kenya",
        phone: "+254 700 000 000",
        email: "info@tsoam.org",
        website: "www.tsoam.org",
      };

      // Header with church logo and details
      pdf.setFontSize(16);
      pdf.setTextColor(128, 0, 32); // Maroon color
      pdf.text(churchSettings.name, 20, 25);

      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(churchSettings.address, 20, 33);
      pdf.text(
        `Phone: ${churchSettings.phone} | Email: ${churchSettings.email}`,
        20,
        39,
      );
      pdf.text(`Website: ${churchSettings.website}`, 20, 45);

      // Invoice title - positioned to not overlap
      pdf.setFontSize(22);
      pdf.setTextColor(128, 0, 32);
      pdf.text("INVOICE", 150, 25);

      // Invoice details - adjusted positioning
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Invoice #: ${invoiceData.invoiceNumber || invoiceData.number}`,
        150,
        35,
      );
      pdf.text(
        `Date: ${new Date(invoiceData.invoiceDate || invoiceData.date).toLocaleDateString()}`,
        150,
        42,
      );
      pdf.text(
        `Due Date: ${invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : "N/A"}`,
        150,
        49,
      );
      pdf.text(`Terms: ${invoiceData.paymentTerms || "Net 30"}`, 150, 56);

      // Client information - adjusted positioning
      pdf.setFontSize(12);
      pdf.setTextColor(128, 0, 32);
      pdf.text("Bill To:", 20, 70);

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(invoiceData.clientName || invoiceData.client, 20, 80);
      if (invoiceData.clientEmail) pdf.text(invoiceData.clientEmail, 20, 88);
      if (invoiceData.clientPhone) pdf.text(invoiceData.clientPhone, 20, 96);
      if (invoiceData.clientAddress) {
        const addressLines = invoiceData.clientAddress.split("\n");
        addressLines.forEach((line, index) => {
          pdf.text(line, 20, 104 + index * 6);
        });
      }

      // Invoice items table
      const tableData = invoiceData.items.map((item: any) => [
        item.description,
        item.quantity.toString(),
        `KSH ${item.unitPrice.toLocaleString()}`,
        `KSH ${item.amount.toLocaleString()}`,
      ]);

      // Use autoTable function directly
      const autoTableModule = await import("jspdf-autotable");
      const autoTableFunction = autoTableModule.default;
      autoTableFunction(pdf, {
        startY: 115,
        head: [["Description", "Qty", "Unit Price", "Amount"]],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [128, 0, 32], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 },
      });

      // Calculate totals
      const subtotal = invoiceData.items.reduce(
        (total: number, item: any) => total + item.amount,
        0,
      );
      const taxRate = 0.16; // 16% VAT - Kenya Standard Rate 2024
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      const finalY = (pdf as any).lastAutoTable
        ? (pdf as any).lastAutoTable.finalY + 20
        : 160;

      // Totals section
      pdf.text("Subtotal:", 130, finalY);
      pdf.text(`KSH ${subtotal.toLocaleString()}`, 160, finalY);

      pdf.text("VAT (16% - Kenya):", 130, finalY + 10);
      pdf.text(`KSH ${taxAmount.toLocaleString()}`, 160, finalY + 10);

      pdf.setFontSize(12);
      pdf.setFont(undefined, "bold");
      pdf.text("Total:", 130, finalY + 25);
      pdf.text(`KSH ${total.toLocaleString()}`, 160, finalY + 25);

      // Notes section
      if (invoiceData.notes) {
        pdf.setFontSize(10);
        pdf.setFont(undefined, "normal");
        pdf.text("Notes:", 20, finalY + 50);
        pdf.text(invoiceData.notes, 20, finalY + 60);
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Thank you for your business!", 20, 270);
      pdf.text(
        "This invoice was generated by TSOAM Church Management System",
        20,
        280,
      );

      // Print the PDF
      pdf.autoPrint();
      window.open(pdf.output("bloburl"), "_blank");
    } catch (error) {
      console.error("Error printing invoice:", error);
      alert("Failed to print invoice. Please try again.");
    }
  };

  const generateInvoicePDF = async () => {
    setIsGeneratingInvoice(true);
    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import("jspdf");
      // Import autoTable and ensure it's added to jsPDF
      await import("jspdf-autotable");

      const pdf = new jsPDF();

      // Church settings (would normally come from settings service)
      const churchSettings = {
        name: "THE SEED OF ABRAHAM MINISTRY (TSOAM)",
        address: "P.O. Box 12345, Nairobi, Kenya",
        phone: "+254 700 000 000",
        email: "info@tsoam.org",
        website: "www.tsoam.org",
      };

      // Header with church logo and details
      pdf.setFontSize(16);
      pdf.setTextColor(128, 0, 32); // Maroon color
      pdf.text(churchSettings.name, 20, 25);

      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(churchSettings.address, 20, 33);
      pdf.text(
        `Phone: ${churchSettings.phone} | Email: ${churchSettings.email}`,
        20,
        39,
      );
      pdf.text(`Website: ${churchSettings.website}`, 20, 45);

      // Invoice title - positioned to not overlap
      pdf.setFontSize(22);
      pdf.setTextColor(128, 0, 32);
      pdf.text("INVOICE", 150, 25);

      // Invoice details - adjusted positioning
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Invoice #: ${String(invoiceForm.invoiceNumber || "N/A")}`,
        150,
        45,
      );
      pdf.text(
        `Date: ${new Date(invoiceForm.invoiceDate || Date.now()).toLocaleDateString()}`,
        150,
        53,
      );
      pdf.text(
        `Due Date: ${invoiceForm.dueDate ? new Date(invoiceForm.dueDate).toLocaleDateString() : "N/A"}`,
        150,
        61,
      );
      pdf.text(`Terms: ${String(invoiceForm.paymentTerms || "N/A")}`, 150, 69);

      // Client information
      pdf.setFontSize(12);
      pdf.setTextColor(128, 0, 32);
      pdf.text("Bill To:", 20, 85);

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(String(invoiceForm.clientName || "N/A"), 20, 95);
      if (invoiceForm.clientEmail)
        pdf.text(String(invoiceForm.clientEmail), 20, 103);
      if (invoiceForm.clientPhone)
        pdf.text(String(invoiceForm.clientPhone), 20, 111);
      if (invoiceForm.clientAddress) {
        const addressLines = String(invoiceForm.clientAddress).split("\n");
        addressLines.forEach((line, index) => {
          pdf.text(String(line || ""), 20, 119 + index * 8);
        });
      }

      // Invoice items table
      const tableData = invoiceForm.items.map((item) => [
        String(item.description || "N/A"),
        String((item.quantity || 0).toString()),
        `KSH ${(item.unitPrice || 0).toLocaleString()}`,
        `KSH ${(item.amount || 0).toLocaleString()}`,
      ]);

      // Use autoTable function directly
      const autoTableModule = await import("jspdf-autotable");
      const autoTableFunction = autoTableModule.default;
      autoTableFunction(pdf, {
        startY: 140,
        head: [["Description", "Qty", "Unit Price", "Amount"]],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [128, 0, 32], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 },
      });

      // Calculate totals
      const vatDetails = calculateVATDetails();
      const subtotal = vatDetails.vatExclusive;
      const taxAmount = vatDetails.vatAmount;
      const total = vatDetails.vatInclusive;

      const finalY = (pdf as any).lastAutoTable
        ? (pdf as any).lastAutoTable.finalY + 20
        : 160;

      // Totals section
      pdf.text("Subtotal:", 130, finalY);
      pdf.text(`KSH ${(subtotal || 0).toLocaleString()}`, 160, finalY);

      pdf.text("VAT (16% - Kenya):", 130, finalY + 10);
      pdf.text(`KSH ${(taxAmount || 0).toLocaleString()}`, 160, finalY + 10);

      pdf.setFontSize(12);
      pdf.setFont(undefined, "bold");
      pdf.text("Total:", 130, finalY + 25);
      pdf.text(`KSH ${(total || 0).toLocaleString()}`, 160, finalY + 25);

      // Notes section
      if (invoiceForm.notes && String(invoiceForm.notes).trim()) {
        pdf.setFontSize(10);
        pdf.setFont(undefined, "normal");
        pdf.text("Notes:", 20, finalY + 50);
        const splitNotes = pdf.splitTextToSize(String(invoiceForm.notes), 170);
        pdf.text(splitNotes, 20, finalY + 60);
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Thank you for your business!", 20, 270);
      pdf.text(
        "This invoice was generated by TSOAM Church Management System",
        20,
        280,
      );

      // Generate filename and save
      const safeInvoiceNumber = String(
        invoiceForm.invoiceNumber || "Unknown",
      ).replace(/[^a-zA-Z0-9]/g, "_");
      const safeDate = new Date().toISOString().split("T")[0];
      const filename = `TSOAM_Invoice_${safeInvoiceNumber}_${safeDate}.pdf`;
      pdf.save(filename);

      // Mark invoice as generated but don't close form yet
      setInvoiceGenerated(true);

      const generatedInvoice = {
        id: Date.now().toString(),
        number: invoiceForm.invoiceNumber,
        client: invoiceForm.clientName,
        amount: total,
        date: invoiceForm.invoiceDate,
        dueDate: invoiceForm.dueDate,
        status: "sent" as const,
        items: invoiceForm.items,
        paymentTerms: invoiceForm.paymentTerms,
        subtotal: subtotal,
        tax: taxAmount,
        total: total,
        notes: invoiceForm.notes,
        clientEmail: invoiceForm.clientEmail,
        clientAddress: invoiceForm.clientAddress,
        invoiceNumber: invoiceForm.invoiceNumber,
      };

      setLastGeneratedInvoice(generatedInvoice);
      alert(
        "Invoice PDF generated successfully! You can now add it to the system or print it.",
      );
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice. Please try again.");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const [newTSOAMForm, setNewTSOAMForm] = useState<Partial<TSOAMServiceForm>>({
    date: new Date().toISOString().split("T")[0],
    theme: "",
    serviceType: "Sunday Service",
    minister: "",
    sermonTitle: "",
    attendance: {
      men: 0,
      women: 0,
      children: 0,
      newComers: 0,
      newConverts: 0,
      cars: 0,
    },
    sundaySchool: {
      teacher: "",
      attendance: 0,
      offering: 0,
      topic: "",
    },
    offerings: {
      wOffering: 0,
      tithe: 0,
      thanksgiving: 0,
      sacrifice: 0,
      till: 0,
      sSchool: 0,
      targeted: 0,
      others: 0,
    },
    cheques: [],
    foreignCurrency: 0,
    otherAmounts: 0,
    officials: {
      residentPastor: { name: "", date: "", signed: false },
      churchAccountant: { name: "", date: "", signed: false },
    },
    titheRecords: [],
    expenses: [],
    mpesaTill: 0,
    comments: "",
  });

  // Monitor financial service for real-time updates
  useEffect(() => {
    const handleFinancialUpdate = (
      systemTransactions: FinancialTransaction[],
    ) => {
      // Update pending approvals from system transactions
      const pendingSystemTransactions = systemTransactions.filter(
        (t) => t.status === "Pending" && t.requiresApproval,
      );
      setPendingApprovals(pendingSystemTransactions);

      // Update balance sheet with all data including system transactions
      const updatedBalanceSheet = calculateBalanceSheetFromData(
        transactions,
        expenses,
        invoices,
        lpos,
      );
      setBalanceSheet(updatedBalanceSheet);
      setEditableBalanceSheet(updatedBalanceSheet);
    };

    // Subscribe to financial service updates
    financialTransactionService.subscribe(handleFinancialUpdate);

    // Initial load
    const systemTransactions = financialTransactionService.getTransactions();
    handleFinancialUpdate(systemTransactions);

    // Cleanup subscription
    return () => {
      financialTransactionService.unsubscribe(handleFinancialUpdate);
    };
  }, []);

  // Update balance sheet when invoices or LPOs change
  useEffect(() => {
    if (invoices.length > 0 || lpos.length > 0) {
      const updatedBalanceSheet = calculateBalanceSheetFromData(
        transactions,
        expenses,
        invoices,
        lpos,
      );
      setBalanceSheet(updatedBalanceSheet);
      setEditableBalanceSheet(updatedBalanceSheet);
    }
  }, [invoices, lpos, transactions, expenses]);

  // LPO approval/rejection event listeners
  useEffect(() => {
    const handleLPOApproval = (event: StorageEvent) => {
      if (event.key === "lpo_approval_event" && event.newValue) {
        try {
          const approvalData = JSON.parse(event.newValue);
          console.log("📋 Received LPO approval event:", approvalData);

          // Update LPO status (either approved or sent depending on finance action)
          const newStatus = approvalData.approvalDetails?.status || "approved";
          setLpos((prevLpos) =>
            prevLpos.map((lpo) =>
              lpo.id === approvalData.lpoId
                ? { ...lpo, status: newStatus }
                : lpo,
            ),
          );

          if (newStatus === "sent") {
            console.log(
              "✅ LPO approved and money deducted - status updated to sent",
            );
          } else {
            console.log("✅ LPO status updated to approved");
          }
        } catch (error) {
          console.error("❌ Error processing LPO approval:", error);
        }
      }
    };

    const handleLPORejection = (event: StorageEvent) => {
      if (event.key === "lpo_rejection_event" && event.newValue) {
        try {
          const rejectionData = JSON.parse(event.newValue);
          console.log("📋 Received LPO rejection event:", rejectionData);

          // Update LPO status to rejected
          setLpos((prevLpos) =>
            prevLpos.map((lpo) =>
              lpo.id === rejectionData.lpoId
                ? { ...lpo, status: "cancelled" }
                : lpo,
            ),
          );

          console.log("❌ LPO status updated to rejected");
        } catch (error) {
          console.error("❌ Error processing LPO rejection:", error);
        }
      }
    };

    // Add event listeners
    window.addEventListener("storage", handleLPOApproval);
    window.addEventListener("storage", handleLPORejection);

    // Also listen for manual storage events (same window)
    const handleManualLPOApproval = (event: CustomEvent) => {
      handleLPOApproval(event.detail);
    };

    const handleManualLPORejection = (event: CustomEvent) => {
      handleLPORejection(event.detail);
    };

    window.addEventListener(
      "lpo_approval_event",
      handleManualLPOApproval as EventListener,
    );
    window.addEventListener(
      "lpo_rejection_event",
      handleManualLPORejection as EventListener,
    );

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleLPOApproval);
      window.removeEventListener("storage", handleLPORejection);
      window.removeEventListener(
        "lpo_approval_event",
        handleManualLPOApproval as EventListener,
      );
      window.removeEventListener(
        "lpo_rejection_event",
        handleManualLPORejection as EventListener,
      );
    };
  }, []);

  // Mock data initialization
  useEffect(() => {
    initializeMockData();
  }, []);

  const initializeMockData = () => {
    // Sample transactions
    const sampleTransactions: Transaction[] = [
      {
        id: "TXN001",
        date: "2024-01-15",
        type: "Income",
        category: "Sunday Service Offering",
        description: "Sunday Service Collection",
        amount: 15000,
        currency: "KSH",
        paymentMethod: "Cash",
        reference: "SS001",
        status: "Completed",
        notes: "Regular Sunday service offering",
      },
      {
        id: "TXN002",
        date: "2024-01-14",
        type: "Income",
        category: "Tithe",
        description: "Monthly Tithe Collection",
        amount: 25000,
        currency: "KSH",
        paymentMethod: "Mixed",
        reference: "TT001",
        status: "Completed",
        notes: "January tithe collection",
      },
    ];

    // Sample expenses
    const sampleExpenses: ExpenseRecord[] = [
      {
        id: "EXP001",
        date: "2024-01-16",
        category: "Utilities",
        description: "Electricity bill payment",
        amount: 8500,
        currency: "KSH",
        supplier: "Kenya Power",
        receiptNumber: "KP001234",
        status: "Paid",
        notes: "Monthly electricity bill",
      },
    ];

    // Sample ledger entries
    const sampleEntries: AccountEntry[] = [
      {
        id: "1",
        date: "2024-01-15",
        account: "Cash and Bank",
        accountCode: "1001",
        description: "Sunday Service Offering",
        debit: 15000,
        credit: 0,
        balance: 15000,
        reference: "SS001",
        category: "assets",
        subCategory: "current",
      },
      {
        id: "2",
        date: "2024-01-16",
        account: "Utilities Expense",
        accountCode: "5001",
        description: "Electricity bill payment",
        debit: 8500,
        credit: 0,
        balance: 8500,
        reference: "EXP001",
        category: "expenses",
        subCategory: "operating",
      },
    ];

    // Comprehensive balance sheet
    const sampleBalanceSheet: BalanceSheetItem[] = [
      // CURRENT ASSETS
      {
        account: "Cash in Hand",
        code: "1101",
        currentYear: 45000,
        previousYear: 38000,
        category: "assets",
        subCategory: "current",
      },
      {
        account: "Cash at Bank - Main Account",
        code: "1102",
        currentYear: 280000,
        previousYear: 220000,
        category: "assets",
        subCategory: "current",
      },
      {
        account: "Cash at Bank - Tithe Account",
        code: "1103",
        currentYear: 150000,
        previousYear: 125000,
        category: "assets",
        subCategory: "current",
      },
      {
        account: "Short-term Investments",
        code: "1104",
        currentYear: 100000,
        previousYear: 80000,
        category: "assets",
        subCategory: "current",
      },
      {
        account: "Accounts Receivable",
        code: "1110",
        currentYear: 25000,
        previousYear: 18000,
        category: "assets",
        subCategory: "current",
      },
      {
        account: "Prepaid Expenses",
        code: "1120",
        currentYear: 15000,
        previousYear: 12000,
        category: "assets",
        subCategory: "current",
      },

      // NON-CURRENT ASSETS
      {
        account: "Church Building",
        code: "1201",
        currentYear: 1500000,
        previousYear: 1500000,
        category: "assets",
        subCategory: "noncurrent",
      },
      {
        account: "Land",
        code: "1202",
        currentYear: 800000,
        previousYear: 800000,
        category: "assets",
        subCategory: "noncurrent",
      },
      {
        account: "Office Equipment",
        code: "1210",
        currentYear: 85000,
        previousYear: 95000,
        category: "assets",
        subCategory: "noncurrent",
      },
      {
        account: "Sound & Audio Equipment",
        code: "1211",
        currentYear: 120000,
        previousYear: 140000,
        category: "assets",
        subCategory: "noncurrent",
      },
      {
        account: "Vehicles",
        code: "1220",
        currentYear: 450000,
        previousYear: 500000,
        category: "assets",
        subCategory: "noncurrent",
      },
      {
        account: "Furniture & Fixtures",
        code: "1230",
        currentYear: 75000,
        previousYear: 85000,
        category: "assets",
        subCategory: "noncurrent",
      },
      {
        account: "Less: Accumulated Depreciation",
        code: "1250",
        currentYear: -180000,
        previousYear: -145000,
        category: "assets",
        subCategory: "noncurrent",
      },

      // CURRENT LIABILITIES
      {
        account: "Accounts Payable",
        code: "2101",
        currentYear: 35000,
        previousYear: 28000,
        category: "liabilities",
        subCategory: "current",
      },
      {
        account: "Accrued Salaries",
        code: "2102",
        currentYear: 18000,
        previousYear: 16000,
        category: "liabilities",
        subCategory: "current",
      },
      {
        account: "Utilities Payable",
        code: "2103",
        currentYear: 8500,
        previousYear: 7200,
        category: "liabilities",
        subCategory: "current",
      },
      {
        account: "Short-term Loans",
        code: "2110",
        currentYear: 25000,
        previousYear: 40000,
        category: "liabilities",
        subCategory: "current",
      },

      // NON-CURRENT LIABILITIES
      {
        account: "Church Building Mortgage",
        code: "2201",
        currentYear: 450000,
        previousYear: 485000,
        category: "liabilities",
        subCategory: "noncurrent",
      },
      {
        account: "Equipment Loan",
        code: "2210",
        currentYear: 65000,
        previousYear: 85000,
        category: "liabilities",
        subCategory: "noncurrent",
      },

      // EQUITY
      {
        account: "Church Foundation Fund",
        code: "3101",
        currentYear: 1200000,
        previousYear: 1200000,
        category: "equity",
        subCategory: "capital",
      },
      {
        account: "Building Fund",
        code: "3102",
        currentYear: 300000,
        previousYear: 250000,
        category: "equity",
        subCategory: "restricted",
      },
      {
        account: "Mission Fund",
        code: "3103",
        currentYear: 180000,
        previousYear: 160000,
        category: "equity",
        subCategory: "restricted",
      },
      {
        account: "General Reserve",
        code: "3110",
        currentYear: 220000,
        previousYear: 180000,
        category: "equity",
        subCategory: "unrestricted",
      },
      {
        account: "Retained Surplus",
        code: "3120",
        currentYear: 1205500,
        previousYear: 1098800,
        category: "equity",
        subCategory: "unrestricted",
      },
    ];

    // Sample P&L
    const sampleProfitLoss: ProfitLossItem[] = [
      {
        account: "Tithes and Offerings",
        code: "4100",
        currentPeriod: 180000,
        previousPeriod: 165000,
        budget: 200000,
        variance: -20000,
        category: "income",
        subCategory: "regular",
      },
      {
        account: "Salaries and Wages",
        code: "5110",
        currentPeriod: 96000,
        previousPeriod: 90000,
        budget: 100000,
        variance: 4000,
        category: "expense",
        subCategory: "personnel",
      },
    ];

    setTransactions(sampleTransactions);
    setExpenses(sampleExpenses);
    setLedgerEntries(sampleEntries);

    // Calculate dynamic balance sheet from system data
    const dynamicBalanceSheet = calculateBalanceSheetFromData(
      sampleTransactions,
      sampleExpenses,
      invoices,
      lpos,
    );
    setBalanceSheet(dynamicBalanceSheet);
    setEditableBalanceSheet(dynamicBalanceSheet);
    setProfitLoss(sampleProfitLoss);

    // Initialize centralized transactions
    setCentralizedTransactions(financialTransactionService.getTransactions());
    setOfferingsData(financialTransactionService.getOfferings());
  };

  // Pending approval transactions state
  const [pendingApprovals, setPendingApprovals] = useState<
    FinancialTransaction[]
  >([]);
  const [approvalProcessing, setApprovalProcessing] = useState<string | null>(
    null,
  );

  // Subscribe to centralized transaction updates
  useEffect(() => {
    const handleTransactionUpdate = (transactions: FinancialTransaction[]) => {
      // Filter pending approval transactions
      const pendingTransactions = transactions.filter(
        (t) => t.status === "Pending" && t.requiresApproval,
      );
      setPendingApprovals(pendingTransactions);
      setCentralizedTransactions(transactions);
    };

    financialTransactionService.subscribe(handleTransactionUpdate);

    // Initialize data
    initializeMockData();

    return () => {
      financialTransactionService.unsubscribe(handleTransactionUpdate);
    };
  }, []);

  // Handler functions
  const handleAddTransaction = () => {
    if (
      !newTransaction.category ||
      !newTransaction.amount ||
      !newTransaction.description
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Add to centralized service
    const centralizedTransaction = financialTransactionService.addTransaction({
      date: new Date().toISOString().split("T")[0],
      type: newTransaction.type as "Income" | "Expense",
      category: newTransaction.category,
      description: newTransaction.description,
      amount: newTransaction.amount || 0,
      currency: "KSh",
      paymentMethod: newTransaction.paymentMethod as any,
      reference: newTransaction.reference || "",
      mpesaTransactionId: newTransaction.mpesaTransactionId,
      module: "Finance",
      status: newTransaction.status as any,
      createdBy: user?.name || "Finance Officer",
      requestedBy: user?.name || "Finance Officer",
      requiresApproval: (newTransaction.amount || 0) > 1000,
      notes: newTransaction.notes,
    });

    // Also add to local transactions for backward compatibility
    const transaction: Transaction = {
      ...newTransaction,
      id: `TXN${String(transactions.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
    } as Transaction;

    setTransactions([transaction, ...transactions]);

    // Reset form
    setNewTransaction({
      type: "Income",
      category: "",
      description: "",
      amount: 0,
      currency: "KSH",
      paymentMethod: "Cash",
      reference: "",
      status: "Completed",
      notes: "",
    });
    setShowNewTransaction(false);
    alert("Transaction added successfully and synchronized across modules!");
  };

  const handleAddExpense = () => {
    if (!newExpense.category || !newExpense.amount || !newExpense.supplier) {
      alert("Please fill in all required fields");
      return;
    }

    const expense: ExpenseRecord = {
      ...newExpense,
      id: `EXP${String(expenses.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
    } as ExpenseRecord;

    setExpenses([expense, ...expenses]);

    // Reset form
    setNewExpense({
      category: "",
      description: "",
      amount: 0,
      currency: "KSH",
      supplier: "",
      receiptNumber: "",
      status: "Pending",
      notes: "",
    });
    setShowNewExpense(false);
    alert("Expense added successfully!");
  };

  // Auto-fetch offering data from centralized service
  const autoFetchOfferingData = () => {
    const latestOffering = financialTransactionService.getLatestOffering();
    if (latestOffering) {
      setNewTSOAMForm({
        ...newTSOAMForm,
        offerings: {
          wOffering: latestOffering.offerings.specialOffering,
          tithe: latestOffering.offerings.tithe,
          thanksgiving: latestOffering.offerings.thanksgiving,
          sacrifice: latestOffering.offerings.buildingFund,
          till: latestOffering.offerings.missions,
          sSchool: latestOffering.offerings.youth,
          targeted: latestOffering.offerings.welfare,
          others: latestOffering.offerings.others,
        },
        minister: latestOffering.minister,
      });
      alert("Offering data auto-fetched from latest service record!");
    } else {
      alert("No previous offering data found to fetch");
    }
  };

  const handleSubmitTSOAMForm = () => {
    if (
      !newTSOAMForm.theme ||
      !newTSOAMForm.minister ||
      !newTSOAMForm.sermonTitle
    ) {
      alert("Please fill in the required fields");
      return;
    }

    const form: TSOAMServiceForm = {
      ...newTSOAMForm,
      id: `SSF${String(tsoamForms.length + 1).padStart(3, "0")}`,
    } as TSOAMServiceForm;

    // Add offering data to centralized service
    if (newTSOAMForm.offerings) {
      financialTransactionService.addOffering({
        date: newTSOAMForm.date || new Date().toISOString().split("T")[0],
        serviceType: newTSOAMForm.serviceType || "Sunday Service",
        minister: newTSOAMForm.minister || "",
        offerings: {
          tithe: newTSOAMForm.offerings.tithe || 0,
          specialOffering: newTSOAMForm.offerings.wOffering || 0,
          thanksgiving: newTSOAMForm.offerings.thanksgiving || 0,
          buildingFund: newTSOAMForm.offerings.sacrifice || 0,
          missions: newTSOAMForm.offerings.till || 0,
          welfare: newTSOAMForm.offerings.sSchool || 0,
          youth: newTSOAMForm.offerings.targeted || 0,
          others: newTSOAMForm.offerings.others || 0,
        },
        collectedBy: user?.name || "Service Leader",
        countedBy: [user?.name || "Service Leader"],
      });
    }

    setTsoamForms([form, ...tsoamForms]);
    setShowTSOAMForm(false);
    alert("Service Summary Form submitted and offering data synchronized!");
  };

  const generateTSOAMFormPDF = async (form: TSOAMServiceForm) => {
    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import("jspdf");
      // Import autoTable and ensure it's added to jsPDF
      await import("jspdf-autotable");

      const doc = new jsPDF();

      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("SERVICE SUMMARY FORM (SSF)", 105, 20, { align: "center" });
      doc.text("TSOAM", 105, 30, { align: "center" });

      // Theme and Service Info
      let yPos = 50;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      doc.text(`THEME: ${form.theme}`, 20, yPos);
      doc.text("ATTENDANCE - SUMMARY", 120, yPos);
      yPos += 10;

      doc.text(`DATE: ${form.date}`, 20, yPos);
      doc.text(`MEN: ${form.attendance.men}`, 120, yPos);
      doc.text(`NEW COMERS: ${form.attendance.newComers}`, 160, yPos);
      yPos += 8;

      doc.text(`SERVICE TYPE: ${form.serviceType}`, 20, yPos);
      doc.text(`WOMEN: ${form.attendance.women}`, 120, yPos);
      doc.text(`NEW CONVERTS: ${form.attendance.newConverts}`, 160, yPos);
      yPos += 8;

      doc.text(`MINISTER: ${form.minister}`, 20, yPos);
      doc.text(`CHILDREN: ${form.attendance.children}`, 120, yPos);
      yPos += 8;

      doc.text(`SERMON TITLE: ${form.sermonTitle}`, 20, yPos);
      doc.text(
        `TOTALS: ${form.attendance.men + form.attendance.women + form.attendance.children}`,
        120,
        yPos,
      );
      yPos += 8;

      doc.text(`CARS: ${form.attendance.cars}`, 120, yPos);
      yPos += 15;

      // Sunday School Section
      doc.setFont("helvetica", "bold");
      doc.text("SUNDAY SCHOOL", 20, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");

      doc.text(`Teacher: ${form.sundaySchool.teacher}`, 20, yPos);
      yPos += 6;
      doc.text(`Attendance: ${form.sundaySchool.attendance}`, 20, yPos);
      doc.text(
        `Offering: KSh ${form.sundaySchool.offering.toLocaleString()}`,
        80,
        yPos,
      );
      doc.text(`Topic: ${form.sundaySchool.topic}`, 140, yPos);
      yPos += 15;

      // Offering Section
      doc.setFont("helvetica", "bold");
      doc.text("OFFERING", 20, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");

      const offerings = [
        [
          `W.OFFERING: KSh ${form.offerings.wOffering.toLocaleString()}`,
          `TITHE: KSh ${form.offerings.tithe.toLocaleString()}`,
        ],
        [
          `THANKSGIVING: KSh ${form.offerings.thanksgiving.toLocaleString()}`,
          `SACRIFICE: KSh ${form.offerings.sacrifice.toLocaleString()}`,
        ],
        [
          `TILL: KSh ${form.offerings.till.toLocaleString()}`,
          `S.SCHOOL: KSh ${form.offerings.sSchool.toLocaleString()}`,
        ],
        [
          `TARGETED: KSh ${form.offerings.targeted.toLocaleString()}`,
          `OTHERS: KSh ${form.offerings.others.toLocaleString()}`,
        ],
      ];

      offerings.forEach(([left, right]) => {
        doc.text(left, 20, yPos);
        doc.text(right, 110, yPos);
        yPos += 6;
      });

      yPos += 10;

      // Totals
      const totalCash = Object.values(form.offerings).reduce(
        (sum, val) => sum + val,
        0,
      );
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL SUMMARY AMOUNT`, 20, yPos);
      yPos += 8;
      doc.text(`Cash (a-h): KSh ${totalCash.toLocaleString()}`, 20, yPos);
      doc.text("CHEQUES", 110, yPos);
      yPos += 8;

      // Cheques
      if (form.cheques && form.cheques.length > 0) {
        form.cheques.forEach((cheque, index) => {
          doc.setFont("helvetica", "normal");
          doc.text(`CHQ. No: ${cheque.number}`, 20, yPos);
          doc.text(`Amount: KSh ${cheque.amount.toLocaleString()}`, 80, yPos);
          doc.text(`Details: ${cheque.details}`, 140, yPos);
          yPos += 6;
        });
      }

      yPos += 10;

      // Other amounts
      doc.text(
        `Foreign Currency: KSh ${form.foreignCurrency.toLocaleString()}`,
        20,
        yPos,
      );
      yPos += 6;
      doc.text(
        `Other Amounts: KSh ${form.otherAmounts.toLocaleString()}`,
        20,
        yPos,
      );
      yPos += 8;

      const grandTotal =
        totalCash +
        (form.cheques?.reduce((sum, chq) => sum + chq.amount, 0) || 0) +
        form.foreignCurrency +
        form.otherAmounts;
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL: KSh ${grandTotal.toLocaleString()}`, 20, yPos);
      yPos += 15;

      // Officials Section
      doc.text("OFFICIALS", 20, yPos);
      yPos += 10;
      doc.setFont("helvetica", "normal");

      doc.text("RESIDENT PASTOR", 20, yPos);
      doc.text("Church Accountant", 120, yPos);
      yPos += 8;

      doc.text(`NAME: ${form.officials.residentPastor.name}`, 20, yPos);
      doc.text(`NAME: ${form.officials.churchAccountant.name}`, 120, yPos);
      yPos += 6;

      doc.text(`DATE: ${form.officials.residentPastor.date}`, 20, yPos);
      doc.text(`DATE: ${form.officials.churchAccountant.date}`, 120, yPos);
      yPos += 6;

      doc.text("SIGN: _______________", 20, yPos);
      doc.text("SIGN: _______________", 120, yPos);
      yPos += 8;

      doc.text("STAMP", 20, yPos);

      // Save PDF
      doc.save(`TSOAM_Service_Summary_${form.id}_${form.date}.pdf`);
    } catch (error) {
      console.error("Error generating TSOAM form PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const printTSOAMForm = (form: TSOAMServiceForm) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Service Summary Form - ${form.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .church-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .form-title { font-size: 18px; margin-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-item { margin-bottom: 8px; }
            .label { font-weight: bold; }
            .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .table th, .table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .table th { background-color: #f5f5f5; }
            .total { font-weight: bold; background-color: #f9f9f9; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="church-name">THE SEED OF ABRAHAM MINISTRY</div>
            <div class="form-title">SERVICE SUMMARY FORM (SSF)</div>
          </div>

          <div class="section">
            <div class="section-title">Service Information</div>
            <div class="info-grid">
              <div class="info-item"><span class="label">Form ID:</span> ${form.id}</div>
              <div class="info-item"><span class="label">Date:</span> ${form.date}</div>
              <div class="info-item"><span class="label">Service Type:</span> ${form.serviceType}</div>
              <div class="info-item"><span class="label">Minister:</span> ${form.minister}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Attendance</div>
            <table class="table">
              <tr><th>Category</th><th>Count</th></tr>
              <tr><td>Men</td><td>${form.attendance.men}</td></tr>
              <tr><td>Women</td><td>${form.attendance.women}</td></tr>
              <tr><td>Children</td><td>${form.attendance.children}</td></tr>
              <tr class="total"><td>Total</td><td>${form.attendance.men + form.attendance.women + form.attendance.children}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Offerings</div>
            <table class="table">
              <tr><th>Type</th><th>Amount (KSh)</th></tr>
              ${Object.entries(form.offerings)
                .map(
                  ([type, amount]) =>
                    `<tr><td>${type}</td><td>${amount.toLocaleString()}</td></tr>`,
                )
                .join("")}
              <tr class="total"><td>Total</td><td>${Object.values(
                form.offerings,
              )
                .reduce((sum, val) => sum + val, 0)
                .toLocaleString()}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Expenses</div>
            <table class="table">
              <tr><th>Description</th><th>Amount (KSh)</th></tr>
              ${form.expenses
                .map(
                  (expense) =>
                    `<tr><td>${expense.particulars}</td><td>${expense.amount.toLocaleString()}</td></tr>`,
                )
                .join("")}
              <tr class="total"><td>Total Expenses</td><td>${form.expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Comments</div>
            <p>${form.comments || "No comments"}</p>
          </div>

          <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
            Generated on ${new Date().toLocaleDateString()} | TSOAM Church Management System
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Export functions for advanced reports
  const exportBalanceSheet = (format: "excel" | "pdf") => {
    if (format === "excel") {
      const ws = XLSX.utils.json_to_sheet(balanceSheet);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Balance Sheet");
      XLSX.writeFile(
        wb,
        `TSOAM_Balance_Sheet_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } else {
      generateBalanceSheetPDF();
    }
  };

  const exportProfitLoss = (format: "excel" | "pdf") => {
    if (format === "excel") {
      const ws = XLSX.utils.json_to_sheet(profitLoss);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Profit & Loss");
      XLSX.writeFile(
        wb,
        `TSOAM_Profit_Loss_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } else {
      generateProfitLossPDF();
    }
  };

  const exportLedger = (format: "excel" | "pdf") => {
    const filteredEntries = ledgerEntries;

    if (format === "excel") {
      const ws = XLSX.utils.json_to_sheet(filteredEntries);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "General Ledger");
      XLSX.writeFile(
        wb,
        `TSOAM_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } else {
      generateLedgerPDF(filteredEntries);
    }
  };

  const generateBalanceSheetPDF = async () => {
    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import("jspdf");
      // Import autoTable and ensure it's added to jsPDF
      await import("jspdf-autotable");

      const doc = new jsPDF();

      // Add church logo and header
      doc.setFontSize(20);
      doc.text("THE SEED OF ABRAHAM MINISTRY", 105, 20, { align: "center" });
      doc.setFontSize(16);
      doc.text("BALANCE SHEET", 105, 30, { align: "center" });
      doc.setFontSize(12);
      doc.text(`As of ${new Date().toLocaleDateString()}`, 105, 40, {
        align: "center",
      });

      // Assets section
      let yPos = 60;
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("ASSETS", 20, yPos);
      yPos += 10;

      const assetItems = balanceSheet.filter(
        (item) => item.category === "assets",
      );
      assetItems.forEach((item) => {
        doc.setFont(undefined, "normal");
        doc.text(item.account, 25, yPos);
        doc.text(item.currentYear.toLocaleString(), 150, yPos, {
          align: "right",
        });
        yPos += 8;
      });

      const totalAssets = assetItems.reduce(
        (sum, item) => sum + item.currentYear,
        0,
      );
      doc.setFont(undefined, "bold");
      doc.text("Total Assets", 25, yPos);
      doc.text(totalAssets.toLocaleString(), 150, yPos, { align: "right" });
      yPos += 20;

      // Liabilities section
      doc.text("LIABILITIES", 20, yPos);
      yPos += 10;

      const liabilityItems = balanceSheet.filter(
        (item) => item.category === "liabilities",
      );
      liabilityItems.forEach((item) => {
        doc.setFont(undefined, "normal");
        doc.text(item.account, 25, yPos);
        doc.text(item.currentYear.toLocaleString(), 150, yPos, {
          align: "right",
        });
        yPos += 8;
      });

      const totalLiabilities = liabilityItems.reduce(
        (sum, item) => sum + item.currentYear,
        0,
      );
      doc.setFont(undefined, "bold");
      doc.text("Total Liabilities", 25, yPos);
      doc.text(totalLiabilities.toLocaleString(), 150, yPos, {
        align: "right",
      });
      yPos += 20;

      // Equity section
      doc.text("EQUITY", 20, yPos);
      yPos += 10;

      const equityItems = balanceSheet.filter(
        (item) => item.category === "equity",
      );
      equityItems.forEach((item) => {
        doc.setFont(undefined, "normal");
        doc.text(item.account, 25, yPos);
        doc.text(item.currentYear.toLocaleString(), 150, yPos, {
          align: "right",
        });
        yPos += 8;
      });

      const totalEquity = equityItems.reduce(
        (sum, item) => sum + item.currentYear,
        0,
      );
      doc.setFont(undefined, "bold");
      doc.text("Total Equity", 25, yPos);
      doc.text(totalEquity.toLocaleString(), 150, yPos, { align: "right" });

      doc.save(
        `TSOAM_Balance_Sheet_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("Error generating balance sheet PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const generateProfitLossPDF = async () => {
    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import("jspdf");
      // Import autoTable and ensure it's added to jsPDF
      await import("jspdf-autotable");

      const doc = new jsPDF();

      // Add church header
      doc.setFontSize(20);
      doc.text("THE SEED OF ABRAHAM MINISTRY", 105, 20, { align: "center" });
      doc.setFontSize(16);
      doc.text("PROFIT & LOSS STATEMENT", 105, 30, { align: "center" });
      doc.setFontSize(12);
      doc.text(
        `For the period ending ${new Date().toLocaleDateString()}`,
        105,
        40,
        { align: "center" },
      );

      let yPos = 60;

      // Income section
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("INCOME", 20, yPos);
      yPos += 10;

      const incomeItems = profitLoss.filter(
        (item) => item.category === "income",
      );
      incomeItems.forEach((item) => {
        doc.setFont(undefined, "normal");
        doc.text(item.account, 25, yPos);
        doc.text(item.currentPeriod.toLocaleString(), 150, yPos, {
          align: "right",
        });
        yPos += 8;
      });

      const totalIncome = incomeItems.reduce(
        (sum, item) => sum + item.currentPeriod,
        0,
      );
      doc.setFont(undefined, "bold");
      doc.text("Total Income", 25, yPos);
      doc.text(totalIncome.toLocaleString(), 150, yPos, { align: "right" });
      yPos += 20;

      // Expenses section
      doc.text("EXPENSES", 20, yPos);
      yPos += 10;

      const expenseItems = profitLoss.filter(
        (item) => item.category === "expense",
      );
      expenseItems.forEach((item) => {
        doc.setFont(undefined, "normal");
        doc.text(item.account, 25, yPos);
        doc.text(item.currentPeriod.toLocaleString(), 150, yPos, {
          align: "right",
        });
        yPos += 8;
      });

      const totalExpenses = expenseItems.reduce(
        (sum, item) => sum + item.currentPeriod,
        0,
      );
      doc.setFont(undefined, "bold");
      doc.text("Total Expenses", 25, yPos);
      doc.text(totalExpenses.toLocaleString(), 150, yPos, { align: "right" });
      yPos += 15;

      // Net income
      const netIncome = totalIncome - totalExpenses;
      doc.setFontSize(16);
      doc.text("NET INCOME", 25, yPos);
      doc.text(netIncome.toLocaleString(), 150, yPos, { align: "right" });

      doc.save(
        `TSOAM_Profit_Loss_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("Error generating profit loss PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // Balance Sheet Editing Functions
  const handleEditBalanceSheet = () => {
    setIsEditingBalanceSheet(true);
    setBalanceSheetEdits({});
  };

  const handleSaveBalanceSheetEdits = () => {
    const updatedBalanceSheet = editableBalanceSheet.map((item) => {
      if (balanceSheetEdits[item.code] !== undefined) {
        return {
          ...item,
          currentYear: balanceSheetEdits[item.code],
        };
      }
      return item;
    });

    setBalanceSheet(updatedBalanceSheet);
    setEditableBalanceSheet(updatedBalanceSheet);
    setIsEditingBalanceSheet(false);
    setBalanceSheetEdits({});

    // Show success message
    alert("Balance sheet updated successfully!");
  };

  const handleCancelEdit = () => {
    setIsEditingBalanceSheet(false);
    setBalanceSheetEdits({});
  };

  const handleAmountChange = (code: string, value: number) => {
    setBalanceSheetEdits((prev) => ({
      ...prev,
      [code]: value,
    }));
  };

  const refreshBalanceSheetFromData = () => {
    const updatedBalanceSheet = calculateBalanceSheetFromData(
      transactions,
      expenses,
      invoices,
      lpos,
    );
    setBalanceSheet(updatedBalanceSheet);
    setEditableBalanceSheet(updatedBalanceSheet);
    alert("Balance sheet refreshed from system data!");
  };

  // Enhanced PDF export with better formatting
  const exportBalanceSheetPDF = async () => {
    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import("jspdf");
      // Import autoTable and ensure it's added to jsPDF
      await import("jspdf-autotable");

      const doc = new jsPDF();

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("THE SEED OF ABRAHAM MINISTRY", 105, 20, { align: "center" });

      doc.setFontSize(16);
      doc.text("BALANCE SHEET", 105, 30, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`As of ${new Date().toLocaleDateString()}`, 105, 40, {
        align: "center",
      });

      let yPos = 60;

      // Helper function to format currency
      const formatCurrency = (amount: number) => {
        return amount >= 0
          ? amount.toLocaleString()
          : `(${Math.abs(amount).toLocaleString()})`;
      };

      // ASSETS Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("ASSETS", 20, yPos);
      yPos += 10;

      // Current Assets
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Current Assets:", 25, yPos);
      yPos += 8;

      const currentAssets = editableBalanceSheet.filter(
        (item) => item.category === "assets" && item.subCategory === "current",
      );

      doc.setFont("helvetica", "normal");
      currentAssets.forEach((item) => {
        doc.text(item.account, 30, yPos);
        doc.text(formatCurrency(item.currentYear), 160, yPos, {
          align: "right",
        });
        yPos += 6;
      });

      const totalCurrentAssets = currentAssets.reduce(
        (sum, item) => sum + item.currentYear,
        0,
      );
      doc.setFont("helvetica", "bold");
      doc.text("Total Current Assets", 30, yPos);
      doc.text(formatCurrency(totalCurrentAssets), 160, yPos, {
        align: "right",
      });
      yPos += 10;

      // Non-Current Assets
      doc.text("Non-Current Assets:", 25, yPos);
      yPos += 8;

      const nonCurrentAssets = editableBalanceSheet.filter(
        (item) =>
          item.category === "assets" && item.subCategory === "noncurrent",
      );

      doc.setFont("helvetica", "normal");
      nonCurrentAssets.forEach((item) => {
        doc.text(item.account, 30, yPos);
        doc.text(formatCurrency(item.currentYear), 160, yPos, {
          align: "right",
        });
        yPos += 6;
      });

      const totalNonCurrentAssets = nonCurrentAssets.reduce(
        (sum, item) => sum + item.currentYear,
        0,
      );
      doc.setFont("helvetica", "bold");
      doc.text("Total Non-Current Assets", 30, yPos);
      doc.text(formatCurrency(totalNonCurrentAssets), 160, yPos, {
        align: "right",
      });
      yPos += 8;

      const totalAssets = totalCurrentAssets + totalNonCurrentAssets;
      doc.setFontSize(14);
      doc.text("TOTAL ASSETS", 25, yPos);
      doc.text(formatCurrency(totalAssets), 160, yPos, { align: "right" });
      yPos += 20;

      // LIABILITIES Section
      doc.text("LIABILITIES", 20, yPos);
      yPos += 10;

      // Current Liabilities
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Current Liabilities:", 25, yPos);
      yPos += 8;

      const currentLiabilities = editableBalanceSheet.filter(
        (item) =>
          item.category === "liabilities" && item.subCategory === "current",
      );

      doc.setFont("helvetica", "normal");
      currentLiabilities.forEach((item) => {
        doc.text(item.account, 30, yPos);
        doc.text(formatCurrency(item.currentYear), 160, yPos, {
          align: "right",
        });
        yPos += 6;
      });

      const totalCurrentLiabilities = currentLiabilities.reduce(
        (sum, item) => sum + item.currentYear,
        0,
      );
      doc.setFont("helvetica", "bold");
      doc.text("Total Current Liabilities", 30, yPos);
      doc.text(formatCurrency(totalCurrentLiabilities), 160, yPos, {
        align: "right",
      });
      yPos += 10;

      // Non-Current Liabilities
      doc.text("Non-Current Liabilities:", 25, yPos);
      yPos += 8;

      const nonCurrentLiabilities = editableBalanceSheet.filter(
        (item) =>
          item.category === "liabilities" && item.subCategory === "noncurrent",
      );

      doc.setFont("helvetica", "normal");
      nonCurrentLiabilities.forEach((item) => {
        doc.text(item.account, 30, yPos);
        doc.text(formatCurrency(item.currentYear), 160, yPos, {
          align: "right",
        });
        yPos += 6;
      });

      const totalNonCurrentLiabilities = nonCurrentLiabilities.reduce(
        (sum, item) => sum + item.currentYear,
        0,
      );
      doc.setFont("helvetica", "bold");
      doc.text("Total Non-Current Liabilities", 30, yPos);
      doc.text(formatCurrency(totalNonCurrentLiabilities), 160, yPos, {
        align: "right",
      });
      yPos += 8;

      const totalLiabilities =
        totalCurrentLiabilities + totalNonCurrentLiabilities;
      doc.setFontSize(14);
      doc.text("TOTAL LIABILITIES", 25, yPos);
      doc.text(formatCurrency(totalLiabilities), 160, yPos, { align: "right" });
      yPos += 15;

      // EQUITY Section
      doc.text("EQUITY", 20, yPos);
      yPos += 10;

      const equityItems = editableBalanceSheet.filter(
        (item) => item.category === "equity",
      );

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      equityItems.forEach((item) => {
        doc.text(item.account, 30, yPos);
        doc.text(formatCurrency(item.currentYear), 160, yPos, {
          align: "right",
        });
        yPos += 6;
      });

      const totalEquity = equityItems.reduce(
        (sum, item) => sum + item.currentYear,
        0,
      );
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL EQUITY", 25, yPos);
      doc.text(formatCurrency(totalEquity), 160, yPos, { align: "right" });
      yPos += 10;

      const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
      doc.text("TOTAL LIABILITIES & EQUITY", 25, yPos);
      doc.text(formatCurrency(totalLiabilitiesAndEquity), 160, yPos, {
        align: "right",
      });

      // Balance Check
      yPos += 15;
      const isBalanced = totalAssets === totalLiabilitiesAndEquity;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Balance Check: ${isBalanced ? "BALANCED ✓" : "NOT BALANCED ⚠"}`,
        20,
        yPos,
      );
      doc.text(
        `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        20,
        yPos + 10,
      );

      doc.save(
        `TSOAM_Balance_Sheet_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("Error generating balance sheet PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const generateLedgerPDF = async (entries: AccountEntry[]) => {
    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import("jspdf");
      // Import autoTable and ensure it's added to jsPDF
      await import("jspdf-autotable");

      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("THE SEED OF ABRAHAM MINISTRY", 105, 20, { align: "center" });
      doc.setFontSize(16);
      doc.text("GENERAL LEDGER", 105, 30, { align: "center" });

      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 40, {
        align: "center",
      });

      // Create table data
      const tableData = entries.map((entry) => [
        entry.date,
        entry.description,
        entry.reference,
        entry.debit > 0 ? entry.debit.toLocaleString() : "",
        entry.credit > 0 ? entry.credit.toLocaleString() : "",
        entry.balance.toLocaleString(),
      ]);

      // Add table
      const autoTable = await import("jspdf-autotable");
      (doc as any).autoTable({
        head: [
          ["Date", "Description", "Reference", "Debit", "Credit", "Balance"],
        ],
        body: tableData,
        startY: 50,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save(`TSOAM_Ledger_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating ledger PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // Generate PDF for existing invoices
  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import("jspdf");
      // Import autoTable and ensure it's added to jsPDF
      await import("jspdf-autotable");

      const pdf = new jsPDF();

      // Church settings
      const churchSettings = {
        name: "THE SEED OF ABRAHAM MINISTRY (TSOAM)",
        address: "P.O. Box 12345, Nairobi, Kenya",
        phone: "+254 700 000 000",
        email: "info@tsoam.org",
        website: "www.tsoam.org",
      };

      // Header with church details
      pdf.setFontSize(20);
      pdf.setTextColor(128, 0, 32); // Maroon color
      pdf.text(churchSettings.name, 20, 30);

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(churchSettings.address, 20, 40);
      pdf.text(
        `Phone: ${churchSettings.phone} | Email: ${churchSettings.email}`,
        20,
        48,
      );

      // Invoice title
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      pdf.text("INVOICE", 150, 30);

      // Invoice details
      pdf.setFontSize(10);
      pdf.text(`Invoice #: ${String(invoice.invoiceNumber || "N/A")}`, 150, 45);
      pdf.text(
        `Date: ${new Date(invoice.date || Date.now()).toLocaleDateString()}`,
        150,
        53,
      );
      pdf.text(`Status: ${String(invoice.status || "N/A")}`, 150, 61);

      // Client information
      pdf.setFontSize(12);
      pdf.setTextColor(128, 0, 32);
      pdf.text("Bill To:", 20, 85);

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(String(invoice.client || "N/A"), 20, 95);

      // Generate filename and save
      const safeInvoiceNumber = String(
        invoice.invoiceNumber || "Unknown",
      ).replace(/[^a-zA-Z0-9]/g, "_");
      const safeDate = new Date().toISOString().split("T")[0];
      const filename = `TSOAM_Invoice_${safeInvoiceNumber}_${safeDate}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      alert("Failed to generate invoice PDF. Please try again.");
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Church Finance Management"
        description="Complete financial management with TSOAM Service Summary Forms"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setShowNewTransaction(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
            <Button onClick={() => setShowNewExpense(true)} variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
            <Button onClick={() => setShowTSOAMForm(true)} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              TSOAM Form
            </Button>
            <Button onClick={() => setShowNewInvoice(true)} variant="outline">
              <Receipt className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Income
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSh{" "}
                {transactions
                  .filter((t) => t.type === "Income")
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {transactions.filter((t) => t.type === "Income").length}{" "}
                transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSh{" "}
                {expenses
                  .reduce((sum, exp) => sum + exp.amount, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {expenses.length} expense records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSh{" "}
                {(
                  transactions
                    .filter((t) => t.type === "Income")
                    .reduce((sum, t) => sum + t.amount, 0) -
                  expenses.reduce((sum, exp) => sum + exp.amount, 0)
                ).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Current balance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Service Summary Form (SSF)
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tsoamForms.length}</div>
              <p className="text-xs text-muted-foreground">
                Service summary forms
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals
              {pendingApprovals.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs">
                  {pendingApprovals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ledger">General Ledger</TabsTrigger>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="profit-loss">P&L Statement</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="lpo">LPO</TabsTrigger>
            <TabsTrigger value="tsoam-forms">
              Service Summary Form (SSF)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {(() => {
                      // Get all system transactions from financial service
                      const systemTransactions =
                        financialTransactionService.getTransactions();

                      // Combine with local transactions and invoices/LPOs
                      const allFinancialActivities = [
                        ...systemTransactions.map((t) => ({
                          id: t.id,
                          description: t.description,
                          category: `${t.category} (${t.module})`,
                          date: t.date,
                          amount: t.amount,
                          type: t.type,
                          status: t.status,
                        })),
                        ...invoices.map((inv) => ({
                          id: inv.id,
                          description: `Invoice #${inv.id} - ${inv.client}`,
                          category: "Invoice (Finance)",
                          date: inv.date,
                          amount: inv.total,
                          type: "Income" as const,
                          status: inv.status || "pending",
                        })),
                        ...lpos.map((lpo) => ({
                          id: lpo.id,
                          description: `LPO #${lpo.id} - ${lpo.supplier}`,
                          category: "Purchase Order (Finance)",
                          date: lpo.date,
                          amount: lpo.total,
                          type: "Expense" as const,
                          status: lpo.status || "pending",
                        })),
                      ];

                      // Sort by date (most recent first) and take top 10
                      return allFinancialActivities
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime(),
                        )
                        .slice(0, 10)
                        .map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <div>
                              <p className="font-medium">
                                {activity.description}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {activity.category} • {activity.date}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-bold ${
                                  activity.type === "Income"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {activity.type === "Income" ? "+" : "-"}KSh{" "}
                                {activity.amount.toLocaleString()}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {activity.status}
                              </Badge>
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {expenses.slice(0, 10).map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.category} • {expense.supplier}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">
                            -KSh {expense.amount.toLocaleString()}
                          </p>
                          <Badge
                            variant={
                              expense.status === "Paid"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {expense.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "#800020" }}>
                  Transaction Approvals
                </h2>
                <p className="text-muted-foreground">
                  Review and approve transactions from HR, Inventory, and
                  Welfare modules
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="px-3 py-1">
                  {pendingApprovals.length} Pending
                </Badge>
                <Badge variant="secondary" className="px-3 py-1">
                  Total: KSh{" "}
                  {pendingApprovals
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString()}
                </Badge>
              </div>
            </div>

            {/* Approval Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Pending Approvals
                      </p>
                      <p className="text-lg font-semibold">
                        {pendingApprovals.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        HR Payroll
                      </p>
                      <p className="text-lg font-semibold">
                        {
                          pendingApprovals.filter((t) => t.module === "HR")
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Inventory</p>
                      <p className="text-lg font-semibold">
                        {
                          pendingApprovals.filter(
                            (t) => t.module === "Inventory",
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Welfare</p>
                      <p className="text-lg font-semibold">
                        {
                          pendingApprovals.filter((t) => t.module === "Welfare")
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No pending approvals</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Requested By</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingApprovals.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {transaction.module}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell>{transaction.requestedBy}</TableCell>
                          <TableCell className="text-right font-semibold">
                            KSh {transaction.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  approveTransaction(transaction.id)
                                }
                                disabled={approvalProcessing === transaction.id}
                                className="text-white hover:opacity-90"
                                style={{ backgroundColor: "#008000" }}
                              >
                                {approvalProcessing === transaction.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  rejectTransaction(transaction.id)
                                }
                                disabled={approvalProcessing === transaction.id}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ledger" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Ledger</CardTitle>
                <div className="flex gap-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => exportLedger("excel")}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button
                      onClick={() => exportLedger("pdf")}
                      variant="outline"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.account}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>{entry.reference}</TableCell>
                        <TableCell className="text-right">
                          {entry.debit > 0
                            ? `KSh ${entry.debit.toLocaleString()}`
                            : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.credit > 0
                            ? `KSh ${entry.credit.toLocaleString()}`
                            : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          KSh {entry.balance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance-sheet" className="space-y-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 border-b">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800">
                    THE SEED OF ABRAHAM MINISTRY
                  </h2>
                  <h3 className="text-xl font-semibold text-blue-700 mt-2">
                    BALANCE SHEET
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    As at {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={refreshBalanceSheetFromData}
                      variant="outline"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh from Data
                    </Button>
                    {!isEditingBalanceSheet ? (
                      <Button
                        onClick={handleEditBalanceSheet}
                        variant="outline"
                        className="bg-yellow-600 text-white hover:bg-yellow-700"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Balance Sheet
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveBalanceSheetEdits}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline">
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => exportBalanceSheet("excel")}
                      variant="outline"
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button
                      onClick={exportBalanceSheetPDF}
                      variant="outline"
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Print PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* LEFT SIDE - ASSETS */}
                  <div className="border-r border-gray-200">
                    <div className="bg-blue-600 text-white p-4">
                      <h3 className="text-lg font-bold text-center">ASSETS</h3>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Current Assets */}
                      <div>
                        <h4 className="font-bold text-blue-700 text-sm uppercase tracking-wide mb-3 border-b pb-1">
                          CURRENT ASSETS
                        </h4>
                        <div className="space-y-2">
                          {editableBalanceSheet
                            .filter(
                              (item) =>
                                item.category === "assets" &&
                                item.subCategory === "current",
                            )
                            .map((item) => (
                              <div
                                key={item.code}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-gray-700 flex-1">
                                  {item.account}
                                </span>
                                {isEditingBalanceSheet ? (
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                                      KSh
                                    </span>
                                    <Input
                                      type="number"
                                      value={
                                        balanceSheetEdits[item.code] !==
                                        undefined
                                          ? balanceSheetEdits[item.code]
                                          : item.currentYear
                                      }
                                      onChange={(e) =>
                                        handleAmountChange(
                                          item.code,
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      onFocus={(e) => {
                                        if (
                                          e.target.value === "0" ||
                                          e.target.value === "0.00"
                                        ) {
                                          e.target.select();
                                        }
                                      }}
                                      className="w-32 text-xs pl-10 pr-2 py-1 h-7 text-right"
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>
                                ) : (
                                  <span className="font-medium text-right">
                                    {item.currentYear >= 0 ? "KSh " : "(KSh "}
                                    {Math.abs(
                                      item.currentYear,
                                    ).toLocaleString()}
                                    {item.currentYear < 0 ? ")" : ""}
                                  </span>
                                )}
                              </div>
                            ))}
                          <div className="border-t border-blue-200 pt-2 mt-3">
                            <div className="flex justify-between font-semibold text-blue-700">
                              <span>Total Current Assets</span>
                              <span>
                                KSh{" "}
                                {editableBalanceSheet
                                  .filter(
                                    (item) =>
                                      item.category === "assets" &&
                                      item.subCategory === "current",
                                  )
                                  .reduce((sum, item) => {
                                    const amount =
                                      balanceSheetEdits[item.code] !== undefined
                                        ? balanceSheetEdits[item.code]
                                        : item.currentYear;
                                    return sum + amount;
                                  }, 0)
                                  .toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Non-Current Assets */}
                      <div>
                        <h4 className="font-bold text-blue-700 text-sm uppercase tracking-wide mb-3 border-b pb-1">
                          NON-CURRENT ASSETS
                        </h4>
                        <div className="space-y-2">
                          {balanceSheet
                            .filter(
                              (item) =>
                                item.category === "assets" &&
                                item.subCategory === "noncurrent",
                            )
                            .map((item) => (
                              <div
                                key={item.code}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-700">
                                  {item.account}
                                </span>
                                <span className="font-medium text-right">
                                  {item.currentYear >= 0 ? "KSh " : "(KSh "}
                                  {Math.abs(item.currentYear).toLocaleString()}
                                  {item.currentYear < 0 ? ")" : ""}
                                </span>
                              </div>
                            ))}
                          <div className="border-t border-blue-200 pt-2 mt-3">
                            <div className="flex justify-between font-semibold text-blue-700">
                              <span>Total Non-Current Assets</span>
                              <span>
                                KSh{" "}
                                {balanceSheet
                                  .filter(
                                    (item) =>
                                      item.category === "assets" &&
                                      item.subCategory === "noncurrent",
                                  )
                                  .reduce(
                                    (sum, item) => sum + item.currentYear,
                                    0,
                                  )
                                  .toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total Assets */}
                      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                        <div className="flex justify-between font-bold text-lg text-blue-800">
                          <span>TOTAL ASSETS</span>
                          <span>
                            KSh{" "}
                            {balanceSheet
                              .filter((item) => item.category === "assets")
                              .reduce((sum, item) => sum + item.currentYear, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SIDE - LIABILITIES & EQUITY */}
                  <div>
                    <div className="bg-red-600 text-white p-4">
                      <h3 className="text-lg font-bold text-center">
                        LIABILITIES & EQUITY
                      </h3>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Current Liabilities */}
                      <div>
                        <h4 className="font-bold text-red-700 text-sm uppercase tracking-wide mb-3 border-b pb-1">
                          CURRENT LIABILITIES
                        </h4>
                        <div className="space-y-2">
                          {balanceSheet
                            .filter(
                              (item) =>
                                item.category === "liabilities" &&
                                item.subCategory === "current",
                            )
                            .map((item) => (
                              <div
                                key={item.code}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-700">
                                  {item.account}
                                </span>
                                <span className="font-medium">
                                  KSh {item.currentYear.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          <div className="border-t border-red-200 pt-2 mt-3">
                            <div className="flex justify-between font-semibold text-red-700">
                              <span>Total Current Liabilities</span>
                              <span>
                                KSh{" "}
                                {balanceSheet
                                  .filter(
                                    (item) =>
                                      item.category === "liabilities" &&
                                      item.subCategory === "current",
                                  )
                                  .reduce(
                                    (sum, item) => sum + item.currentYear,
                                    0,
                                  )
                                  .toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Non-Current Liabilities */}
                      <div>
                        <h4 className="font-bold text-red-700 text-sm uppercase tracking-wide mb-3 border-b pb-1">
                          NON-CURRENT LIABILITIES
                        </h4>
                        <div className="space-y-2">
                          {balanceSheet
                            .filter(
                              (item) =>
                                item.category === "liabilities" &&
                                item.subCategory === "noncurrent",
                            )
                            .map((item) => (
                              <div
                                key={item.code}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-700">
                                  {item.account}
                                </span>
                                <span className="font-medium">
                                  KSh {item.currentYear.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          <div className="border-t border-red-200 pt-2 mt-3">
                            <div className="flex justify-between font-semibold text-red-700">
                              <span>Total Non-Current Liabilities</span>
                              <span>
                                KSh{" "}
                                {balanceSheet
                                  .filter(
                                    (item) =>
                                      item.category === "liabilities" &&
                                      item.subCategory === "noncurrent",
                                  )
                                  .reduce(
                                    (sum, item) => sum + item.currentYear,
                                    0,
                                  )
                                  .toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total Liabilities */}
                      <div className="bg-red-50 p-3 rounded border border-red-200">
                        <div className="flex justify-between font-semibold text-red-800">
                          <span>TOTAL LIABILITIES</span>
                          <span>
                            KSh{" "}
                            {balanceSheet
                              .filter((item) => item.category === "liabilities")
                              .reduce((sum, item) => sum + item.currentYear, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Equity */}
                      <div>
                        <h4 className="font-bold text-green-700 text-sm uppercase tracking-wide mb-3 border-b pb-1">
                          CHURCH EQUITY
                        </h4>
                        <div className="space-y-2">
                          {balanceSheet
                            .filter((item) => item.category === "equity")
                            .map((item) => (
                              <div
                                key={item.code}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-700">
                                  {item.account}
                                </span>
                                <span className="font-medium">
                                  KSh {item.currentYear.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          <div className="border-t border-green-200 pt-2 mt-3">
                            <div className="flex justify-between font-semibold text-green-700">
                              <span>Total Equity</span>
                              <span>
                                KSh{" "}
                                {balanceSheet
                                  .filter((item) => item.category === "equity")
                                  .reduce(
                                    (sum, item) => sum + item.currentYear,
                                    0,
                                  )
                                  .toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Total Liabilities & Equity */}
                        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 mt-4">
                          <div className="flex justify-between font-bold text-lg text-green-800">
                            <span>TOTAL LIABILITIES & EQUITY</span>
                            <span>
                              KSh{" "}
                              {(
                                balanceSheet
                                  .filter(
                                    (item) => item.category === "liabilities",
                                  )
                                  .reduce(
                                    (sum, item) => sum + item.currentYear,
                                    0,
                                  ) +
                                balanceSheet
                                  .filter((item) => item.category === "equity")
                                  .reduce(
                                    (sum, item) => sum + item.currentYear,
                                    0,
                                  )
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Verification */}
                <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Balance Sheet Verification
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-blue-100 rounded">
                        <div className="font-bold text-blue-800">
                          Total Assets
                        </div>
                        <div className="text-lg text-blue-600">
                          KSh{" "}
                          {balanceSheet
                            .filter((item) => item.category === "assets")
                            .reduce((sum, item) => sum + item.currentYear, 0)
                            .toLocaleString()}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-red-100 rounded">
                        <div className="font-bold text-red-800">
                          Total Liabilities
                        </div>
                        <div className="text-lg text-red-600">
                          KSh{" "}
                          {balanceSheet
                            .filter((item) => item.category === "liabilities")
                            .reduce((sum, item) => sum + item.currentYear, 0)
                            .toLocaleString()}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-green-100 rounded">
                        <div className="font-bold text-green-800">
                          Total Equity
                        </div>
                        <div className="text-lg text-green-600">
                          KSh{" "}
                          {balanceSheet
                            .filter((item) => item.category === "equity")
                            .reduce((sum, item) => sum + item.currentYear, 0)
                            .toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div
                      className="mt-4 p-3 rounded"
                      style={{
                        backgroundColor:
                          balanceSheet
                            .filter((item) => item.category === "assets")
                            .reduce(
                              (sum, item) => sum + item.currentYear,
                              0,
                            ) ===
                          balanceSheet
                            .filter((item) => item.category === "liabilities")
                            .reduce((sum, item) => sum + item.currentYear, 0) +
                            balanceSheet
                              .filter((item) => item.category === "equity")
                              .reduce((sum, item) => sum + item.currentYear, 0)
                            ? "#dcfce7"
                            : "#fef2f2",
                      }}
                    >
                      <div
                        className={`font-bold ${
                          balanceSheet
                            .filter((item) => item.category === "assets")
                            .reduce(
                              (sum, item) => sum + item.currentYear,
                              0,
                            ) ===
                          balanceSheet
                            .filter((item) => item.category === "liabilities")
                            .reduce((sum, item) => sum + item.currentYear, 0) +
                            balanceSheet
                              .filter((item) => item.category === "equity")
                              .reduce((sum, item) => sum + item.currentYear, 0)
                            ? "text-green-800"
                            : "text-red-800"
                        }`}
                      >
                        {balanceSheet
                          .filter((item) => item.category === "assets")
                          .reduce((sum, item) => sum + item.currentYear, 0) ===
                        balanceSheet
                          .filter((item) => item.category === "liabilities")
                          .reduce((sum, item) => sum + item.currentYear, 0) +
                          balanceSheet
                            .filter((item) => item.category === "equity")
                            .reduce((sum, item) => sum + item.currentYear, 0)
                          ? "✓ Balance Sheet is Balanced"
                          : "��� Balance Sheet is Not Balanced"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profit-loss" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss Statement</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => exportProfitLoss("excel")}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button
                    onClick={() => exportProfitLoss("pdf")}
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">
                        Current Period
                      </TableHead>
                      <TableHead className="text-right">
                        Previous Period
                      </TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">INCOME</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {profitLoss
                      .filter((item) => item.category === "income")
                      .map((item) => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.account}</TableCell>
                          <TableCell className="text-right">
                            KSh {item.currentPeriod.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            KSh {item.previousPeriod.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            KSh {item.budget.toLocaleString()}
                          </TableCell>
                          <TableCell
                            className={`text-right ${item.variance >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            KSh {item.variance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">EXPENSES</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {profitLoss
                      .filter((item) => item.category === "expense")
                      .map((item) => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.account}</TableCell>
                          <TableCell className="text-right">
                            KSh {item.currentPeriod.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            KSh {item.previousPeriod.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            KSh {item.budget.toLocaleString()}
                          </TableCell>
                          <TableCell
                            className={`text-right ${item.variance >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            KSh {item.variance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Management</CardTitle>
                <Button onClick={() => setShowNewInvoice(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Invoice Financial Summary */}
                  {invoices.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total Invoices
                              </p>
                              <p className="text-lg font-semibold">
                                {invoices.length}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Processed
                              </p>
                              <p className="text-lg font-semibold">
                                {
                                  invoices.filter(
                                    (inv) => inv.status === "processed",
                                  ).length
                                }
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Pending
                              </p>
                              <p className="text-lg font-semibold">
                                {
                                  invoices.filter((inv) => {
                                    const status = calculateInvoiceStatus(inv);
                                    return status.status === "pending";
                                  }).length
                                }
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Overdue
                              </p>
                              <p className="text-lg font-semibold text-red-600">
                                {
                                  invoices.filter((inv) => {
                                    const status = calculateInvoiceStatus(inv);
                                    return status.status === "overdue";
                                  }).length
                                }
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total Revenue
                              </p>
                              <p className="text-lg font-semibold">
                                KSh{" "}
                                {invoices
                                  .filter((inv) => inv.status === "processed")
                                  .reduce((sum, inv) => sum + inv.total, 0)
                                  .toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {invoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No invoices created yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell>{invoice.invoiceNumber}</TableCell>
                            <TableCell>{invoice.client}</TableCell>
                            <TableCell>{invoice.date}</TableCell>
                            <TableCell>{invoice.dueDate}</TableCell>
                            <TableCell className="text-right">
                              KSh {invoice.total.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const statusInfo =
                                  calculateInvoiceStatus(invoice);
                                return (
                                  <div className="space-y-1">
                                    <Badge variant={statusInfo.variant as any}>
                                      {statusInfo.label}
                                    </Badge>
                                    {invoice.processedDate && (
                                      <div className="text-xs text-muted-foreground">
                                        Processed:{" "}
                                        {new Date(
                                          invoice.processedDate,
                                        ).toLocaleDateString()}
                                      </div>
                                    )}
                                    {invoice.status !== "processed" &&
                                      invoice.status !== "paid" &&
                                      invoice.dueDate && (
                                        <div
                                          className={`text-xs ${statusInfo.status === "overdue" ? "text-red-600 font-medium" : "text-muted-foreground"}`}
                                        >
                                          {getDaysFromDue(invoice.dueDate)}
                                        </div>
                                      )}
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadInvoicePDF(invoice)}
                                  title="Download PDF"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => printInvoice(invoice)}
                                  title="Print Invoice"
                                >
                                  <Printer className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedInvoice(invoice)}
                                  title="View Details"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                {invoice.status !== "processed" &&
                                  invoice.status !== "paid" && (
                                    <Button
                                      size="sm"
                                      style={{
                                        backgroundColor: "#800020",
                                        borderColor: "#800020",
                                      }}
                                      className="text-white hover:bg-[#600015]"
                                      onClick={() => processInvoice(invoice)}
                                      title="Mark as Processed"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                  )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lpo" className="space-y-6">
            {/* LPO Header Section */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "#800020" }}>
                  Local Purchase Orders (LPO)
                </h2>
                <p className="text-muted-foreground">
                  Manage purchase orders for {churchSettings.name}
                </p>
              </div>
              <Button
                onClick={() => setShowNewLPO(true)}
                className="text-white hover:opacity-90"
                style={{ backgroundColor: "#800020" }}
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Generate LPO
              </Button>
            </div>

            {/* LPO Management Section */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* LPO Summary Cards */}
                  {lpos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <FileText
                              className="h-4 w-4"
                              style={{ color: "#800020" }}
                            />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total LPOs
                              </p>
                              <p className="text-lg font-semibold">
                                {lpos.length}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Pending
                              </p>
                              <p className="text-lg font-semibold">
                                {
                                  lpos.filter((lpo) => lpo.status === "pending")
                                    .length
                                }
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Fulfilled
                              </p>
                              <p className="text-lg font-semibold">
                                {
                                  lpos.filter(
                                    (lpo) => lpo.status === "fulfilled",
                                  ).length
                                }
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total Value
                              </p>
                              <p className="text-lg font-semibold">
                                KSh{" "}
                                {lpos
                                  .reduce((sum, lpo) => sum + lpo.total, 0)
                                  .toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* LPO Table or Empty State */}
                  {lpos.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText
                        className="h-16 w-16 mx-auto mb-4 opacity-30"
                        style={{ color: "#800020" }}
                      />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Purchase Orders
                      </h3>
                      <p className="text-muted-foreground">
                        Click "Generate LPO" above to create your first purchase
                        order
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">
                              LPO Number
                            </TableHead>
                            <TableHead className="font-semibold">
                              Supplier
                            </TableHead>
                            <TableHead className="font-semibold">
                              Date Created
                            </TableHead>
                            <TableHead className="font-semibold">
                              Delivery Date
                            </TableHead>
                            <TableHead className="font-semibold text-right">
                              Amount
                            </TableHead>
                            <TableHead className="font-semibold">
                              Status
                            </TableHead>
                            <TableHead className="font-semibold">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lpos.map((lpo) => (
                            <TableRow key={lpo.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                {lpo.lpoNumber}
                              </TableCell>
                              <TableCell>{lpo.supplier}</TableCell>
                              <TableCell>
                                {new Date(lpo.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {lpo.deliveryDate
                                  ? new Date(
                                      lpo.deliveryDate,
                                    ).toLocaleDateString()
                                  : "Not specified"}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                KSh {lpo.total.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    lpo.status === "fulfilled"
                                      ? "default"
                                      : lpo.status === "cancelled"
                                        ? "destructive"
                                        : lpo.status === "sent"
                                          ? "secondary"
                                          : "outline"
                                  }
                                  className="capitalize"
                                >
                                  {lpo.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedLPO(lpo)}
                                    title="View Details"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // Set the form with existing LPO data to regenerate PDF
                                      setLpoForm({
                                        supplier: lpo.supplier,
                                        supplierEmail: lpo.supplierEmail,
                                        supplierPhone: lpo.supplierPhone,
                                        supplierAddress: lpo.supplierAddress,
                                        lpoNumber: lpo.lpoNumber,
                                        date: lpo.date,
                                        deliveryDate: lpo.deliveryDate,
                                        paymentTerms: lpo.paymentTerms,
                                        notes: lpo.notes,
                                        approvedBy: lpo.approvedBy,
                                        items: lpo.items,
                                      });
                                      generateLPOPDF();
                                    }}
                                    title="Print/Download PDF"
                                  >
                                    <Printer className="h-3 w-3" />
                                  </Button>
                                  <Select
                                    onValueChange={(value) =>
                                      updateLPOStatus(lpo.id, value)
                                    }
                                  >
                                    <SelectTrigger className="w-20 h-8">
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getLPOStatusOptions(lpo.status).map(
                                        (status) => (
                                          <SelectItem
                                            key={status}
                                            value={status}
                                            className="capitalize"
                                          >
                                            {status}
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tsoam-forms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Summary Forms (SSF)</CardTitle>
                <Button onClick={() => setShowTSOAMForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Service Summary Form
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tsoamForms.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No TSOAM Service Summary Forms created yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Form ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Service Type</TableHead>
                          <TableHead>Minister</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>Total Offering</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tsoamForms.map((form) => (
                          <TableRow key={form.id}>
                            <TableCell>{form.id}</TableCell>
                            <TableCell>{form.date}</TableCell>
                            <TableCell>{form.serviceType}</TableCell>
                            <TableCell>{form.minister}</TableCell>
                            <TableCell>
                              {form.attendance.men +
                                form.attendance.women +
                                form.attendance.children}
                            </TableCell>
                            <TableCell>
                              KSh{" "}
                              {Object.values(form.offerings)
                                .reduce((sum, val) => sum + val, 0)
                                .toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => printTSOAMForm(form)}
                                >
                                  <Printer className="h-3 w-3 mr-1" />
                                  Print
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateTSOAMFormPDF(form)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  PDF
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => exportBalanceSheet("pdf")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Balance Sheet
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => exportProfitLoss("pdf")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Profit & Loss
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => exportLedger("pdf")}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    General Ledger
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => exportBalanceSheet("excel")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel Reports
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <PieChart className="h-4 w-4 mr-2" />
                    Financial Analysis
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Trend Analysis
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Transaction Dialog */}
        <Dialog open={showNewTransaction} onOpenChange={setShowNewTransaction}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transactionType">Transaction Type</Label>
                  <Select
                    value={newTransaction.type}
                    onValueChange={(value) =>
                      setNewTransaction({
                        ...newTransaction,
                        type: value as "Income" | "Expense",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Income">Income</SelectItem>
                      <SelectItem value="Expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newTransaction.category}
                    onValueChange={(value) =>
                      setNewTransaction({ ...newTransaction, category: value })
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
                      {newTransaction.type === "Expense" &&
                        EXPENSE_CATEGORIES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
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
                  <Label htmlFor="amount">Amount (KSh)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        amount: Number(e.target.value),
                      })
                    }
                    onFocus={(e) => {
                      if (e.target.value === "0" || e.target.value === "0.00") {
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
                  <Label htmlFor="paymentMethod">Payment Method</Label>
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                      <SelectItem value="Bank Transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="reference">Reference Number</Label>
                <Input
                  id="reference"
                  value={newTransaction.reference}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      reference: e.target.value,
                    })
                  }
                  placeholder="REF001"
                />
              </div>
              {newTransaction.paymentMethod === "M-Pesa" && (
                <div>
                  <Label htmlFor="mpesaTransactionId">
                    M-Pesa Transaction ID
                  </Label>
                  <Input
                    id="mpesaTransactionId"
                    value={newTransaction.mpesaTransactionId || ""}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        mpesaTransactionId: e.target.value,
                      })
                    }
                    placeholder="RKL9XXXXXXX"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newTransaction.notes}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewTransaction(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddTransaction}>Add Transaction</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Expense Dialog */}
        <Dialog open={showNewExpense} onOpenChange={setShowNewExpense}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expenseCategory">Category</Label>
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
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier/Vendor</Label>
                  <Input
                    id="supplier"
                    value={newExpense.supplier}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, supplier: e.target.value })
                    }
                    placeholder="Supplier name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="expenseDescription">Description</Label>
                <Input
                  id="expenseDescription"
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      description: e.target.value,
                    })
                  }
                  placeholder="Expense description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expenseAmount">Amount (KSh)</Label>
                  <Input
                    id="expenseAmount"
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        amount: Number(e.target.value),
                      })
                    }
                    onFocus={(e) => {
                      if (e.target.value === "0" || e.target.value === "0.00") {
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
                  <Label htmlFor="receiptNumber">Receipt Number</Label>
                  <Input
                    id="receiptNumber"
                    value={newExpense.receiptNumber}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        receiptNumber: e.target.value,
                      })
                    }
                    placeholder="Receipt #"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="expenseNotes">Notes</Label>
                <Textarea
                  id="expenseNotes"
                  value={newExpense.notes}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, notes: e.target.value })
                  }
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewExpense(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddExpense}>Add Expense</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* TSOAM Service Summary Form Dialog */}
        <Dialog open={showTSOAMForm} onOpenChange={setShowTSOAMForm}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>TSOAM Service Summary Form (SSF)</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Service Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Service Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newTSOAMForm.date}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Input
                      id="theme"
                      value={newTSOAMForm.theme}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          theme: e.target.value,
                        })
                      }
                      placeholder="Service theme"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serviceType">Service Type</Label>
                    <Select
                      value={newTSOAMForm.serviceType}
                      onValueChange={(value) =>
                        setNewTSOAMForm({ ...newTSOAMForm, serviceType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sunday Service">
                          Sunday Service
                        </SelectItem>
                        <SelectItem value="Wednesday Service">
                          Wednesday Service
                        </SelectItem>
                        <SelectItem value="Special Service">
                          Special Service
                        </SelectItem>
                        <SelectItem value="Conference">Conference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="minister">Minister</Label>
                    <Input
                      id="minister"
                      value={newTSOAMForm.minister}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          minister: e.target.value,
                        })
                      }
                      placeholder="Minister name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="sermonTitle">Sermon Title</Label>
                    <Input
                      id="sermonTitle"
                      value={newTSOAMForm.sermonTitle}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          sermonTitle: e.target.value,
                        })
                      }
                      placeholder="Sermon title"
                    />
                  </div>
                </div>
              </div>

              {/* Attendance Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Attendance Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="men">Men</Label>
                    <Input
                      id="men"
                      type="number"
                      value={newTSOAMForm.attendance?.men || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          attendance: {
                            ...newTSOAMForm.attendance!,
                            men: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.currentTarget.value === "0" &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="women">Women</Label>
                    <Input
                      id="women"
                      type="number"
                      value={newTSOAMForm.attendance?.women || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          attendance: {
                            ...newTSOAMForm.attendance!,
                            women: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.currentTarget.value === "0" &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="children">Children</Label>
                    <Input
                      id="children"
                      type="number"
                      value={newTSOAMForm.attendance?.children || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          attendance: {
                            ...newTSOAMForm.attendance!,
                            children: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.currentTarget.value === "0" &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newComers">New Comers</Label>
                    <Input
                      id="newComers"
                      type="number"
                      value={newTSOAMForm.attendance?.newComers || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          attendance: {
                            ...newTSOAMForm.attendance!,
                            newComers: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.currentTarget.value === "0" &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newConverts">New Converts</Label>
                    <Input
                      id="newConverts"
                      type="number"
                      value={newTSOAMForm.attendance?.newConverts || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          attendance: {
                            ...newTSOAMForm.attendance!,
                            newConverts: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.currentTarget.value === "0" &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cars">Cars</Label>
                    <Input
                      id="cars"
                      type="number"
                      value={newTSOAMForm.attendance?.cars || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          attendance: {
                            ...newTSOAMForm.attendance!,
                            cars: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.currentTarget.value === "0" &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Offerings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Offerings</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={autoFetchOfferingData}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Auto-fetch Offerings
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="wOffering">W.Offering (KSh)</Label>
                    <Input
                      id="wOffering"
                      type="number"
                      value={newTSOAMForm.offerings?.wOffering || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          offerings: {
                            ...newTSOAMForm.offerings!,
                            wOffering: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00"
                        ) {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          (e.currentTarget.value === "0" ||
                            e.currentTarget.value === "0.00") &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tithe">Tithe (KSh)</Label>
                    <Input
                      id="tithe"
                      type="number"
                      value={newTSOAMForm.offerings?.tithe || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          offerings: {
                            ...newTSOAMForm.offerings!,
                            tithe: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00"
                        ) {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          (e.currentTarget.value === "0" ||
                            e.currentTarget.value === "0.00") &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="thanksgiving">Thanksgiving (KSh)</Label>
                    <Input
                      id="thanksgiving"
                      type="number"
                      value={newTSOAMForm.offerings?.thanksgiving || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          offerings: {
                            ...newTSOAMForm.offerings!,
                            thanksgiving: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00"
                        ) {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          (e.currentTarget.value === "0" ||
                            e.currentTarget.value === "0.00") &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sacrifice">Sacrifice (KSh)</Label>
                    <Input
                      id="sacrifice"
                      type="number"
                      value={newTSOAMForm.offerings?.sacrifice || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          offerings: {
                            ...newTSOAMForm.offerings!,
                            sacrifice: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00"
                        ) {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          (e.currentTarget.value === "0" ||
                            e.currentTarget.value === "0.00") &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="till">Till (KSh)</Label>
                    <Input
                      id="till"
                      type="number"
                      value={newTSOAMForm.offerings?.till || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          offerings: {
                            ...newTSOAMForm.offerings!,
                            till: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00"
                        ) {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          (e.currentTarget.value === "0" ||
                            e.currentTarget.value === "0.00") &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sSchool">S.School (KSh)</Label>
                    <Input
                      id="sSchool"
                      type="number"
                      value={newTSOAMForm.offerings?.sSchool || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          offerings: {
                            ...newTSOAMForm.offerings!,
                            sSchool: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00"
                        ) {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          (e.currentTarget.value === "0" ||
                            e.currentTarget.value === "0.00") &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="targeted">Targeted (KSh)</Label>
                    <Input
                      id="targeted"
                      type="number"
                      value={newTSOAMForm.offerings?.targeted || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          offerings: {
                            ...newTSOAMForm.offerings!,
                            targeted: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00"
                        ) {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          (e.currentTarget.value === "0" ||
                            e.currentTarget.value === "0.00") &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="others">Others (KSh)</Label>
                    <Input
                      id="others"
                      type="number"
                      value={newTSOAMForm.offerings?.others || 0}
                      onChange={(e) =>
                        setNewTSOAMForm({
                          ...newTSOAMForm,
                          offerings: {
                            ...newTSOAMForm.offerings!,
                            others: Number(e.target.value),
                          },
                        })
                      }
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00"
                        ) {
                          e.target.select();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          (e.currentTarget.value === "0" ||
                            e.currentTarget.value === "0.00") &&
                          /[0-9]/.test(e.key)
                        ) {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Officials */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Officials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Resident Pastor</h4>
                    <div className="space-y-2">
                      <Input
                        placeholder="Pastor Name"
                        value={
                          newTSOAMForm.officials?.residentPastor.name || ""
                        }
                        onChange={(e) =>
                          setNewTSOAMForm({
                            ...newTSOAMForm,
                            officials: {
                              ...newTSOAMForm.officials!,
                              residentPastor: {
                                ...newTSOAMForm.officials!.residentPastor,
                                name: e.target.value,
                              },
                            },
                          })
                        }
                      />
                      <Input
                        type="date"
                        value={
                          newTSOAMForm.officials?.residentPastor.date || ""
                        }
                        onChange={(e) =>
                          setNewTSOAMForm({
                            ...newTSOAMForm,
                            officials: {
                              ...newTSOAMForm.officials!,
                              residentPastor: {
                                ...newTSOAMForm.officials!.residentPastor,
                                date: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Church Accountant</h4>
                    <div className="space-y-2">
                      <Input
                        placeholder="Accountant Name"
                        value={
                          newTSOAMForm.officials?.churchAccountant.name || ""
                        }
                        onChange={(e) =>
                          setNewTSOAMForm({
                            ...newTSOAMForm,
                            officials: {
                              ...newTSOAMForm.officials!,
                              churchAccountant: {
                                ...newTSOAMForm.officials!.churchAccountant,
                                name: e.target.value,
                              },
                            },
                          })
                        }
                      />
                      <Input
                        type="date"
                        value={
                          newTSOAMForm.officials?.churchAccountant.date || ""
                        }
                        onChange={(e) =>
                          setNewTSOAMForm({
                            ...newTSOAMForm,
                            officials: {
                              ...newTSOAMForm.officials!,
                              churchAccountant: {
                                ...newTSOAMForm.officials!.churchAccountant,
                                date: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowTSOAMForm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitTSOAMForm}>Submit Form</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Invoice Creation Dialog */}
        <Dialog open={showNewInvoice} onOpenChange={setShowNewInvoice}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" style={{ color: "#800020" }} />
                  Create Professional Invoice
                </DialogTitle>
                <div className="mr-8">
                  <Button
                    onClick={printSaveAndClose}
                    disabled={
                      isGeneratingInvoice ||
                      !invoiceForm.clientName ||
                      invoiceForm.items.some(
                        (item) => !item.description || item.amount <= 0,
                      )
                    }
                    className="text-white hover:opacity-90"
                    style={{ backgroundColor: "#800020" }}
                    size="sm"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print & Save
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate invoices with church branding and professional
                formatting
              </p>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[80vh] pr-2">
              <div className="space-y-6">
                {/* Church Information Display */}
                <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-full">
                      <img
                        src="https://cdn.builder.io/api/v1/image/assets%2F0627183da1a04fa4b6c5a1ab36b4780e%2F24ea526264444b8ca043118a01335902?format=webp&width=100"
                        alt="TSOAM Logo"
                        className="h-12 w-12 object-contain"
                      />
                    </div>
                    <div>
                      <h3
                        className="font-bold text-lg"
                        style={{ color: "#800020" }}
                      >
                        THE SEED OF ABRAHAM MINISTRY (TSOAM)
                      </h3>
                      <p className="text-sm text-gray-600">
                        P.O. Box 12345, Nairobi, Kenya
                      </p>
                      <p className="text-sm text-gray-600">
                        Phone: +254 700 000 000 | Email: info@tsoam.org
                      </p>
                    </div>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "#800020" }}
                    >
                      Client Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="clientName">Client Name *</Label>
                        <Input
                          id="clientName"
                          value={invoiceForm.clientName}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              clientName: e.target.value,
                            })
                          }
                          placeholder="Enter client/organization name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientEmail">Client Email</Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          value={invoiceForm.clientEmail}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              clientEmail: e.target.value,
                            })
                          }
                          placeholder="client@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientPhone">Client Phone</Label>
                        <Input
                          id="clientPhone"
                          value={invoiceForm.clientPhone}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              clientPhone: e.target.value,
                            })
                          }
                          placeholder="+254 700 000 000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientAddress">Client Address</Label>
                        <Textarea
                          id="clientAddress"
                          value={invoiceForm.clientAddress}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              clientAddress: e.target.value,
                            })
                          }
                          placeholder="Enter complete address"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "#800020" }}
                    >
                      Invoice Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="invoiceNumber">Invoice Number</Label>
                        <Input
                          id="invoiceNumber"
                          value={invoiceForm.invoiceNumber}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              invoiceNumber: e.target.value,
                            })
                          }
                          placeholder="INV-001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invoiceDate">Invoice Date *</Label>
                        <Input
                          id="invoiceDate"
                          type="date"
                          value={invoiceForm.invoiceDate}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              invoiceDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={invoiceForm.dueDate}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              dueDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="paymentTerms">Payment Terms</Label>
                        <Select
                          value={invoiceForm.paymentTerms}
                          onValueChange={(value) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              paymentTerms: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Due on Receipt">
                              Due on Receipt - Pay immediately
                            </SelectItem>
                            <SelectItem value="Net 15">
                              Net 15 - Payment due in 15 days
                            </SelectItem>
                            <SelectItem value="Net 30">
                              Net 30 - Payment due in 30 days
                            </SelectItem>
                            <SelectItem value="Net 60">
                              Net 60 - Payment due in 60 days
                            </SelectItem>
                            <SelectItem value="Net 90">
                              Net 90 - Payment due in 90 days
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Items Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "#800020" }}
                    >
                      Invoice Items
                    </h3>
                    <Button
                      onClick={addInvoiceItem}
                      size="sm"
                      className="text-white hover:opacity-90"
                      style={{ backgroundColor: "#800020" }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded">
                      <div className="col-span-4">Description</div>
                      <div className="col-span-1">Qty</div>
                      <div className="col-span-2">Unit Price (KSH)</div>
                      <div className="col-span-2">Amount (KSH)</div>
                      <div className="col-span-2">VAT Applicable</div>
                      <div className="col-span-1">Action</div>
                    </div>

                    {/* Items */}
                    {invoiceForm.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-4">
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateInvoiceItem(
                                item.id,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Item description"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateInvoiceItem(
                                item.id,
                                "quantity",
                                Number(e.target.value),
                              )
                            }
                            onFocus={(e) => {
                              if (Number(e.target.value) === 0) {
                                e.target.value = "";
                              }
                            }}
                            onBlur={(e) => {
                              if (
                                e.target.value === "" ||
                                Number(e.target.value) === 0
                              ) {
                                updateInvoiceItem(item.id, "quantity", 1);
                              }
                            }}
                            min="1"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateInvoiceItem(
                                item.id,
                                "unitPrice",
                                Number(e.target.value),
                              )
                            }
                            onFocus={(e) => {
                              if (Number(e.target.value) === 0) {
                                e.target.value = "";
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value === "") {
                                updateInvoiceItem(item.id, "unitPrice", 0);
                              }
                            }}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={item.amount.toLocaleString()}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center justify-center">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.vatApplicable}
                                onChange={(e) =>
                                  updateInvoiceItem(
                                    item.id,
                                    "vatApplicable",
                                    e.target.checked,
                                  )
                                }
                                className="mr-2 w-4 h-4 text-[#800020] bg-gray-100 border-gray-300 rounded focus:ring-[#800020]"
                              />
                              <span className="text-sm">
                                {item.vatApplicable ? "Yes" : "No"}
                              </span>
                            </label>
                          </div>
                        </div>
                        <div className="col-span-1">
                          {invoiceForm.items.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeInvoiceItem(item.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-end">
                      <div className="w-80 space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">
                            Subtotal (VAT Exclusive):
                          </span>
                          <span>
                            KSH{" "}
                            {calculateVATDetails().vatExclusive.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">
                            VAT Amount (16% - Kenya):
                          </span>
                          <span>
                            KSH{" "}
                            {calculateVATDetails().vatAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>Total (VAT Inclusive):</span>
                          <span style={{ color: "#800020" }}>
                            KSH{" "}
                            {calculateVATDetails().vatInclusive.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-3">
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: "#800020" }}
                  >
                    Additional Notes
                  </h3>
                  <Textarea
                    value={invoiceForm.notes}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, notes: e.target.value })
                    }
                    placeholder="Enter any additional notes, terms, or conditions..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              {!invoiceGenerated ? (
                <>
                  <Button
                    onClick={generateInvoicePDF}
                    disabled={
                      isGeneratingInvoice ||
                      !invoiceForm.clientName ||
                      invoiceForm.items.some(
                        (item) => !item.description || item.amount <= 0,
                      )
                    }
                    className="text-white hover:opacity-90 flex-1"
                    style={{ backgroundColor: "#800020" }}
                  >
                    {isGeneratingInvoice ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Invoice PDF
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={printSaveAndClose}
                    disabled={
                      isGeneratingInvoice ||
                      !invoiceForm.clientName ||
                      invoiceForm.items.some(
                        (item) => !item.description || item.amount <= 0,
                      )
                    }
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print & Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewInvoice(false)}
                    disabled={isGeneratingInvoice}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={addInvoiceToSystem}
                    className="text-white hover:opacity-90"
                    style={{ backgroundColor: "#800020" }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to System
                  </Button>
                  <Button variant="outline" onClick={() => printInvoice()}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Invoice
                  </Button>
                  <Button variant="outline" onClick={resetInvoiceForm}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    New Invoice
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewInvoice(false)}
                  >
                    Close
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Invoice View Details Dialog */}
        <Dialog
          open={!!selectedInvoice}
          onOpenChange={() => setSelectedInvoice(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" style={{ color: "#800020" }} />
                Invoice Details
              </DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3
                      className="font-semibold text-lg"
                      style={{ color: "#800020" }}
                    >
                      Invoice Information
                    </h3>
                    <div className="space-y-2 mt-2">
                      <p>
                        <span className="font-medium">Invoice #:</span>{" "}
                        {selectedInvoice.invoiceNumber}
                      </p>
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {new Date(selectedInvoice.date).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Due Date:</span>{" "}
                        {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Payment Terms:</span>{" "}
                        {selectedInvoice.paymentTerms}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3
                      className="font-semibold text-lg"
                      style={{ color: "#800020" }}
                    >
                      Client Information
                    </h3>
                    <div className="space-y-2 mt-2">
                      <p>
                        <span className="font-medium">Name:</span>{" "}
                        {selectedInvoice.client}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {selectedInvoice.clientEmail}
                      </p>
                      <p>
                        <span className="font-medium">Address:</span>{" "}
                        {selectedInvoice.clientAddress}
                      </p>
                      {(() => {
                        const statusInfo =
                          calculateInvoiceStatus(selectedInvoice);
                        return (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Status:</span>
                            <Badge variant={statusInfo.variant as any}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div>
                  <h3
                    className="font-semibold text-lg mb-4"
                    style={{ color: "#800020" }}
                  >
                    Items
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>VAT</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            KSH {item.unitPrice.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {item.vatApplicable ? "Yes" : "No"}
                          </TableCell>
                          <TableCell className="text-right">
                            KSH {item.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Invoice Totals */}
                <div className="flex justify-end">
                  <div className="w-80 space-y-2 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal:</span>
                      <span>
                        KSH {selectedInvoice.subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">VAT (16%):</span>
                      <span>KSH {selectedInvoice.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span style={{ color: "#800020" }}>
                        KSH {selectedInvoice.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div>
                    <h3
                      className="font-semibold text-lg mb-2"
                      style={{ color: "#800020" }}
                    >
                      Notes
                    </h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">
                      {selectedInvoice.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* LPO Creation Dialog */}
        <Dialog
          open={showNewLPO}
          onOpenChange={(open) => !open && closeLPODialog()}
        >
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" style={{ color: "#800020" }} />
                  Create Local Purchase Order (LPO)
                </DialogTitle>
                <div className="mr-8 flex gap-2">
                  {!currentLPOSaved ? (
                    <Button
                      onClick={saveLPO}
                      disabled={
                        !lpoForm.supplier ||
                        lpoForm.items.some(
                          (item) => !item.description || item.amount <= 0,
                        )
                      }
                      className="text-white hover:opacity-90"
                      style={{ backgroundColor: "#800020" }}
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save LPO
                    </Button>
                  ) : (
                    <Button
                      onClick={printLPO}
                      disabled={isGeneratingLPO}
                      className="text-white hover:opacity-90"
                      style={{ backgroundColor: "#800020" }}
                      size="sm"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print LPO
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate purchase orders for suppliers with church branding
              </p>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[80vh] pr-2">
              <div className="space-y-6">
                {/* Church Information Display */}
                <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center gap-4">
                    {churchSettings.logo ? (
                      <img
                        src={churchSettings.logo}
                        alt="Church Logo"
                        className="h-16 w-16 rounded-full border-2 object-cover shadow-lg"
                        style={{ borderColor: "#800020" }}
                      />
                    ) : (
                      <Building
                        className="h-16 w-16"
                        style={{ color: "#800020" }}
                      />
                    )}
                    <div>
                      <h3
                        className="font-bold text-lg"
                        style={{ color: "#800020" }}
                      >
                        {churchSettings.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {churchSettings.address}
                      </p>
                      <p className="text-sm text-gray-600">
                        Phone: {churchSettings.phone} | Email:{" "}
                        {churchSettings.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        Website: {churchSettings.website}
                      </p>
                    </div>
                  </div>
                </div>

                {/* LPO Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "#800020" }}
                    >
                      Supplier Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="supplier">Supplier Name *</Label>
                        <Input
                          id="supplier"
                          value={lpoForm.supplier}
                          onChange={(e) =>
                            setLpoForm({ ...lpoForm, supplier: e.target.value })
                          }
                          placeholder="Enter supplier company name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supplierEmail">Email</Label>
                        <Input
                          id="supplierEmail"
                          type="email"
                          value={lpoForm.supplierEmail}
                          onChange={(e) =>
                            setLpoForm({
                              ...lpoForm,
                              supplierEmail: e.target.value,
                            })
                          }
                          placeholder="supplier@company.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supplierPhone">Phone</Label>
                        <Input
                          id="supplierPhone"
                          value={lpoForm.supplierPhone}
                          onChange={(e) =>
                            setLpoForm({
                              ...lpoForm,
                              supplierPhone: e.target.value,
                            })
                          }
                          placeholder="+254 700 000 000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supplierAddress">Address</Label>
                        <Textarea
                          id="supplierAddress"
                          value={lpoForm.supplierAddress}
                          onChange={(e) =>
                            setLpoForm({
                              ...lpoForm,
                              supplierAddress: e.target.value,
                            })
                          }
                          placeholder="Supplier address"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "#800020" }}
                    >
                      Order Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="lpoNumber">LPO Number</Label>
                        <Input
                          id="lpoNumber"
                          value={lpoForm.lpoNumber}
                          onChange={(e) =>
                            setLpoForm({
                              ...lpoForm,
                              lpoNumber: e.target.value,
                            })
                          }
                          placeholder="LPO-123456"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lpoDate">Order Date</Label>
                        <Input
                          id="lpoDate"
                          type="date"
                          value={lpoForm.date}
                          onChange={(e) =>
                            setLpoForm({ ...lpoForm, date: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="deliveryDate">
                          Required Delivery Date
                        </Label>
                        <Input
                          id="deliveryDate"
                          type="date"
                          value={lpoForm.deliveryDate}
                          onChange={(e) =>
                            setLpoForm({
                              ...lpoForm,
                              deliveryDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="paymentTerms">Payment Terms</Label>
                        <Select
                          value={lpoForm.paymentTerms}
                          onValueChange={(value) =>
                            setLpoForm({ ...lpoForm, paymentTerms: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Due on Receipt">
                              Due on Receipt
                            </SelectItem>
                            <SelectItem value="Net 15">
                              Net 15 - Payment due in 15 days
                            </SelectItem>
                            <SelectItem value="Net 30">
                              Net 30 - Payment due in 30 days
                            </SelectItem>
                            <SelectItem value="Net 60">
                              Net 60 - Payment due in 60 days
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="approvedBy">Approved By</Label>
                        <Input
                          id="approvedBy"
                          value={lpoForm.approvedBy}
                          onChange={(e) =>
                            setLpoForm({
                              ...lpoForm,
                              approvedBy: e.target.value,
                            })
                          }
                          placeholder="Approving authority name"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "#800020" }}
                    >
                      Order Items
                    </h3>
                    <Button
                      type="button"
                      onClick={addLPOItem}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded">
                      <div className="col-span-3">Description</div>
                      <div className="col-span-3">Specification</div>
                      <div className="col-span-2">Quantity</div>
                      <div className="col-span-2">Unit Price (KSH)</div>
                      <div className="col-span-1">Amount (KSH)</div>
                      <div className="col-span-1">Action</div>
                    </div>

                    {/* Items */}
                    {lpoForm.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-3">
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateLPOItem(
                                item.id,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Item description"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            value={item.specification}
                            onChange={(e) =>
                              updateLPOItem(
                                item.id,
                                "specification",
                                e.target.value,
                              )
                            }
                            placeholder="Specifications/details"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLPOItem(
                                item.id,
                                "quantity",
                                Number(e.target.value),
                              )
                            }
                            onFocus={(e) => {
                              if (Number(e.target.value) === 0) {
                                e.target.value = "";
                              }
                            }}
                            onBlur={(e) => {
                              if (
                                e.target.value === "" ||
                                Number(e.target.value) === 0
                              ) {
                                updateLPOItem(item.id, "quantity", 1);
                              }
                            }}
                            min="1"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateLPOItem(
                                item.id,
                                "unitPrice",
                                Number(e.target.value),
                              )
                            }
                            onFocus={(e) => {
                              if (Number(e.target.value) === 0) {
                                e.target.value = "";
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value === "") {
                                updateLPOItem(item.id, "unitPrice", 0);
                              }
                            }}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            value={item.amount.toLocaleString()}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <div className="col-span-1">
                          {lpoForm.items.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeLPOItem(item.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Amount:</span>
                          <span style={{ color: "#800020" }}>
                            KSH {calculateLPOTotal().toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-3">
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: "#800020" }}
                  >
                    Additional Notes
                  </h3>
                  <Textarea
                    value={lpoForm.notes}
                    onChange={(e) =>
                      setLpoForm({ ...lpoForm, notes: e.target.value })
                    }
                    placeholder="Enter any additional notes, special instructions, or terms..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={generateLPOPDF}
                disabled={
                  isGeneratingLPO ||
                  !lpoForm.supplier ||
                  lpoForm.items.some(
                    (item) => !item.description || item.amount <= 0,
                  )
                }
                className="text-white hover:opacity-90 flex-1"
                style={{ backgroundColor: "#800020" }}
              >
                {isGeneratingLPO ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate LPO PDF
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={closeLPODialog}
                disabled={isGeneratingLPO}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* LPO View Details Dialog */}
        <Dialog open={!!selectedLPO} onOpenChange={() => setSelectedLPO(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" style={{ color: "#800020" }} />
                LPO Details
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[75vh] pr-2">
              {selectedLPO && (
                <div className="space-y-6">
                  {/* LPO Header */}
                  <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3
                        className="font-semibold text-lg"
                        style={{ color: "#800020" }}
                      >
                        LPO Information
                      </h3>
                      <div className="space-y-2 mt-2">
                        <p>
                          <span className="font-medium">LPO #:</span>{" "}
                          {selectedLPO.lpoNumber}
                        </p>
                        <p>
                          <span className="font-medium">Date:</span>{" "}
                          {new Date(selectedLPO.date).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-medium">Delivery Date:</span>{" "}
                          {selectedLPO.deliveryDate
                            ? new Date(
                                selectedLPO.deliveryDate,
                              ).toLocaleDateString()
                            : "Not specified"}
                        </p>
                        <p>
                          <span className="font-medium">Payment Terms:</span>{" "}
                          {selectedLPO.paymentTerms}
                        </p>
                        <p>
                          <span className="font-medium">Approved By:</span>{" "}
                          {selectedLPO.approvedBy || "Pending approval"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3
                        className="font-semibold text-lg"
                        style={{ color: "#800020" }}
                      >
                        Supplier Information
                      </h3>
                      <div className="space-y-2 mt-2">
                        <p>
                          <span className="font-medium">Name:</span>{" "}
                          {selectedLPO.supplier}
                        </p>
                        <p>
                          <span className="font-medium">Email:</span>{" "}
                          {selectedLPO.supplierEmail || "Not provided"}
                        </p>
                        <p>
                          <span className="font-medium">Phone:</span>{" "}
                          {selectedLPO.supplierPhone || "Not provided"}
                        </p>
                        <p>
                          <span className="font-medium">Address:</span>{" "}
                          {selectedLPO.supplierAddress || "Not provided"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Status:</span>
                          <Badge
                            variant={
                              selectedLPO.status === "fulfilled"
                                ? "default"
                                : selectedLPO.status === "cancelled"
                                  ? "destructive"
                                  : selectedLPO.status === "sent"
                                    ? "secondary"
                                    : "outline"
                            }
                            className="capitalize"
                          >
                            {selectedLPO.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LPO Items */}
                  <div>
                    <h3
                      className="font-semibold text-lg mb-4"
                      style={{ color: "#800020" }}
                    >
                      Order Items
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Specification</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedLPO.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>
                              {item.specification || "Not specified"}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              KSH {item.unitPrice.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              KSH {item.amount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* LPO Totals */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount:</span>
                        <span style={{ color: "#800020" }}>
                          KSH {selectedLPO.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedLPO.notes && (
                    <div>
                      <h3
                        className="font-semibold text-lg mb-2"
                        style={{ color: "#800020" }}
                      >
                        Notes
                      </h3>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">
                        {selectedLPO.notes}
                      </p>
                    </div>
                  )}

                  {/* Status Tracking */}
                  <div className="border-t pt-4">
                    <h3
                      className="font-semibold text-lg mb-4"
                      style={{ color: "#800020" }}
                    >
                      Status Tracking
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">Update Status:</span>
                      <Select
                        onValueChange={(value) => {
                          updateLPOStatus(selectedLPO.id, value);
                          setSelectedLPO({
                            ...selectedLPO,
                            status: value as any,
                          });
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                        <SelectContent>
                          {getLPOStatusOptions(selectedLPO.status).map(
                            (status) => (
                              <SelectItem
                                key={status}
                                value={status}
                                className="capitalize"
                              >
                                {status}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2">Status Workflow:</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Pending:</strong> LPO created, awaiting
                          approval
                        </p>
                        <p>
                          <strong>Approved:</strong> LPO approved by authority
                        </p>
                        <p>
                          <strong>Sent:</strong> LPO sent to supplier
                        </p>
                        <p>
                          <strong>Fulfilled:</strong> Order completed by
                          supplier
                        </p>
                        <p>
                          <strong>Cancelled:</strong> Order cancelled
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
