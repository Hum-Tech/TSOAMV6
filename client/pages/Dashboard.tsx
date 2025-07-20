import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { financialTransactionService } from "@/services/FinancialTransactionService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  DollarSign,
  Users,
  UserPlus,
  Heart,
  Calendar,
  TrendingUp,
  Download,
  Eye,
  Building,
  Clock,
  Target,
  ArrowUp,
  ArrowDown,
  Receipt,
  FileText,
  Plus,
  CalendarPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from "xlsx";
import {
  dashboardDataService,
  type DashboardStats,
  type RecentActivity,
  type QuickStat,
} from "@/services/DashboardDataService";

// Mock data for charts - in real app this would come from API
const monthlyFinancialData = [
  {
    month: "Jan",
    offerings: 245000,
    tithes: 180000,
    expenses: 120000,
    welfare: 45000,
  },
  {
    month: "Feb",
    offerings: 265000,
    tithes: 195000,
    expenses: 115000,
    welfare: 52000,
  },
  {
    month: "Mar",
    offerings: 285000,
    tithes: 210000,
    expenses: 130000,
    welfare: 48000,
  },
  {
    month: "Apr",
    offerings: 275000,
    tithes: 205000,
    expenses: 125000,
    welfare: 55000,
  },
  {
    month: "May",
    offerings: 295000,
    tithes: 220000,
    expenses: 135000,
    welfare: 58000,
  },
  {
    month: "Jun",
    offerings: 310000,
    tithes: 235000,
    expenses: 140000,
    welfare: 60000,
  },
];

const offeringTypeData = [
  { name: "Normal Offering", value: 35, amount: 850000, color: "#8B5CF6" },
  { name: "Tithe", value: 30, amount: 720000, color: "#06B6D4" },
  { name: "Thanksgiving", value: 15, amount: 360000, color: "#10B981" },
  { name: "Prophetic Seed", value: 12, amount: 288000, color: "#F59E0B" },
  { name: "Sacrifice", value: 5, amount: 120000, color: "#EF4444" },
  { name: "Project", value: 3, amount: 72000, color: "#6366F1" },
];

const membershipGrowthData = [
  { month: "Jan", newMembers: 23, fullMembers: 1180, totalVisitors: 45 },
  { month: "Feb", newMembers: 28, fullMembers: 1205, totalVisitors: 52 },
  { month: "Mar", newMembers: 31, fullMembers: 1228, totalVisitors: 48 },
  { month: "Apr", newMembers: 26, fullMembers: 1245, totalVisitors: 41 },
  { month: "May", newMembers: 34, fullMembers: 1267, totalVisitors: 58 },
  { month: "Jun", newMembers: 29, fullMembers: 1285, totalVisitors: 47 },
];

const departmentData = [
  { department: "Ministry", employees: 8, budget: 480000 },
  { department: "Finance", employees: 3, budget: 270000 },
  { department: "HR", employees: 2, budget: 170000 },
  { department: "Operations", employees: 5, budget: 300000 },
  { department: "IT", employees: 2, budget: 180000 },
];

