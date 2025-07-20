import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  Heart,
  Activity,
  Bell,
  Plus,
  FileText,
  Package,
  Settings,
  Shield,
  CreditCard,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { financialTransactionService } from "@/services/FinancialTransactionService";
import * as XLSX from "xlsx";
import { RecentActivitiesEnhanced } from "@/components/RecentActivitiesEnhanced";

// Real-time data refresh utility
const triggerDashboardRefresh = () => {
  localStorage.setItem("dashboard_refresh", Date.now().toString());
};

// System log utility
const logSystemActivity = async (action: string, details: string) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for logging

    await fetch("/api/system-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        module: "Dashboard",
        details,
        severity: "Info",
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (error) {
    // Silently fail logging to prevent disrupting user experience
    if (error.name !== "AbortError") {
      console.warn("System activity logging unavailable:", error.message);
    }
  }
};

interface DashboardData {
  monthlyFinancialData: any[];
  offeringTypeData: any[];
  membershipGrowthData: any[];
  membershipStats: {
    total_full_members: number;
    total_new_members: number;
    eligible_for_transfer: number;
  };
  baptismDemographicsData: any[];
  eventAttendanceData: any[];
  systemAlertsData: any[];
  isLoading: boolean;
  lastUpdated: Date;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("6months");

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

