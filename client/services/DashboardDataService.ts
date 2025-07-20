// Dashboard Data Service for TSOAM Church Management System
// Centralizes all dashboard data and provides real-time synchronization

import { financialTransactionService } from "./FinancialTransactionService";
import { settingsService } from "./SettingsService";
import { backupService } from "./BackupService";

export interface DashboardStats {
  members: {
    total: number;
    newThisMonth: number;
    activeMembers: number;
    inactiveMembers: number;
    byAge: { [key: string]: number };
    byGender: { male: number; female: number };
    growth: number; // percentage
  };
  financial: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    monthlyGrowth: number;
    lastOffering: number;
    pendingTransactions: number;
    topExpenseCategories: { category: string; amount: number }[];
  };
  hr: {
    totalEmployees: number;
    newEmployees: number;
    pendingPayroll: number;
    totalPayroll: number;
    departmentBreakdown: { [key: string]: number };
    upcomingBirthdays: number;
  };
  inventory: {
    totalItems: number;
    lowStockItems: number;
    totalValue: number;
    recentPurchases: number;
    maintenanceDue: number;
    disposalsPending: number;
  };
  events: {
    upcomingEvents: number;
    thisWeekEvents: number;
    totalAttendees: number;
    eventTypes: { [key: string]: number };
  };
  welfare: {
    totalApplications: number;
    pendingApplications: number;
    approvedAmount: number;
    rejectedApplications: number;
    monthlyTrend: number;
  };
  system: {
    lastBackup: string | null;
    systemHealth: string;
    pendingUsers: number;
    activeUsers: number;
    storageUsed: number;
    errorCount: number;
  };
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  module: string;
  severity: "info" | "warning" | "error" | "success";
  user?: string;
  amount?: number;
}

export interface QuickStat {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: string;
  color: string;
}

class DashboardDataService {
  private static instance: DashboardDataService;
  private subscribers: Array<(data: DashboardStats) => void> = [];
  private activitySubscribers: Array<(activities: RecentActivity[]) => void> =
    [];
  private cachedStats: DashboardStats | null = null;
  private cachedActivities: RecentActivity[] = [];
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private constructor() {
    this.initializeMockData();
    this.startRealTimeUpdates();
  }

  public static getInstance(): DashboardDataService {
    if (!DashboardDataService.instance) {
      DashboardDataService.instance = new DashboardDataService();
    }
    return DashboardDataService.instance;
  }

  private initializeMockData(): void {
    // Initialize with mock data from localStorage or defaults
    this.loadMockData();
  }

