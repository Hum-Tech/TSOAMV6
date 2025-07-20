/**
 * TSOAM Church Management System - Financial Transaction Service
 *
 * This service acts as the central financial hub for the entire church management system.
 * It synchronizes all monetary transactions from different modules into a unified financial view.
 *
 * Core Functionality:
 * - Centralized transaction management across all modules
 * - Real-time financial synchronization
 * - Approval workflow for transactions above threshold
 * - Financial reporting and analytics
 * - Module integration for HR, Inventory, Welfare, and Events
 *
 * Key Features:
 * - Transaction approval workflow (>KSh 1,000 requires approval)
 * - Real-time notifications and updates
 * - Cross-module financial integration
 * - Offering and contribution tracking
 * - Financial summary generation
 *
 * @author TSOAM Development Team
 * @version 2.0.0
 * @since 2024-01-01
 */

/**
 * Interface defining the structure of a financial transaction
 * Used across all modules for consistent financial data handling
 */
export interface FinancialTransaction {
  id: string;
  date: string;
  type: "Income" | "Expense";
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: "Cash" | "M-Pesa" | "Bank Transfer" | "Cheque";
  reference: string;
  mpesaTransactionId?: string;
  module: "Finance" | "Inventory" | "HR" | "Welfare" | "Events";
  moduleReference?: string; // Reference to the original record in the module
  status: "Pending" | "Approved" | "Rejected" | "Completed" | "Cancelled";
  createdBy: string;
  approvedBy?: string;
  requestedBy: string;
  requiresApproval: boolean;
  notes?: string;
  attachments?: string[];
  tags?: string[];
  vatAmount?: number;
  withholdingTax?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OfferingData {
  id: string;
  date: string;
  serviceType: string;
  minister: string;
  offerings: {
    tithe: number;
    specialOffering: number;
    thanksgiving: number;
    buildingFund: number;
    missions: number;
    welfare: number;
    youth: number;
    others: number;
  };
  totalAmount: number;
  collectedBy: string;
  countedBy: string[];
  bankingDetails?: {
    deposited: boolean;
    depositDate?: string;
    bankSlipNumber?: string;
  };
}

/**
 * Financial Transaction Service - Singleton Pattern Implementation
 *
 * This service manages all financial transactions across the church management system.
 * It implements the Observer pattern for real-time updates and maintains data consistency.
 *
 * Design Patterns Used:
 * - Singleton: Ensures single instance across the application
 * - Observer: Real-time updates to subscribers
 * - Factory: Transaction creation with proper validation
 *
 * Data Flow:
 * 1. Module creates transaction -> 2. Service validation -> 3. Approval workflow -> 4. Update subscribers
 */
class FinancialTransactionService {
  // Singleton instance - ensures single source of truth for financial data
  private static instance: FinancialTransactionService;

  // Core data storage - in production, this would interface with database
  private transactions: FinancialTransaction[] = [];
  private offerings: OfferingData[] = [];

  // Observer pattern subscribers for real-time updates
  private subscribers: Array<(transactions: FinancialTransaction[]) => void> =
    [];
  private approvalSubscribers: Array<(pendingCount: number) => void> = [];
  private notificationSubscribers: Array<(notification: any) => void> = [];

  public static getInstance(): FinancialTransactionService {
    if (!FinancialTransactionService.instance) {
      FinancialTransactionService.instance = new FinancialTransactionService();
    }
    return FinancialTransactionService.instance;
  }

  // Initialize with mock data
  public initialize(): void {
    this.loadMockData();
  }