const leaveData = [
  { type: "Annual", taken: 45, available: 180 },
  { type: "Sick", taken: 28, available: 120 },
  { type: "Maternity", taken: 12, available: 90 },
  { type: "Paternity", taken: 8, available: 56 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Real-time dashboard data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    [],
  );
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize dashboard data based on user role and permissions
  useEffect(() => {
    const unsubscribeStats = dashboardDataService.subscribe((stats) => {
      // Get role-based filtered data for authorized modules
      const roleBasedStats = user
        ? dashboardDataService.getRoleBasedData(user.role, user.permissions)
        : stats;

      setDashboardStats(roleBasedStats);
      setQuickStats(dashboardDataService.getQuickStats());
      setIsLoading(false);
    });

    const unsubscribeActivities = dashboardDataService.subscribeToActivities(
      (activities) => {
        setRecentActivities(activities);
      },
    );

    // Subscribe to real-time financial updates from all modules
    const handleFinancialUpdate = () => {
      setFinancialSummary(financialTransactionService.getFinancialSummary());
    };

    financialTransactionService.subscribe(handleFinancialUpdate);

    // Initial data load with role-based filtering
    dashboardDataService.refreshData();

    return () => {
      unsubscribeStats();
      unsubscribeActivities();
      financialTransactionService.unsubscribe(handleFinancialUpdate);
    };
  }, [user?.role, user?.permissions]); // Refresh when user role/permissions change

  // Check if user has permission to view dashboard
  if (!user?.permissions?.dashboard) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to view the dashboard.
            </p>
            <p className="text-sm text-gray-500">
              Contact your administrator for access.
            </p>
          </div>
        </div>
      </Layout>
    );
  }
  const [dateRange, setDateRange] = useState("6months");
  const [selectedMetric, setSelectedMetric] = useState("financial");

  // Real-time financial data from all modules
  const [financialSummary, setFinancialSummary] = useState(
    financialTransactionService.getFinancialSummary(),
  );

  // Quick Action Dialog States
  const [isOfferingDialogOpen, setIsOfferingDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  // Quick Action Form States
  const [quickOffering, setQuickOffering] = useState({
    type: "Normal Offering",
    service: "Main Service",
    amount: "",
    paymentMethod: "Cash",
    preacher: "",
  });

  const [quickMember, setQuickMember] = useState({
    name: "",
    phone: "",
    email: "",
    purpose: "Regular Membership",
    serviceGroup: "",
  });

  const [quickEvent, setQuickEvent] = useState({
    title: "",
    date: "",
    time: "",
    location: "Main Church Hall",
    description: "",
    type: "Church Service",
  });

  const [quickExpense, setQuickExpense] = useState({
    category: "Ministry Operations",
    description: "",
    amount: "",
    supplier: "",
    paymentMethod: "Cash",
  });

  // Calculate key metrics with null checks
  const currentMonth =
    monthlyFinancialData.length > 0
      ? monthlyFinancialData[monthlyFinancialData.length - 1]
      : null;
  const previousMonth =
    monthlyFinancialData.length > 1
      ? monthlyFinancialData[monthlyFinancialData.length - 2]
      : null;

  const offeringsGrowth =
    currentMonth && previousMonth && previousMonth.offerings > 0
      ? (
          ((currentMonth.offerings - previousMonth.offerings) /
            previousMonth.offerings) *
          100
        ).toFixed(1)
      : "0.0";

  const memberGrowth =
    membershipGrowthData.length > 1
      ? (
          ((membershipGrowthData[membershipGrowthData.length - 1].newMembers -
            membershipGrowthData[membershipGrowthData.length - 2].newMembers) /
            (membershipGrowthData[membershipGrowthData.length - 2].newMembers ||
              1)) *
          100
        ).toFixed(1)
      : "0.0";

  // Safe data access
  const currentOfferings = currentMonth?.offerings || 0;
  const currentTithes = currentMonth?.tithes || 0;
  const currentExpenses = currentMonth?.expenses || 0;
  const currentWelfare = currentMonth?.welfare || 0;

  // Role-based dashboard filtering
  const getVisibleMetrics = () => {
    switch (user?.role) {
      case "Finance Officer":
        return ["financial"];
      case "HR Officer":
        return ["hr", "members"];
      case "User":
        return ["basic", "events"];
      case "Admin":
        return ["financial", "members", "hr", "events", "system"];
      default:
        return ["basic"];
    }
  };

  const visibleMetrics = getVisibleMetrics();

  // Get authorized modules for data source indicator
  const getAuthorizedModules = () => {
    const modules = [];
    if (user?.permissions?.finance || user?.role === "Finance Officer")
      modules.push("Finance");
    if (user?.permissions?.hr || user?.role === "HR Officer")
      modules.push("HR");
    if (user?.permissions?.members || user?.role === "Admin")
      modules.push("Members");
    if (user?.permissions?.inventory) modules.push("Inventory");
    if (user?.permissions?.welfare) modules.push("Welfare");
    if (user?.permissions?.events) modules.push("Events");
    return modules;
  };

  const authorizedModules = getAuthorizedModules();

  // Working Export functions
  const exportDashboardData = (format: "pdf" | "excel") => {
    if (format === "excel") {
      try {
        const dashboardData = {
          "Financial Summary": [
            {
              Metric: "Monthly Offerings",
              Value: `KSH ${currentMonth.offerings.toLocaleString()}`,
            },
            {
              Metric: "Monthly Tithes",
              Value: `KSH ${currentMonth.tithes.toLocaleString()}`,
            },
            {
              Metric: "New Members",
              Value: membershipGrowthData[5].newMembers,
            },
            {
              Metric: "Welfare Donations",
              Value: `KSH ${currentMonth.welfare.toLocaleString()}`,
            },
          ],
          "Monthly Trends": monthlyFinancialData,
          "Offering Distribution": offeringTypeData,
          "Membership Growth": membershipGrowthData,
        };

        const workbook = XLSX.utils.book_new();

        // Add each sheet
        Object.entries(dashboardData).forEach(([sheetName, data]) => {
          const worksheet = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });

        // Add church branding header
        XLSX.writeFile(
          workbook,
          `TSOAM_Dashboard_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
        );
        return true;
      } catch (error) {
        console.error("Excel export error:", error);
        alert("Export failed. Please try again.");
        return false;
      }
    } else {
      // PDF export using print
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>TSOAM Dashboard Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .church-name { color: #8B4513; font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #8B4513; color: white; }
              </style>
            </head>
            <body>
              <div class="church-name">TSOAM CHURCH INTERNATIONAL</div>
              <div class="header">
                <h2>Dashboard Report</h2>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
              </div>
              <h3>Financial Summary</h3>
              <table>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Monthly Offerings</td><td>KSH ${currentMonth.offerings.toLocaleString()}</td></tr>
                <tr><td>Monthly Tithes</td><td>KSH ${currentMonth.tithes.toLocaleString()}</td></tr>
                <tr><td>New Members</td><td>${membershipGrowthData[5].newMembers}</td></tr>
                <tr><td>Welfare Donations</td><td>KSH ${currentMonth.welfare.toLocaleString()}</td></tr>
              </table>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  // Quick Action Functions
  const handleQuickOffering = () => {
    if (!quickOffering.amount || !quickOffering.preacher) {
      alert("Please fill in all required fields");
      return;
    }

    // Save to localStorage for the Finance module to pick up
    const offering = {
      id: `TXN-${Date.now()}`,
      type: "Income",
      category: quickOffering.type,
      subcategory: quickOffering.service,
      amount: parseFloat(quickOffering.amount),
      paymentMethod: quickOffering.paymentMethod,
      preacher: quickOffering.preacher,
      date: new Date().toISOString().split("T")[0],
      status: "Completed",
      timestamp: new Date().toISOString(),
    };

    const existingData = localStorage.getItem("tsoam-finance-data");
    if (existingData) {
      const data = JSON.parse(existingData);
      data.transactions.unshift(offering);
      localStorage.setItem("tsoam-finance-data", JSON.stringify(data));
    }

    setQuickOffering({
      type: "Normal Offering",
      service: "Main Service",
      amount: "",
      paymentMethod: "Cash",
      preacher: "",
    });
    setIsOfferingDialogOpen(false);
    alert("Offering recorded successfully!");
  };

  const handleQuickMember = () => {
    if (!quickMember.name || !quickMember.phone) {
      alert("Please fill in all required fields");
      return;
    }

    // Navigate to New Members page
    setIsMemberDialogOpen(false);
    navigate("/new-members");
  };

  const handleQuickEvent = () => {
    if (!quickEvent.title || !quickEvent.date) {
      alert("Please fill in all required fields");
      return;
    }

    // Navigate to Events page
    setIsEventDialogOpen(false);
    navigate("/events");
  };

  const handleQuickExpense = () => {
    if (!quickExpense.description || !quickExpense.amount) {
      alert("Please fill in all required fields");
      return;
    }

    // Record expense in Finance module (requires approval if > 1000)
    financialTransactionService.addTransaction({
      date: new Date().toISOString().split("T")[0],
      type: "Expense",
      category: quickExpense.category || "General",
      description: quickExpense.description,
      amount: parseFloat(quickExpense.amount),
      currency: "KSH",
      paymentMethod: (quickExpense.paymentMethod || "Cash") as
        | "Cash"
        | "M-Pesa"
        | "Bank Transfer"
        | "Cheque",
      reference: `DASH-${Date.now()}`,
      module: "Finance",
      status: "Completed", // Dashboard expenses are pre-approved
      createdBy: user?.name || "Dashboard User",
      requestedBy: user?.name || "Dashboard User",
      requiresApproval: false,
    });

    alert(
      `✅ Expense recorded successfully!\n\nAmount: KSh ${parseFloat(quickExpense.amount).toLocaleString()}\nDescription: ${quickExpense.description}\n\nTransaction has been added to Finance module.`,
    );

    // Reset form and close dialog
    setQuickExpense({
      description: "",
      amount: "",
      category: "Office Supplies",
      supplier: "",
      paymentMethod: "Cash",
    });
    setIsExpenseDialogOpen(false);
  };

  const generateReport = (reportType: string) => {
    switch (reportType) {
      case "Financial":
        navigate("/finance");
        break;
      case "Payroll":
        navigate("/hr");
        break;
      case "Member":
        navigate("/members");
        break;
      case "Event":
        navigate("/events");
        break;
      default:
        console.log(`Generating ${reportType} report`);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.name} - ${user?.role}`}
        actions={
          <>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => exportDashboardData("pdf")}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </>
        }
      />

      {/* Real-time Data Source Indicator */}
      {authorizedModules.length > 0 && (
        <Card className="mb-6 border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Live Data Sources</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Dashboard syncing with authorized modules
                </div>
              </div>
              <div className="flex items-center gap-2">
                {authorizedModules.map((module) => (
                  <Badge
                    key={module}
                    variant="outline"
                    className={`text-xs ${
                      module === "Finance"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : module === "HR"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : module === "Members"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : module === "Inventory"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : module === "Welfare"
                                ? "bg-pink-50 text-pink-700 border-pink-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {module}
                  </Badge>
                ))}
                <span className="text-xs text-muted-foreground ml-2">
                  {financialSummary.transactionCount} transactions
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Performance Indicators */}
      {(visibleMetrics.includes("financial") ||
        visibleMetrics.includes("basic")) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {visibleMetrics.includes("financial") && (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        KSH {currentOfferings.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Monthly Offerings
                      </div>
                      <div className="flex items-center text-xs mt-1">
                        {parseFloat(offeringsGrowth) > 0 ? (
                          <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
                        )}
                        <span
                          className={
                            parseFloat(offeringsGrowth) > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {offeringsGrowth}%
                        </span>
                      </div>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        KSH {currentTithes.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Monthly Tithes
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Target: KSH 250,000
                      </div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {(visibleMetrics.includes("members") ||
            visibleMetrics.includes("basic")) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {membershipGrowthData[5].newMembers}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      New Members
                    </div>
                    <div className="flex items-center text-xs mt-1">
                      <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-green-600">{memberGrowth}%</span>
                    </div>
                  </div>
                  <UserPlus className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {visibleMetrics.includes("basic") && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {new Date().toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Today's Date
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Church Management System
                    </div>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {(visibleMetrics.includes("financial") ||
            visibleMetrics.includes("hr")) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      KSH {currentMonth.welfare.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Welfare Support
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      15 beneficiaries
                    </div>
                  </div>
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Financial Overview Charts */}
      {visibleMetrics.includes("financial") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Financial Trends (6 Months)
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportDashboardData("excel")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyFinancialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `KSH ${Number(value).toLocaleString()}`,
                      "",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="offerings"
                    stackId="1"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="tithes"
                    stackId="1"
                    stroke="#06B6D4"
                    fill="#06B6D4"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="welfare"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Offering Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={offeringTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {offeringTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value}% (KSH ${props.payload.amount.toLocaleString()})`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Membership Growth Analysis */}
      {visibleMetrics.includes("members") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Membership Growth Analysis
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateReport("Membership")}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Report
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={membershipGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="newMembers"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  name="New Members"
                />
                <Line
                  type="monotone"
                  dataKey="totalVisitors"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Visitors"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* HR and Payroll Overview */}
      {visibleMetrics.includes("hr") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar
                    yAxisId="left"
                    dataKey="employees"
                    fill="#8B5CF6"
                    name="Employees"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="budget"
                    fill="#06B6D4"
                    name="Monthly Budget (KSH)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leave Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leaveData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="type" type="category" />
                  <Tooltip />
                  <Bar dataKey="taken" fill="#EF4444" name="Days Taken" />
                  <Bar
                    dataKey="available"
                    fill="#10B981"
                    name="Days Available"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {visibleMetrics.includes("financial") && (
                <>
                  <Dialog
                    open={isOfferingDialogOpen}
                    onOpenChange={setIsOfferingDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="p-4 h-auto flex-col space-y-2">
                        <DollarSign className="h-6 w-6" />
                        <span>Record Offering</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Quick Offering Entry</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="offeringType">Offering Type</Label>
                          <Select
                            value={quickOffering.type}
                            onValueChange={(value) =>
                              setQuickOffering({
                                ...quickOffering,
                                type: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Normal Offering">
                                Normal Offering
                              </SelectItem>
                              <SelectItem value="Tithe">Tithe</SelectItem>
                              <SelectItem value="Thanksgiving Offering">
                                Thanksgiving
                              </SelectItem>
                              <SelectItem value="Prophetic Seed">
                                Prophetic Seed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="service">Service Type</Label>
                          <Select
                            value={quickOffering.service}
                            onValueChange={(value) =>
                              setQuickOffering({
                                ...quickOffering,
                                service: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Main Service">
                                Main Service
                              </SelectItem>
                              <SelectItem value="Mid-week Service">
                                Mid-week Service
                              </SelectItem>
                              <SelectItem value="Youth Service">
                                Youth Service
                              </SelectItem>
                              <SelectItem value="Prayer Meeting">
                                Prayer Meeting
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="amount">Amount (KSH)</Label>
                          <Input
                            type="number"
                            value={quickOffering.amount}
                            onChange={(e) =>
                              setQuickOffering({
                                ...quickOffering,
                                amount: e.target.value,
                              })
                            }
                            onFocus={(e) => {
                              if (
                                e.target.value === "0" ||
                                e.target.value === "0.00"
                              ) {
                                setQuickOffering({
                                  ...quickOffering,
                                  amount: "",
                                });
                              }
                            }}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="preacher">Preacher</Label>
                          <Input
                            value={quickOffering.preacher}
                            onChange={(e) =>
                              setQuickOffering({
                                ...quickOffering,
                                preacher: e.target.value,
                              })
                            }
                            placeholder="Pastor name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="paymentMethod">Payment Method</Label>
                          <Select
                            value={quickOffering.paymentMethod}
                            onValueChange={(value) =>
                              setQuickOffering({
                                ...quickOffering,
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
                        <div className="flex gap-2">
                          <Button
                            onClick={handleQuickOffering}
                            className="flex-1"
                          >
                            Record
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsOfferingDialogOpen(false)}
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
                      <Button
                        variant="outline"
                        className="p-4 h-auto flex-col space-y-2"
                      >
                        <Receipt className="h-6 w-6" />
                        <span>Record Expense</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Quick Expense Entry</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={quickExpense.category}
                            onValueChange={(value) =>
                              setQuickExpense({
                                ...quickExpense,
                                category: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ministry Operations">
                                Ministry Operations
                              </SelectItem>
                              <SelectItem value="Facility Management">
                                Facility Management
                              </SelectItem>
                              <SelectItem value="Administrative">
                                Administrative
                              </SelectItem>
                              <SelectItem value="Personnel">
                                Personnel
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Input
                            value={quickExpense.description}
                            onChange={(e) =>
                              setQuickExpense({
                                ...quickExpense,
                                description: e.target.value,
                              })
                            }
                            placeholder="Expense description"
                          />
                        </div>
                        <div>
                          <Label htmlFor="amount">Amount (KSH)</Label>
                          <Input
                            type="number"
                            value={quickExpense.amount}
                            onChange={(e) =>
                              setQuickExpense({
                                ...quickExpense,
                                amount: e.target.value,
                              })
                            }
                            onFocus={(e) => {
                              if (
                                e.target.value === "0" ||
                                e.target.value === "0.00"
                              ) {
                                setQuickExpense({
                                  ...quickExpense,
                                  amount: "",
                                });
                              }
                            }}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="supplier">Supplier</Label>
                          <Input
                            value={quickExpense.supplier}
                            onChange={(e) =>
                              setQuickExpense({
                                ...quickExpense,
                                supplier: e.target.value,
                              })
                            }
                            placeholder="Supplier/vendor name"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleQuickExpense}
                            className="flex-1"
                          >
                            Record & Go to Finance
                          </Button>
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
              )}

              {visibleMetrics.includes("members") && (
                <Dialog
                  open={isMemberDialogOpen}
                  onOpenChange={setIsMemberDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="p-4 h-auto flex-col space-y-2"
                    >
                      <UserPlus className="h-6 w-6" />
                      <span>Add Member</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Quick Member Registration</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          value={quickMember.name}
                          onChange={(e) =>
                            setQuickMember({
                              ...quickMember,
                              name: e.target.value,
                            })
                          }
                          placeholder="Member full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          value={quickMember.phone}
                          onChange={(e) =>
                            setQuickMember({
                              ...quickMember,
                              phone: e.target.value,
                            })
                          }
                          placeholder="+254 700 123456"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                          value={quickMember.email}
                          onChange={(e) =>
                            setQuickMember({
                              ...quickMember,
                              email: e.target.value,
                            })
                          }
                          placeholder="member@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="purpose">Membership Type</Label>
                        <Select
                          value={quickMember.purpose}
                          onValueChange={(value) =>
                            setQuickMember({ ...quickMember, purpose: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Regular Membership">
                              Regular Membership
                            </SelectItem>
                            <SelectItem value="Visitor Registration">
                              Visitor Registration
                            </SelectItem>
                            <SelectItem value="Youth Membership">
                              Youth Membership
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleQuickMember} className="flex-1">
                          Continue Registration
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsMemberDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Dialog
                open={isEventDialogOpen}
                onOpenChange={setIsEventDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="p-4 h-auto flex-col space-y-2"
                  >
                    <CalendarPlus className="h-6 w-6" />
                    <span>Create Event</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Quick Event Creation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Event Title</Label>
                      <Input
                        value={quickEvent.title}
                        onChange={(e) =>
                          setQuickEvent({
                            ...quickEvent,
                            title: e.target.value,
                          })
                        }
                        placeholder="Event name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          type="date"
                          value={quickEvent.date}
                          onChange={(e) =>
                            setQuickEvent({
                              ...quickEvent,
                              date: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          type="time"
                          value={quickEvent.time}
                          onChange={(e) =>
                            setQuickEvent({
                              ...quickEvent,
                              time: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        value={quickEvent.location}
                        onChange={(e) =>
                          setQuickEvent({
                            ...quickEvent,
                            location: e.target.value,
                          })
                        }
                        placeholder="Event location"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        value={quickEvent.description}
                        onChange={(e) =>
                          setQuickEvent({
                            ...quickEvent,
                            description: e.target.value,
                          })
                        }
                        placeholder="Event description"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleQuickEvent} className="flex-1">
                        Create & Edit Event
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEventDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-border pb-3">
                <div>
                  <p className="text-sm font-medium">New member registration</p>
                  <p className="text-xs text-muted-foreground">
                    Sarah Wanjiku joined the church
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">New</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    2 hours ago
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-start border-b border-border pb-3">
                <div>
                  <p className="text-sm font-medium">Offering recorded</p>
                  <p className="text-xs text-muted-foreground">
                    Sunday service - KSH 45,000
                  </p>
                </div>
                <div className="text-right">
                  <Badge>Financial</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    3 hours ago
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-start border-b border-border pb-3">
                <div>
                  <p className="text-sm font-medium">
                    Employee payroll processed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Monthly payroll for 20 employees
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">HR</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    5 hours ago
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">System backup completed</p>
                  <p className="text-xs text-muted-foreground">
                    Automated daily backup successful
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">System</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    1 day ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      {user?.role === "Admin" && (
        <Card>
          <CardHeader>
            <CardTitle>System Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-600">99.9%</div>
                <div className="text-sm text-blue-600">Uptime</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Target className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">1,247</div>
                <div className="text-sm text-green-600">Active Users</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Building className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <div className="text-2xl font-bold text-yellow-600">
                  245.3 MB
                </div>
                <div className="text-sm text-yellow-600">Database Size</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-purple-600">2,156</div>
                <div className="text-sm text-purple-600">
                  Total Transactions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}