  private loadMockData(): void {
    // Get data from various sources
    const members = this.getMembersData();
    const employees = this.getEmployeesData();
    const inventory = this.getInventoryData();
    const welfare = this.getWelfareData();
    const events = this.getEventsData();
    const financial = financialTransactionService.getFinancialSummary();
    const backupStats = backupService.getBackupStats();
    const systemHealth = backupService.getSystemHealth();

    this.cachedStats = {
      members: {
        total: members.length,
        newThisMonth: members.filter((m) => this.isThisMonth(m.joinDate))
          .length,
        activeMembers: members.filter((m) => m.status === "Active").length,
        inactiveMembers: members.filter((m) => m.status === "Inactive").length,
        byAge: this.groupByAge(members),
        byGender: this.groupByGender(members),
        growth: this.calculateGrowth(members, "joinDate"),
      },
      financial: {
        totalIncome: financial.totalIncome,
        totalExpenses: financial.totalExpenses,
        netIncome: financial.netIncome,
        monthlyGrowth: 12.5, // Mock growth
        lastOffering: this.getLastOfferingAmount(),
        pendingTransactions: 3,
        topExpenseCategories: this.getTopExpenseCategories(),
      },
      hr: {
        totalEmployees: employees.length,
        newEmployees: employees.filter((e) => this.isThisMonth(e.hireDate))
          .length,
        pendingPayroll: 0,
        totalPayroll: employees.reduce((sum, e) => sum + (e.salary || 0), 0),
        departmentBreakdown: this.groupByDepartment(employees),
        upcomingBirthdays: this.getUpcomingBirthdays(employees),
      },
      inventory: {
        totalItems: inventory.length,
        lowStockItems: inventory.filter((i) => i.status === "Low Stock").length,
        totalValue: inventory.reduce(
          (sum, i) => sum + (i.currentValue || 0),
          0,
        ),
        recentPurchases: inventory.filter((i) =>
          this.isThisMonth(i.purchaseDate),
        ).length,
        maintenanceDue: 2,
        disposalsPending: 1,
      },
      events: {
        upcomingEvents: events.filter((e) => new Date(e.date) > new Date())
          .length,
        thisWeekEvents: events.filter((e) => this.isThisWeek(e.date)).length,
        totalAttendees: events.reduce(
          (sum, e) => sum + (e.expectedAttendance || 0),
          0,
        ),
        eventTypes: this.groupByEventType(events),
      },
      welfare: {
        totalApplications: welfare.length,
        pendingApplications: welfare.filter((w) => w.status === "Pending")
          .length,
        approvedAmount: welfare
          .filter((w) => w.status === "Approved")
          .reduce((sum, w) => sum + (w.requestedAmount || 0), 0),
        rejectedApplications: welfare.filter((w) => w.status === "Rejected")
          .length,
        monthlyTrend: 8.3,
      },
      system: {
        lastBackup: backupStats.lastBackupDate,
        systemHealth: systemHealth.status,
        pendingUsers: this.getPendingUsersCount(),
        activeUsers: this.getActiveUsersCount(),
        storageUsed: 67.5, // Mock percentage
        errorCount: systemHealth.issues.length,
      },
    };

    this.generateRecentActivities();
    this.lastUpdate = Date.now();
  }

  private generateRecentActivities(): void {
    const activities: RecentActivity[] = [];

    // Get recent financial transactions
    const recentTransactions = financialTransactionService
      .getTransactions()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 3);

    recentTransactions.forEach((transaction) => {
      activities.push({
        id: `fin_${transaction.id}`,
        type: "financial",
        title: `${transaction.type}: ${transaction.category}`,
        description: `${transaction.description} - ${settingsService.getCurrency()} ${transaction.amount.toLocaleString()}`,
        timestamp: transaction.createdAt,
        module: "Finance",
        severity: transaction.type === "Income" ? "success" : "info",
        user: transaction.createdBy,
        amount: transaction.amount,
      });
    });

    // Add backup activities
    const lastBackup = backupService.getLastBackup();
    if (lastBackup) {
      activities.push({
        id: `backup_${lastBackup.id}`,
        type: "system",
        title: "System Backup",
        description: `${lastBackup.type} backup completed successfully`,
        timestamp: lastBackup.timestamp,
        module: "System",
        severity: "success",
        user: "System",
      });
    }

    // Add mock activities for other modules
    const mockActivities = [
      {
        id: "member_001",
        type: "member",
        title: "New Member Registered",
        description: "Grace Wanjiku joined as a new member",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        module: "Members",
        severity: "success" as const,
        user: "Reception",
      },
      {
        id: "hr_001",
        type: "hr",
        title: "Payroll Processed",
        description: "Monthly payroll for December 2024 completed",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        module: "HR",
        severity: "info" as const,
        user: "HR Manager",
      },
      {
        id: "inventory_001",
        type: "inventory",
        title: "Low Stock Alert",
        description: "Tissue Papers (TSP001) is running low",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        module: "Inventory",
        severity: "warning" as const,
        user: "System",
      },
      {
        id: "welfare_001",
        type: "welfare",
        title: "Application Approved",
        description: "School fees assistance approved for John Kamau",
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        module: "Welfare",
        severity: "success" as const,
        user: "Welfare Officer",
      },
    ];

    activities.push(...mockActivities);