  private loadMockData(): void {
    // Mock financial transactions
    this.transactions = [
      {
        id: "FTX001",
        date: "2024-01-15",
        type: "Income",
        category: "Tithe",
        description: "Sunday Service Tithe Collection",
        amount: 250000,
        currency: "KSh",
        paymentMethod: "Cash",
        reference: "REF001",
        module: "Finance",
        status: "Completed",
        createdBy: "Finance Officer",
        requestedBy: "Finance Officer",
        requiresApproval: false,
        createdAt: "2024-01-15T09:00:00Z",
        updatedAt: "2024-01-15T09:00:00Z",
      },
      {
        id: "FTX002",
        date: "2024-01-16",
        type: "Expense",
        category: "Equipment",
        subcategory: "Office Supplies",
        description: "Purchase of laptops for church office",
        amount: 150000,
        currency: "KSh",
        paymentMethod: "Bank Transfer",
        reference: "INV001",
        module: "Inventory",
        moduleReference: "ITEM001",
        status: "Completed",
        createdBy: "Inventory Manager",
        requestedBy: "Inventory Manager",
        requiresApproval: true,
        approvedBy: "Pastor",
        createdAt: "2024-01-16T10:30:00Z",
        updatedAt: "2024-01-16T10:30:00Z",
      },
      {
        id: "FTX003",
        date: "2024-01-17",
        type: "Expense",
        category: "Utilities",
        description: "Monthly electricity bill",
        amount: 45000,
        currency: "KSh",
        paymentMethod: "M-Pesa",
        reference: "ELEC001",
        mpesaTransactionId: "RKL9A2B3C4",
        module: "Finance",
        status: "Completed",
        createdBy: "Finance Officer",
        requestedBy: "Finance Officer",
        requiresApproval: true,
        approvedBy: "Pastor",
        createdAt: "2024-01-17T14:15:00Z",
        updatedAt: "2024-01-17T14:15:00Z",
      },
    ];

    // Mock offering data
    this.offerings = [
      {
        id: "OFF001",
        date: "2024-01-21",
        serviceType: "Sunday Service",
        minister: "Pastor James Kimani",
        offerings: {
          tithe: 180000,
          specialOffering: 45000,
          thanksgiving: 25000,
          buildingFund: 75000,
          missions: 30000,
          welfare: 20000,
          youth: 15000,
          others: 10000,
        },
        totalAmount: 400000,
        collectedBy: "Deacon Peter",
        countedBy: ["Grace Mwangi", "Samuel Kiprotich"],
        bankingDetails: {
          deposited: true,
          depositDate: "2024-01-22",
          bankSlipNumber: "BS2024001",
        },
      },
    ];

    this.notifySubscribers();
  }

  // Subscribe to transaction updates
  public subscribe(
    callback: (transactions: FinancialTransaction[]) => void,
  ): void {
    this.subscribers.push(callback);
  }

  // Unsubscribe from transaction updates
  public unsubscribe(
    callback: (transactions: FinancialTransaction[]) => void,
  ): void {
    this.subscribers = this.subscribers.filter((sub) => sub !== callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback(this.transactions));
    const pendingCount = this.getPendingTransactions().length;
    this.approvalSubscribers.forEach((callback) => callback(pendingCount));
  }

  // Subscribe to approval notifications
  public subscribeToApprovals(callback: (pendingCount: number) => void): void {
    this.approvalSubscribers.push(callback);
  }

  public unsubscribeFromApprovals(
    callback: (pendingCount: number) => void,
  ): void {
    this.approvalSubscribers = this.approvalSubscribers.filter(
      (sub) => sub !== callback,
    );
  }

  // Subscribe to notifications
  public subscribeToNotifications(callback: (notification: any) => void): void {
    this.notificationSubscribers.push(callback);
  }

  private notifyApprovalNeeded(transaction: FinancialTransaction): void {
    const notification = {
      id: `notification_${Date.now()}`,
      type: "approval_required",
      title: "Transaction Approval Required",
      message: `${transaction.module} module requests approval for ${transaction.type.toLowerCase()}: ${transaction.description}`,
      amount: transaction.amount,
      module: transaction.module,
      transactionId: transaction.id,
      timestamp: new Date().toISOString(),
    };

    this.notificationSubscribers.forEach((callback) => callback(notification));
  }