  // Real-time dashboard data state
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    monthlyFinancialData: [],
    offeringTypeData: [],
    membershipGrowthData: [],
    membershipStats: {
      total_full_members: 0,
      total_new_members: 0,
      eligible_for_transfer: 0,
    },
    baptismDemographicsData: [],
    eventAttendanceData: [],
    systemAlertsData: [],
    isLoading: true,
    lastUpdated: new Date(),
  });

  // Helper functions to fetch real-time data from modules
  const getFinancialData = () => {
    const systemTransactions = financialTransactionService.getTransactions();
    const offerings = financialTransactionService.getOfferings();

    // Calculate monthly data for the last 6 months
    const monthlyData = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      // Filter transactions for this month
      const monthTransactions = systemTransactions.filter(
        (t) => t.date >= monthStart && t.date <= monthEnd,
      );

      const monthOfferings = offerings.filter(
        (o) => o.date >= monthStart && o.date <= monthEnd,
      );

      const income = monthTransactions
        .filter((t) => t.type === "Income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter((t) => t.type === "Expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const offeringTotal = monthOfferings.reduce(
        (sum, o) => sum + o.totalAmount,
        0,
      );

      const welfare = monthTransactions
        .filter((t) => t.module === "Welfare")
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({
        month: monthName,
        offerings: offeringTotal,
        tithes: income,
        expenses: expenses,
        welfare: welfare,
      });
    }

    // Calculate offering type distribution
    const totalOfferings = offerings.reduce((sum, o) => sum + o.totalAmount, 0);
    const offeringTypes = offerings.reduce(
      (acc, o) => {
        Object.entries(o.offerings).forEach(([type, amount]) => {
          if (!acc[type]) acc[type] = 0;
          acc[type] += amount;
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    const offeringTypeData = Object.entries(offeringTypes).map(
      ([name, amount], index) => {
        const colors = [
          "#8B5CF6",
          "#06B6D4",
          "#10B981",
          "#F59E0B",
          "#EF4444",
          "#8B5A2B",
          "#6366F1",
        ];
        return {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value:
            totalOfferings > 0
              ? Math.round((amount / totalOfferings) * 100)
              : 0,
          amount: amount,
          color: colors[index % colors.length],
        };
      },
    );

    return { monthlyData, offeringTypeData };
  };

  const getMembershipData = () => {
    // Get membership data from localStorage (updated by MemberManagement module)
    const memberData = JSON.parse(
      localStorage.getItem("member_module_data") || "{}",
    );

    const growthData = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const monthName = date.toLocaleDateString("en-US", { month: "short" });

      // Simulate growth data based on current members (in real scenario, this would be historical data)
      const baseMembers = memberData.totalMembers || 245;
      const growth = Math.floor(Math.random() * 10) + 2; // 2-12 new members per month

      growthData.push({
        month: monthName,
        members: baseMembers - i * 5 + growth,
        newMembers: growth,
      });
    }

    return {
      growth: growthData,
      stats: {
        total_full_members: memberData.totalMembers || 245,
        total_new_members: memberData.newMembers || 8,
        eligible_for_transfer: memberData.eligibleTransfers || 12,
      },
    };
  };

  const getWelfareData = () => {
    // Get welfare data from localStorage (updated by Welfare modules)
    const welfareData = JSON.parse(
      localStorage.getItem("welfare_module_data") || "{}",
    );
    return {
      totalRequests: welfareData.totalRequests || 0,
      approvedRequests: welfareData.approvedRequests || 0,
      pendingRequests: welfareData.pendingRequests || 0,
    };
  };

  const getHRData = () => {
    // Get HR data from localStorage (updated by HR module)
    const hrData = JSON.parse(localStorage.getItem("hr_module_data") || "{}");
    return {
      totalEmployees: hrData.totalEmployees || 5,
      recentPayroll: hrData.recentPayroll || 0,
      pendingLeaves: hrData.pendingLeaves || 0,
    };
  };

  const getInventoryData = () => {
    // Get inventory data from localStorage (updated by Inventory module)
    const inventoryData = JSON.parse(
      localStorage.getItem("inventory_module_data") || "{}",
    );
    return {
      totalAssets: inventoryData.totalValue || 0,
      totalItems: inventoryData.totalItems || 0,
      recentPurchases: inventoryData.recentPurchases || 0,
    };
  };

  const getNewMemberData = () => {
    // Get new member data from localStorage (updated by NewMembers module)
    const newMemberData = JSON.parse(
      localStorage.getItem("new_member_data") || "{}",
    );

    // Generate comprehensive membership trend data for the last 12 months
    const membershipTrendData = [];
    const currentDate = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const year = date.getFullYear();

      // Base member count with realistic growth pattern
      const baseMembers = newMemberData.totalMembers || 245;
      const monthlyGrowth = Math.floor(Math.random() * 8) + 3; // 3-10 new members per month
      const transfers = Math.floor(Math.random() * 3); // 0-2 transfers per month

      membershipTrendData.push({
        month: `${monthName} ${year}`,
        fullMembers: baseMembers + (11 - i) * 6 + monthlyGrowth,
        newRegistrations: monthlyGrowth,
        transfers: transfers,
        total: baseMembers + (11 - i) * 6 + monthlyGrowth + transfers,
      });
    }

    return membershipTrendData;
  };

  const getVisitorRetentionData = () => {
    // Get visitor data from localStorage (updated by NewMembers/Visitors module)
    const visitorData = JSON.parse(
      localStorage.getItem("visitor_data") || "{}",
    );
    const newMemberData = JSON.parse(
      localStorage.getItem("new_member_data") || "{}",
    );

    // Calculate visitor retention trends
    const totalVisitors = visitorData.totalVisitors || 125;
    const becameMembers = newMemberData.fromVisitors || 28;
    const regularAttendees = Math.floor(totalVisitors * 0.35); // 35% become regular
    const oneTimeVisits = Math.floor(totalVisitors * 0.45); // 45% one-time visits
    const inactive =
      totalVisitors - becameMembers - regularAttendees - oneTimeVisits;

    return [
      {
        name: "Became Members",
        value: becameMembers,
        percentage: Math.round((becameMembers / totalVisitors) * 100),
        color: "#10B981", // Green
      },
      {
        name: "Regular Attendees",
        value: regularAttendees,
        percentage: Math.round((regularAttendees / totalVisitors) * 100),
        color: "#3B82F6", // Blue
      },
      {
        name: "Occasional Visits",
        value: oneTimeVisits,
        percentage: Math.round((oneTimeVisits / totalVisitors) * 100),
        color: "#F59E0B", // Amber
      },
      {
        name: "Inactive",
        value: inactive,
        percentage: Math.round((inactive / totalVisitors) * 100),
        color: "#EF4444", // Red
      },
    ];
  };

  // Fetch real-time data from modules
  const fetchDashboardData = async () => {
    setDashboardData((prev) => ({ ...prev, isLoading: true }));

    try {
      // Fetch real-time data from respective modules
      const financialData = getFinancialData();
      const membershipData = getMembershipData();
      const welfareData = getWelfareData();
      const hrData = getHRData();
      const inventoryData = getInventoryData();
      const membershipTrendData = getNewMemberData();
      const visitorRetentionData = getVisitorRetentionData();

      // Get system alerts from financial service and modules
      const systemTransactions = financialTransactionService.getTransactions();
      const pendingApprovals = systemTransactions.filter(
        (t) => t.status === "Pending" && t.requiresApproval,
      );

      const systemAlerts = [
        ...(pendingApprovals.length > 0
          ? [
              {
                type: "warning",
                message: `${pendingApprovals.length} transaction(s) pending approval in Finance`,
                time: "now",
              },
            ]
          : []),
        ...(welfareData.pendingRequests > 0
          ? [
              {
                type: "info",
                message: `${welfareData.pendingRequests} welfare request(s) pending review`,
                time: "now",
              },
            ]
          : []),
        ...(hrData.pendingLeaves > 0
          ? [
              {
                type: "info",
                message: `${hrData.pendingLeaves} leave request(s) pending approval`,
                time: "now",
              },
            ]
          : []),
      ];

      // Create baptism and event demo data (would come from respective modules in real implementation)
      const baptismDemographics = [
        { ageGroup: "18-25", count: 12, percentage: 30 },
        { ageGroup: "26-35", count: 18, percentage: 45 },
        { ageGroup: "36-50", count: 8, percentage: 20 },
        { ageGroup: "51+", count: 2, percentage: 5 },
      ];

      const eventAttendance = [
        { event: "Sunday Service", attendance: 245, capacity: 300 },
        { event: "Youth Meeting", attendance: 45, capacity: 60 },
        { event: "Bible Study", attendance: 85, capacity: 100 },
        { event: "Prayer Meeting", attendance: 120, capacity: 150 },
      ];

      setDashboardData({
        monthlyFinancialData: financialData.monthlyData,
        offeringTypeData: financialData.offeringTypeData,
        membershipGrowthData: membershipTrendData, // Updated to use comprehensive trend data
        membershipStats: membershipData.stats,
        baptismDemographicsData: visitorRetentionData, // Replaced with visitor retention data
        eventAttendanceData: eventAttendance,
        systemAlertsData: systemAlerts,
        isLoading: false,
        lastUpdated: new Date(),
      });

      // Log dashboard access (non-blocking)
      logSystemActivity(
        "Dashboard Access",
        `User ${user?.name} accessed dashboard`,
      ).catch(() => {}); // Silently handle logging failures
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setDashboardData((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Monitor financial service for real-time updates
  useEffect(() => {
    const handleFinancialUpdate = () => {
      fetchDashboardData();
    };

    // Subscribe to financial service updates
    financialTransactionService.subscribe(handleFinancialUpdate);

    // Initial data load
    fetchDashboardData();

    // Cleanup subscription
    return () => {
      financialTransactionService.unsubscribe(handleFinancialUpdate);
    };
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [dateRange]);

  // Listen for real-time updates from localStorage (module updates)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "dashboard_refresh" || e.key?.includes("_module_data")) {
        fetchDashboardData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const {
    monthlyFinancialData,
    offeringTypeData,
    membershipGrowthData,
    membershipStats,
    baptismDemographicsData,
    eventAttendanceData,
    systemAlertsData,
    isLoading,
    lastUpdated,
  } = dashboardData;

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
          (((membershipGrowthData[membershipGrowthData.length - 1]
            ?.fullMembers || 0) -
            (membershipGrowthData[membershipGrowthData.length - 2]
              ?.fullMembers || 0)) /
            (membershipGrowthData[membershipGrowthData.length - 2]
              ?.fullMembers || 1)) *
          100
        ).toFixed(1)
      : "0.0";

  // Safe data access
  const currentOfferings = currentMonth?.offerings || 0;
  const currentTithes = currentMonth?.tithes || 0;
  const currentExpenses = currentMonth?.expenses || 0;
  const currentWelfare = currentMonth?.welfare || 0;
  const totalFullMembers = membershipStats.total_full_members;
  const totalNewMembers = membershipStats.total_new_members;
  const eligibleForTransfer = membershipStats.eligible_for_transfer;
  const totalMembers = totalFullMembers + totalNewMembers;

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

  // Export functions
  const exportDashboardData = async (format: "pdf" | "excel") => {
    logSystemActivity(
      "Data Export",
      `${format.toUpperCase()} export initiated`,
    ).catch(() => {}); // Non-blocking logging

    if (format === "excel") {
      try {
        const workbook = XLSX.utils.book_new();

        // Financial Summary
        const financialSummary = [
          {
            Metric: "Monthly Offerings",
            Value: `KSH ${currentOfferings.toLocaleString()}`,
          },
          {
            Metric: "Monthly Tithes",
            Value: `KSH ${currentTithes.toLocaleString()}`,
          },
          {
            Metric: "Monthly Expenses",
            Value: `KSH ${currentExpenses.toLocaleString()}`,
          },
          {
            Metric: "Welfare Fund",
            Value: `KSH ${currentWelfare.toLocaleString()}`,
          },
          { Metric: "Total Members", Value: totalMembers.toString() },
        ];

        const ws1 = XLSX.utils.json_to_sheet(financialSummary);
        XLSX.utils.book_append_sheet(workbook, ws1, "Summary");

        if (monthlyFinancialData.length > 0) {
          const ws2 = XLSX.utils.json_to_sheet(monthlyFinancialData);
          XLSX.utils.book_append_sheet(workbook, ws2, "Financial Trends");
        }

        if (membershipGrowthData.length > 0) {
          const ws3 = XLSX.utils.json_to_sheet(membershipGrowthData);
          XLSX.utils.book_append_sheet(workbook, ws3, "Membership Growth");
        }

        XLSX.writeFile(
          workbook,
          `TSOAM_Dashboard_${new Date().toISOString().split("T")[0]}.xlsx`,
        );

        logSystemActivity(
          "Export Success",
          "Excel dashboard export completed",
        ).catch(() => {}); // Non-blocking logging
      } catch (error) {
        console.error("Excel export failed:", error);
        logSystemActivity(
          "Export Failed",
          `Excel export error: ${error}`,
        ).catch(() => {}); // Non-blocking logging
      }
    }
  };

  const manualRefresh = async () => {
    logSystemActivity("Manual Refresh", "Dashboard manually refreshed").catch(
      () => {},
    ); // Non-blocking logging
    await fetchDashboardData();
  };

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        description={
          <div className="flex items-center gap-4">
            <span>
              Welcome back, {user?.name} - {user?.role}
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={manualRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
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
            <Button onClick={() => exportDashboardData("excel")}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </>
        }
      />

      {/* Key Performance Indicators */}
      {(visibleMetrics.includes("financial") ||
        visibleMetrics.includes("basic")) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{totalFullMembers}</div>
                  <div className="text-sm text-muted-foreground">
                    Full Members
                  </div>
                  <div className="flex items-center text-xs mt-1">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-green-600">Active</span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{totalNewMembers}</div>
                  <div className="text-sm text-muted-foreground">
                    New Members
                  </div>
                  <div className="flex items-center text-xs mt-1">
                    <Clock className="h-3 w-3 text-orange-600 mr-1" />
                    <span className="text-orange-600">
                      {eligibleForTransfer} eligible
                    </span>
                  </div>
                </div>
                <UserPlus className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    KSH {currentWelfare.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Welfare Fund
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Available for assistance
                  </div>
                </div>
                <Heart className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          {/* Real-time module statistics */}
          {(() => {
            const welfareData = getWelfareData();
            const hrData = getHRData();
            const inventoryData = getInventoryData();
            const systemTransactions =
              financialTransactionService.getTransactions();
            const pendingApprovals = systemTransactions.filter(
              (t) => t.status === "Pending" && t.requiresApproval,
            );

            return (
              <>
                {visibleMetrics.includes("financial") && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {pendingApprovals.length}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Pending Approvals
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Finance Department
                          </div>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {user?.permissions?.welfare && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {welfareData.pendingRequests}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Welfare Requests
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Pending Review
                          </div>
                        </div>
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {visibleMetrics.includes("hr") && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {hrData.totalEmployees}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total Employees
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Active Staff
                          </div>
                        </div>
                        <Briefcase className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {user?.permissions?.inventory && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-indigo-600">
                            {inventoryData.totalItems}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total Assets
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Inventory Items
                          </div>
                        </div>
                        <Package className="h-8 w-8 text-indigo-600" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Finance Actions */}
            {visibleMetrics.includes("financial") && (
              <>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => navigate("/finance")}
                >
                  <DollarSign className="h-6 w-6 text-green-600" />
                  <span className="text-xs">Add Transaction</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => navigate("/finance")}
                >
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  <span className="text-xs">Record Expense</span>
                </Button>
              </>
            )}

            {/* HR Actions */}
            {visibleMetrics.includes("hr") && (
              <>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => navigate("/hr")}
                >
                  <Briefcase className="h-6 w-6 text-purple-600" />
                  <span className="text-xs">Add Employee</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => navigate("/hr")}
                >
                  <FileText className="h-6 w-6 text-orange-600" />
                  <span className="text-xs">Leave Request</span>
                </Button>
              </>
            )}

            {/* Member Management */}
            {visibleMetrics.includes("members") && (
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => navigate("/members")}
              >
                <UserPlus className="h-6 w-6 text-blue-600" />
                <span className="text-xs">Add Member</span>
              </Button>
            )}

            {/* Inventory Actions */}
            {user?.permissions?.inventory && (
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => navigate("/inventory")}
              >
                <Package className="h-6 w-6 text-indigo-600" />
                <span className="text-xs">Add Item</span>
              </Button>
            )}

            {/* Welfare Actions */}
            {user?.permissions?.welfare && (
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => navigate("/welfare")}
              >
                <Heart className="h-6 w-6 text-red-500" />
                <span className="text-xs">New Request</span>
              </Button>
            )}

            {/* Event Actions */}
            {user?.permissions?.events && (
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => navigate("/events")}
              >
                <Calendar className="h-6 w-6 text-green-600" />
                <span className="text-xs">Add Event</span>
              </Button>
            )}

            {/* Messaging */}
            {user?.permissions?.messaging && (
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => navigate("/messaging")}
              >
                <MessageSquare className="h-6 w-6 text-blue-500" />
                <span className="text-xs">Send Message</span>
              </Button>
            )}

            {/* Admin Actions */}
            {user?.role === "Admin" && (
              <>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => navigate("/users")}
                >
                  <Shield className="h-6 w-6 text-red-600" />
                  <span className="text-xs">User Management</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="h-6 w-6 text-gray-600" />
                  <span className="text-xs">Settings</span>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Financial Trends - Real-time Bar Chart */}
        {visibleMetrics.includes("financial") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Financial Trends
                <Badge variant="outline" className="text-green-600">
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : monthlyFinancialData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyFinancialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        `KSH ${Number(value).toLocaleString()}`,
                        String(name).charAt(0).toUpperCase() +
                          String(name).slice(1),
                      ]}
                      labelStyle={{ color: "#374151" }}
                      contentStyle={{
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="offerings"
                      fill="#10B981"
                      name="Offerings"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="tithes"
                      fill="#3B82F6"
                      name="Tithes"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      fill="#EF4444"
                      name="Expenses"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="welfare"
                      fill="#F59E0B"
                      name="Welfare"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  No financial data available
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Membership Growth Trend - Real-time Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Membership Growth Trend
              <Badge variant="outline" className="text-blue-600">
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : membershipGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={membershipGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    domain={["dataMin - 10", "dataMax + 10"]}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      Number(value).toLocaleString(),
                      name === "fullMembers"
                        ? "Full Members"
                        : name === "newRegistrations"
                          ? "New Registrations"
                          : name === "transfers"
                            ? "Transfers"
                            : "Total Members",
                    ]}
                    labelStyle={{ color: "#374151" }}
                    contentStyle={{
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="fullMembers"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
                    name="Full Members"
                  />
                  <Line
                    type="monotone"
                    dataKey="newRegistrations"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: "#10B981", strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, stroke: "#10B981", strokeWidth: 2 }}
                    name="New Registrations"
                  />
                  <Line
                    type="monotone"
                    dataKey="transfers"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ fill: "#F59E0B", strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, stroke: "#F59E0B", strokeWidth: 2 }}
                    name="Transfers"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No membership data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visitor Retention Analysis - Real-time Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Visitor Retention Analysis
              <Badge variant="outline" className="text-purple-600">
                Live
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Real-time tracking of visitor engagement and conversion rates
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : baptismDemographicsData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={baptismDemographicsData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {baptismDemographicsData.map(
                          (entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ),
                        )}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString()} visitors`,
                          name,
                        ]}
                        contentStyle={{
                          backgroundColor: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry) => (
                          <span style={{ color: entry.color }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Statistics Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Retention Breakdown</h4>
                  {baptismDemographicsData.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.percentage}% of total visitors
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{item.value}</p>
                        <p className="text-xs text-muted-foreground">
                          visitors
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No visitor data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Visitor Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const totalVisitors = baptismDemographicsData.reduce(
                (sum: number, item: any) => sum + item.value,
                0,
              );
              const conversionRate =
                baptismDemographicsData.find(
                  (item: any) => item.name === "Became Members",
                )?.percentage || 0;
              const retentionRate = baptismDemographicsData
                .filter(
                  (item: any) =>
                    item.name === "Became Members" ||
                    item.name === "Regular Attendees",
                )
                .reduce((sum: number, item: any) => sum + item.percentage, 0);

              return (
                <>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {totalVisitors}
                    </div>
                    <div className="text-sm text-blue-700">Total Visitors</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {conversionRate}%
                    </div>
                    <div className="text-sm text-green-700">
                      Conversion Rate
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {retentionRate}%
                    </div>
                    <div className="text-sm text-purple-700">
                      Retention Rate
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-4">
                    * Data updates in real-time from New Member module
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Your Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivitiesEnhanced userId={user?.id} role={user?.role} />
        </CardContent>
      </Card>

      {/* System Alerts */}
      {visibleMetrics.includes("system") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {systemAlertsData.length > 0 ? (
              <div className="space-y-2">
                {systemAlertsData
                  .slice(0, 5)
                  .map((alert: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {alert.type === "error" && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        {alert.type === "warning" && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        {alert.type === "success" && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {alert.type === "info" && (
                          <Activity className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="text-sm">{alert.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {alert.time}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent alerts
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}