    // Sort by timestamp (newest first)
    this.cachedActivities = activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10); // Keep only the 10 most recent
  }

  private startRealTimeUpdates(): void {
    // Update data every 30 seconds
    setInterval(() => {
      this.refreshData();
    }, 30000);

    // Listen to financial transaction updates
    financialTransactionService.subscribe(() => {
      this.refreshData();
    });
  }

  public async refreshData(): Promise<void> {
    this.loadMockData();
    this.notifySubscribers();
  }

  public subscribe(callback: (stats: DashboardStats) => void): () => void {
    this.subscribers.push(callback);
    // Immediately call with current data
    if (this.cachedStats) {
      callback(this.cachedStats);
    }
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  }

  public subscribeToActivities(
    callback: (activities: RecentActivity[]) => void,
  ): () => void {
    this.activitySubscribers.push(callback);
    // Immediately call with current data
    callback(this.cachedActivities);
    // Return unsubscribe function
    return () => {
      this.activitySubscribers = this.activitySubscribers.filter(
        (sub) => sub !== callback,
      );
    };
  }

  private notifySubscribers(): void {
    if (this.cachedStats) {
      this.subscribers.forEach((callback) => callback(this.cachedStats!));
    }
    this.activitySubscribers.forEach((callback) =>
      callback(this.cachedActivities),
    );
  }

  public getDashboardStats(): DashboardStats | null {
    const now = Date.now();
    if (!this.cachedStats || now - this.lastUpdate > this.CACHE_DURATION) {
      this.refreshData();
    }
    return this.cachedStats;
  }

  public getRecentActivities(): RecentActivity[] {
    return [...this.cachedActivities];
  }

  public getQuickStats(): QuickStat[] {
    if (!this.cachedStats) return [];

    return [
      {
        label: "Total Members",
        value: this.cachedStats.members.total,
        change: this.cachedStats.members.growth,
        trend: this.cachedStats.members.growth > 0 ? "up" : "down",
        icon: "Users",
        color: "blue",
      },
      {
        label: "Net Income",
        value: `${settingsService.getCurrency()} ${this.cachedStats.financial.netIncome.toLocaleString()}`,
        change: this.cachedStats.financial.monthlyGrowth,
        trend: this.cachedStats.financial.netIncome > 0 ? "up" : "down",
        icon: "DollarSign",
        color: "green",
      },
      {
        label: "Total Employees",
        value: this.cachedStats.hr.totalEmployees,
        change: this.cachedStats.hr.newEmployees,
        trend: this.cachedStats.hr.newEmployees > 0 ? "up" : "neutral",
        icon: "Users",
        color: "purple",
      },
      {
        label: "Pending Applications",
        value: this.cachedStats.welfare.pendingApplications,
        change: this.cachedStats.welfare.monthlyTrend,
        trend: "neutral",
        icon: "FileText",
        color: "orange",
      },
      {
        label: "Low Stock Items",
        value: this.cachedStats.inventory.lowStockItems,
        change: 0,
        trend:
          this.cachedStats.inventory.lowStockItems > 0 ? "down" : "neutral",
        icon: "AlertTriangle",
        color: "red",
      },
      {
        label: "System Health",
        value:
          this.cachedStats.system.systemHealth.charAt(0).toUpperCase() +
          this.cachedStats.system.systemHealth.slice(1),
        change: 0,
        trend:
          this.cachedStats.system.systemHealth === "healthy" ? "up" : "down",
        icon: "Activity",
        color:
          this.cachedStats.system.systemHealth === "healthy" ? "green" : "red",
      },
    ];
  }

  // Helper methods for data processing
  private getMembersData(): any[] {
    try {
      return JSON.parse(localStorage.getItem("church_members") || "[]");
    } catch {
      return [];
    }
  }

  private getEmployeesData(): any[] {
    try {
      return JSON.parse(localStorage.getItem("church_employees") || "[]");
    } catch {
      return [];
    }
  }

  private getInventoryData(): any[] {
    try {
      return JSON.parse(localStorage.getItem("church_inventory") || "[]");
    } catch {
      return [];
    }
  }

  private getWelfareData(): any[] {
    try {
      return JSON.parse(localStorage.getItem("welfare_applications") || "[]");
    } catch {
      return [];
    }
  }

  private getEventsData(): any[] {
    try {
      return JSON.parse(localStorage.getItem("church_events") || "[]");
    } catch {
      return [];
    }
  }

  private getPendingUsersCount(): number {
    try {
      const pending = JSON.parse(localStorage.getItem("pending_users") || "[]");
      return pending.length;
    } catch {
      return 0;
    }
  }

  private getActiveUsersCount(): number {
    try {
      const users = JSON.parse(localStorage.getItem("church_users") || "[]");
      return users.filter((u: any) => u.isActive).length;
    } catch {
      return 5; // Default mock count
    }
  }

  private isThisMonth(dateString: string): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  private isThisWeek(dateString: string): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    return date >= startOfWeek && date <= endOfWeek;
  }

  private calculateGrowth(data: any[], dateField: string): number {
    const thisMonth = data.filter((item) =>
      this.isThisMonth(item[dateField]),
    ).length;
    const lastMonth = data.filter((item) => {
      if (!item[dateField]) return false;
      const date = new Date(item[dateField]);
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      return (
        date.getMonth() === lastMonthDate.getMonth() &&
        date.getFullYear() === lastMonthDate.getFullYear()
      );
    }).length;

    if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
    return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  }

  private groupByAge(members: any[]): { [key: string]: number } {
    const groups = { "18-30": 0, "31-45": 0, "46-60": 0, "60+": 0 };
    members.forEach((member) => {
      if (member.dateOfBirth) {
        const age =
          new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear();
        if (age <= 30) groups["18-30"]++;
        else if (age <= 45) groups["31-45"]++;
        else if (age <= 60) groups["46-60"]++;
        else groups["60+"]++;
      }
    });
    return groups;
  }

  private groupByGender(members: any[]): { male: number; female: number } {
    return members.reduce(
      (acc, member) => {
        if (member.gender === "Male") acc.male++;
        else if (member.gender === "Female") acc.female++;
        return acc;
      },
      { male: 0, female: 0 },
    );
  }

  private groupByDepartment(employees: any[]): { [key: string]: number } {
    return employees.reduce((acc, emp) => {
      const dept = emp.department || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByEventType(events: any[]): { [key: string]: number } {
    return events.reduce((acc, event) => {
      const type = event.type || "General";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }

  private getUpcomingBirthdays(employees: any[]): number {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return employees.filter((emp) => {
      if (!emp.dateOfBirth) return false;
      const birthday = new Date(emp.dateOfBirth);
      birthday.setFullYear(today.getFullYear());
      return birthday >= today && birthday <= nextWeek;
    }).length;
  }

  private getLastOfferingAmount(): number {
    const offerings = financialTransactionService.getOfferings();
    if (offerings.length === 0) return 0;
    return offerings[0].totalAmount;
  }

  private getTopExpenseCategories(): { category: string; amount: number }[] {
    const expenses =
      financialTransactionService.getTransactionsByType("Expense");
    const categoryTotals = expenses.reduce(
      (acc, transaction) => {
        const category = transaction.category;
        acc[category] = (acc[category] || 0) + transaction.amount;
        return acc;
      },
      {} as { [key: string]: number },
    );

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  // Method to add new activity
  public addActivity(activity: Omit<RecentActivity, "id" | "timestamp">): void {
    const newActivity: RecentActivity = {
      ...activity,
      id: `activity_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    this.cachedActivities.unshift(newActivity);
    this.cachedActivities = this.cachedActivities.slice(0, 10); // Keep only 10 most recent

    // Notify activity subscribers
    this.activitySubscribers.forEach((callback) =>
      callback(this.cachedActivities),
    );
  }

  // Role-based data fetching methods for authorized users
  public getRoleBasedData(
    userRole: string,
    userPermissions: any,
  ): DashboardStats | null {
    if (!this.cachedStats) {
      this.refreshData();
    }

    // Apply role-based filtering and fetch real module data
    const roleBasedStats = this.filterStatsForRole(
      this.cachedStats!,
      userRole,
      userPermissions,
    );
    return roleBasedStats;
  }

  private filterStatsForRole(
    stats: DashboardStats,
    userRole: string,
    userPermissions: any,
  ): DashboardStats {
    const filteredStats = { ...stats };

    // Finance Officer - Get real financial data
    if (userPermissions.finance || userRole === "Finance Officer") {
      const realFinancialData =
        financialTransactionService.getFinancialSummary();
      const pendingTransactions =
        financialTransactionService.getPendingTransactions();

      filteredStats.financial = {
        ...filteredStats.financial,
        totalIncome: realFinancialData.totalIncome,
        totalExpenses: realFinancialData.totalExpenses,
        netIncome: realFinancialData.netIncome,
        pendingTransactions: pendingTransactions.length,
        topExpenseCategories: this.getTopExpenseCategories(),
      };
    }

    // HR Officer - Get real HR data from module
    if (userPermissions.hr || userRole === "HR Officer") {
      const hrModuleData = this.getHRModuleRealData();
      filteredStats.hr = {
        ...filteredStats.hr,
        totalEmployees: hrModuleData.totalEmployees,
        pendingPayroll: hrModuleData.pendingPayroll,
        totalPayroll: hrModuleData.totalPayroll,
      };
    }

    // Member management access
    if (userPermissions.members || userRole === "Admin") {
      const memberModuleData = this.getMemberModuleRealData();
      filteredStats.members = {
        ...filteredStats.members,
        total: memberModuleData.total,
        activeMembers: memberModuleData.activeMembers,
        newThisMonth: memberModuleData.newThisMonth,
      };
    }

    // Inventory access
    if (userPermissions.inventory) {
      const inventoryModuleData = this.getInventoryModuleRealData();
      filteredStats.inventory = {
        ...filteredStats.inventory,
        totalItems: inventoryModuleData.totalItems,
        lowStockItems: inventoryModuleData.lowStockItems,
        totalValue: inventoryModuleData.totalValue,
      };
    }

    return filteredStats;
  }

  // Fetch real data from HR module
  private getHRModuleRealData() {
    try {
      const hrData = localStorage.getItem("hr_module_data");
      if (hrData) {
        const parsed = JSON.parse(hrData);
        return {
          totalEmployees: parsed.employees?.length || 0,
          pendingPayroll:
            parsed.payrollRecords?.filter((p: any) => p.status === "Pending")
              .length || 0,
          totalPayroll:
            parsed.payrollRecords?.reduce(
              (sum: number, p: any) => sum + (p.netSalary || 0),
              0,
            ) || 0,
        };
      }
    } catch (error) {
      console.log("HR module data not available, using cached data");
    }
    return { totalEmployees: 0, pendingPayroll: 0, totalPayroll: 0 };
  }

  // Fetch real data from Member module
  private getMemberModuleRealData() {
    try {
      const memberData = localStorage.getItem("member_module_data");
      if (memberData) {
        const parsed = JSON.parse(memberData);
        return {
          total: parsed.members?.length || 0,
          activeMembers:
            parsed.members?.filter((m: any) => m.membershipStatus === "Active")
              .length || 0,
          newThisMonth:
            parsed.members?.filter((m: any) =>
              this.isThisMonth(m.membershipDate),
            ).length || 0,
        };
      }
    } catch (error) {
      console.log("Member module data not available, using cached data");
    }
    return { total: 0, activeMembers: 0, newThisMonth: 0 };
  }

  // Fetch real data from Inventory module
  private getInventoryModuleRealData() {
    try {
      const inventoryData = localStorage.getItem("inventory_module_data");
      if (inventoryData) {
        const parsed = JSON.parse(inventoryData);
        return {
          totalItems: parsed.stockItems?.length || 0,
          lowStockItems:
            parsed.stockItems?.filter(
              (item: any) => item.currentStock <= item.reorderLevel,
            ).length || 0,
          totalValue:
            parsed.stockItems?.reduce(
              (sum: number, item: any) =>
                sum + item.purchasePrice * item.currentStock,
              0,
            ) || 0,
        };
      }
    } catch (error) {
      console.log("Inventory module data not available, using cached data");
    }
    return { totalItems: 0, lowStockItems: 0, totalValue: 0 };
  }
}

// Export singleton instance
export const dashboardDataService = DashboardDataService.getInstance();