  /**
   * Add new financial transaction to the system
   *
   * This is the core method for adding transactions from any module.
   * It automatically handles approval workflow, ID generation, and notifications.
   *
   * @param transaction - Transaction data (without system-generated fields)
   * @returns Complete transaction object with generated ID and timestamps
   *
   * Business Rules:
   * - Transactions >KSh 1,000 from non-Finance modules require approval
   * - Auto-generates unique transaction ID
   * - Triggers real-time notifications for approval requirements
   * - Updates all subscribers immediately
   */
  public addTransaction(
    transaction: Omit<FinancialTransaction, "id" | "createdAt" | "updatedAt">,
  ): FinancialTransaction {
    const newTransaction: FinancialTransaction = {
      ...transaction,
      id: `FTX${String(this.transactions.length + 1).padStart(3, "0")}`,
      requiresApproval:
        transaction.module !== "Finance" && transaction.amount > 1000,
      requestedBy: transaction.createdBy,
      status:
        transaction.module !== "Finance" && transaction.amount > 1000
          ? "Pending"
          : transaction.status || "Completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.transactions.push(newTransaction);

    // Notify about approval needed if transaction requires approval
    if (
      newTransaction.requiresApproval &&
      newTransaction.status === "Pending"
    ) {
      this.notifyApprovalNeeded(newTransaction);
    }

    this.notifySubscribers();

    // Log for system tracking
    console.log("Financial Transaction Added:", newTransaction);

    return newTransaction;
  }

  /**
   * Integration Method: Inventory Module -> Finance Module
   *
   * Automatically creates financial transaction when inventory items are purchased.
   * This ensures all equipment purchases are tracked in the finance system.
   *
   * @param item - Inventory purchase details
   * @returns Financial transaction record
   *
   * Integration Flow: Inventory Module -> Financial Service -> Finance Dashboard
   */
  public addInventoryPurchase(item: {
    itemName: string;
    purchasePrice: number;
    supplier: string;
    category: string;
    paymentMethod: string;
    reference: string;
    mpesaTransactionId?: string;
    createdBy: string;
  }): FinancialTransaction {
    return this.addTransaction({
      date: new Date().toISOString().split("T")[0],
      type: "Expense",
      category: "Equipment",
      subcategory: item.category,
      description: `Purchase of ${item.itemName} from ${item.supplier}`,
      amount: item.purchasePrice,
      currency: "KSh",
      paymentMethod: item.paymentMethod as any,
      reference: item.reference,
      mpesaTransactionId: item.mpesaTransactionId,
      module: "Inventory",
      moduleReference: item.reference,
      status: "Completed",
      createdBy: item.createdBy,
      requestedBy: item.createdBy,
      requiresApproval: item.purchasePrice > 1000,
    });
  }

  // Add maintenance expense transaction
  public addMaintenanceExpense(maintenance: {
    itemName: string;
    maintenanceType: string;
    cost: number;
    performedBy: string;
    paymentMethod: string;
    reference: string;
    mpesaTransactionId?: string;
    createdBy: string;
  }): FinancialTransaction {
    return this.addTransaction({
      date: new Date().toISOString().split("T")[0],
      type: "Expense",
      category: "Maintenance",
      subcategory: maintenance.maintenanceType,
      description: `${maintenance.maintenanceType} for ${maintenance.itemName} by ${maintenance.performedBy}`,
      amount: maintenance.cost,
      currency: "KSh",
      paymentMethod: maintenance.paymentMethod as any,
      reference: maintenance.reference,
      mpesaTransactionId: maintenance.mpesaTransactionId,
      module: "Inventory",
      moduleReference: maintenance.reference,
      status: "Completed",
      createdBy: maintenance.createdBy,
      requestedBy: maintenance.createdBy,
      requiresApproval: maintenance.cost > 1000,
    });
  }

  // Add offering data
  public addOffering(
    offering: Omit<OfferingData, "id" | "totalAmount">,
  ): OfferingData {
    const totalAmount = Object.values(offering.offerings).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    const newOffering: OfferingData = {
      ...offering,
      id: `OFF${String(this.offerings.length + 1).padStart(3, "0")}`,
      totalAmount,
    };

    this.offerings.push(newOffering);

    // Also add as financial transaction
    this.addTransaction({
      date: offering.date,
      type: "Income",
      category: "Offerings",
      subcategory: offering.serviceType,
      description: `Service offerings - ${offering.serviceType} by ${offering.minister}`,
      amount: totalAmount,
      currency: "KSh",
      paymentMethod: "Cash",
      reference: newOffering.id,
      module: "Finance",
      moduleReference: newOffering.id,
      status: "Completed",
      createdBy: offering.collectedBy,
      requestedBy: offering.collectedBy,
      requiresApproval: false,
    });

    return newOffering;
  }

  // Get all transactions
  public getTransactions(): FinancialTransaction[] {
    return [...this.transactions];
  }

  // Get transactions by module
  public getTransactionsByModule(module: string): FinancialTransaction[] {
    return this.transactions.filter((t) => t.module === module);
  }

  // Get transactions by type
  public getTransactionsByType(
    type: "Income" | "Expense",
  ): FinancialTransaction[] {
    return this.transactions.filter((t) => t.type === type);
  }

  // Get transactions by date range
  public getTransactionsByDateRange(
    startDate: string,
    endDate: string,
  ): FinancialTransaction[] {
    return this.transactions.filter(
      (t) => t.date >= startDate && t.date <= endDate,
    );
  }

  // Get all offerings
  public getOfferings(): OfferingData[] {
    return [...this.offerings];
  }

  // Get latest offering data for Service Summary Form auto-fill
  public getLatestOffering(): OfferingData | null {
    if (this.offerings.length === 0) return null;

    return this.offerings.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0];
  }

  // Get financial summary
  public getFinancialSummary(
    startDate?: string,
    endDate?: string,
  ): {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
    offeringTotal: number;
  } {
    let filteredTransactions = this.transactions;

    if (startDate && endDate) {
      filteredTransactions = this.getTransactionsByDateRange(
        startDate,
        endDate,
      );
    }

    const totalIncome = filteredTransactions
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter((t) => t.type === "Expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const offeringTotal = this.offerings
      .filter(
        (o) =>
          !startDate || !endDate || (o.date >= startDate && o.date <= endDate),
      )
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount: filteredTransactions.length,
      offeringTotal,
    };
  }

  // Update transaction status
  public updateTransactionStatus(
    id: string,
    status: "Pending" | "Completed" | "Cancelled",
    approvedBy?: string,
  ): boolean {
    const transaction = this.transactions.find((t) => t.id === id);
    if (transaction) {
      transaction.status = status;
      transaction.updatedAt = new Date().toISOString();
      if (approvedBy) {
        transaction.approvedBy = approvedBy;
      }
      this.notifySubscribers();
      return true;
    }
    return false;
  }

  // Delete transaction
  public deleteTransaction(id: string): boolean {
    const index = this.transactions.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.transactions.splice(index, 1);
      this.notifySubscribers();
      return true;
    }
    return false;
  }

  // Get expense categories for dropdown
  public getExpenseCategories(): string[] {
    const categories = new Set(
      this.transactions
        .filter((t) => t.type === "Expense")
        .map((t) => t.category),
    );

    return Array.from(categories).sort();
  }

  // Get payment methods used
  public getPaymentMethods(): string[] {
    const methods = new Set(this.transactions.map((t) => t.paymentMethod));
    return Array.from(methods).sort();
  }

  // Get pending transactions that need approval
  public getPendingTransactions(): FinancialTransaction[] {
    return this.transactions.filter(
      (t) => t.status === "Pending" && t.requiresApproval,
    );
  }

  // Approve a transaction
  public approveTransaction(
    transactionId: string,
    approvedBy: string,
  ): boolean {
    const transaction = this.transactions.find((t) => t.id === transactionId);
    if (transaction && transaction.status === "Pending") {
      transaction.status = "Approved";
      transaction.approvedBy = approvedBy;
      transaction.updatedAt = new Date().toISOString();

      // Create approval notification
      const notification = {
        id: `approval_${Date.now()}`,
        type: "transaction_approved",
        title: "Transaction Approved",
        message: `Transaction ${transactionId} has been approved by ${approvedBy}`,
        transactionId,
        timestamp: new Date().toISOString(),
      };

      this.notificationSubscribers.forEach((callback) =>
        callback(notification),
      );
      this.notifySubscribers();
      return true;
    }
    return false;
  }

  // Reject a transaction
  public rejectTransaction(
    transactionId: string,
    rejectedBy: string,
    reason: string,
  ): boolean {
    const transaction = this.transactions.find((t) => t.id === transactionId);
    if (transaction && transaction.status === "Pending") {
      transaction.status = "Rejected";
      transaction.approvedBy = rejectedBy;
      transaction.notes = (transaction.notes || "") + ` | Rejected: ${reason}`;
      transaction.updatedAt = new Date().toISOString();

      // Create rejection notification
      const notification = {
        id: `rejection_${Date.now()}`,
        type: "transaction_rejected",
        title: "Transaction Rejected",
        message: `Transaction ${transactionId} has been rejected by ${rejectedBy}: ${reason}`,
        transactionId,
        timestamp: new Date().toISOString(),
      };

      this.notificationSubscribers.forEach((callback) =>
        callback(notification),
      );
      this.notifySubscribers();
      return true;
    }
    return false;
  }

  // Add payroll expense - requires Finance approval
  public addPayrollExpense(data: {
    employeeName: string;
    employeeId: string;
    period: string;
    grossSalary: number;
    netSalary: number;
    deductions: number;
  }): FinancialTransaction {
    return this.addTransaction({
      date: new Date().toISOString().split("T")[0],
      type: "Expense",
      category: "Payroll",
      subcategory: "Staff Salaries",
      description: `Salary payment for ${data.employeeName} (${data.period})`,
      amount: data.netSalary,
      currency: "KSH",
      paymentMethod: "Bank Transfer",
      reference: `PAY-${data.employeeId}-${data.period}`,
      module: "HR",
      moduleReference: data.employeeId,
      status: "Pending", // Requires approval
      createdBy: "HR System",
      requestedBy: "HR System",
      requiresApproval: true,
      notes: `Gross: KSh ${data.grossSalary.toLocaleString()}, Deductions: KSh ${data.deductions.toLocaleString()}`,
    });
  }

  // Add welfare payment
  public addWelfarePayment(data: {
    memberName: string;
    memberId: string;
    paymentType: string;
    amount: number;
    reason: string;
  }): FinancialTransaction {
    return this.addTransaction({
      date: new Date().toISOString().split("T")[0],
      type: "Expense",
      category: "Welfare",
      subcategory: data.paymentType,
      description: `Welfare payment to ${data.memberName}: ${data.reason}`,
      amount: data.amount,
      currency: "KSH",
      paymentMethod: "Cash",
      reference: `WEL-${data.memberId}-${Date.now()}`,
      module: "Welfare",
      moduleReference: data.memberId,
      status: "Completed",
      createdBy: "System",
      requestedBy: "System",
      requiresApproval: data.amount > 1000,
      notes: data.reason,
    });
  }

  // Add event expense
  public addEventExpense(data: {
    eventName: string;
    eventId: string;
    expenseType: string;
    amount: number;
    description: string;
  }): FinancialTransaction {
    return this.addTransaction({
      date: new Date().toISOString().split("T")[0],
      type: "Expense",
      category: "Events",
      subcategory: data.expenseType,
      description: `Event expense for ${data.eventName}: ${data.description}`,
      amount: data.amount,
      currency: "KSH",
      paymentMethod: "Cash",
      reference: `EVT-${data.eventId}-${Date.now()}`,
      module: "Events",
      moduleReference: data.eventId,
      status: "Completed",
      createdBy: "System",
      requestedBy: "System",
      requiresApproval: data.amount > 1000,
      notes: data.description,
    });
  }

  // Add member contribution/tithe
  public addMemberContribution(data: {
    memberName: string;
    memberId: string;
    contributionType: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
  }): FinancialTransaction {
    return this.addTransaction({
      date: new Date().toISOString().split("T")[0],
      type: "Income",
      category: "Contributions",
      subcategory: data.contributionType,
      description: `${data.contributionType} from ${data.memberName}`,
      amount: data.amount,
      currency: "KSH",
      paymentMethod: data.paymentMethod as any,
      reference: data.reference || `MEM-${data.memberId}-${Date.now()}`,
      module: "Finance",
      moduleReference: data.memberId,
      status: "Completed",
      createdBy: "System",
      requestedBy: "System",
      requiresApproval: false,
    });
  }

  // Batch add payroll for multiple employees
  public addBatchPayroll(payrollRecords: any[]): FinancialTransaction[] {
    const transactions: FinancialTransaction[] = [];

    payrollRecords.forEach((record) => {
      transactions.push(
        this.addPayrollExpense({
          employeeName: record.employeeName,
          employeeId: record.employeeId,
          period: record.period,
          grossSalary: record.grossSalary,
          netSalary: record.netSalary,
          deductions: record.totalDeductions,
        }),
      );
    });

    return transactions;
  }

  // Add appointment/service fee
  public addServiceFee(data: {
    serviceName: string;
    clientName: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
  }): FinancialTransaction {
    return this.addTransaction({
      date: new Date().toISOString().split("T")[0],
      type: "Income",
      category: "Services",
      subcategory: data.serviceName,
      description: `${data.serviceName} fee from ${data.clientName}`,
      amount: data.amount,
      currency: "KSH",
      paymentMethod: data.paymentMethod as any,
      reference: data.reference || `SVC-${Date.now()}`,
      module: "Finance",
      status: "Completed",
      createdBy: "System",
      requestedBy: "System",
      requiresApproval: false,
    });
  }
}

// Export singleton instance
export const financialTransactionService =
  FinancialTransactionService.getInstance();

// Initialize the service
financialTransactionService.initialize();
