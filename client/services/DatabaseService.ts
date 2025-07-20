/**
 * TSOAM Church Management System - Database Service
 *
 * Comprehensive data management with security, audit trails, and cross-referencing
 * Handles: Visitors, New Members, Full Members, Employees, Tithes, System Logs
 *
 * @author TSOAM Development Team
 * @version 3.0.0
 */

// Enhanced Data Structures
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  isActive: boolean;
  version: number; // For optimistic locking
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "TRANSFER";
  oldValue?: any;
  newValue?: any;
  userId: string;
  userName: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Visitor extends BaseEntity {
  visitorId: string; // V2025-001
  fullName: string;
  phoneNumber: string;
  email?: string;
  gender: "Male" | "Female";
  dateOfBirth?: string;
  maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed";
  address?: string;
  firstVisitDate: string;
  lastVisitDate: string;
  totalVisits: number;
  consecutiveSundays: number;
  status: "Active Visitor" | "Promoted to New Member" | "Inactive" | "Lost";
  bornAgain: boolean;
  bornAgainDate?: string;
  howHeardAboutChurch: string;
  followUpNotes: string;
  promotedToNewMember: boolean;
  promotionDate?: string;
  retentionScore: number;
}

export interface NewMember extends BaseEntity {
  visitorId: string; // V2025-001N
  fullName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth?: string;
  gender: "Male" | "Female";
  maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed";
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  visitDate: string;
  daysAsNewMember: number;
  baptized: boolean;
  baptismDate?: string;
  bibleStudyCompleted: boolean;
  bibleStudyCompletionDate?: string;
  employmentStatus?: "Employed" | "Jobless" | "Business Class";
  previousChurchName?: string;
  reasonForLeavingPreviousChurch?: string;
  reasonDetails?: string;
  howHeardAboutUs: string;
  purposeOfVisit: string;
  bornAgain: boolean;
  churchFeedback?: string;
  prayerRequests?: string;
  serviceGroups: number[];
  eligibleForMembership: boolean;
  transferredFromVisitorId: string; // Original visitor ID
}

export interface FullMember extends BaseEntity {
  memberId: string; // TSOAM2025-001
  titheNumber: string; // TS-2025-001
  visitorId: string; // V2025-001N
  fullName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth?: string;
  gender: "Male" | "Female";
  maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed";
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  membershipDate: string;
  yearOfJoining: number;
  visitDate: string;
  baptized: boolean;
  baptismDate?: string;
  bibleStudyCompleted: boolean;
  bibleStudyCompletionDate?: string;
  employmentStatus?: "Employed" | "Jobless" | "Business Class";
  membershipStatus: "Active" | "Inactive";
  previousChurchName?: string;
  reasonForLeavingPreviousChurch?: string;
  reasonDetails?: string;
  howHeardAboutUs: string;
  serviceGroups: string[];
  bornAgain: boolean;
  transferredFromNewMemberId: string;
  transferredFromVisitorId: string;

  // Employee cross-reference
  isEmployee: boolean;
  employeeId?: string;
  employeeNumber?: string;
  department?: string;
  position?: string;
  dateOfEmployment?: string;

  // Financial tracking
  totalTithes: number;
  lastTitheDate?: string;
  lastTitheAmount?: number;
  titheFrequency: "Weekly" | "Monthly" | "Irregular";
}

export interface Employee extends BaseEntity {
  employeeId: string; // EMP-2025-001
  employeeNumber: string; // EMP001
  fullName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth?: string;
  gender: "Male" | "Female";
  maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed";
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;

  // Employment details
  department: string;
  position: string;
  dateOfEmployment: string;
  employmentStatus: "Active" | "On Leave" | "Terminated";
  salary?: number;
  contractType: "Permanent" | "Contract" | "Part-time";

  // Church membership cross-reference
  isChurchMember: boolean;
  memberId?: string; // Links to FullMember.memberId
  titheNumber?: string; // Links to FullMember.titheNumber
  visitorId?: string; // Original visitor journey
}

export interface TitheRecord extends BaseEntity {
  titheId: string; // TITHE-2025-001
  memberId: string; // TSOAM2025-001
  titheNumber: string; // TS-2025-001
  memberName: string;
  amount: number;
  currency: "KSH" | "USD" | "EUR";
  paymentMethod: "Cash" | "M-Pesa" | "Bank Transfer" | "Cheque" | "Card";
  paymentReference?: string;
  titheDate: string;
  serviceDate: string; // The Sunday service for which tithe is given
  notes?: string;
  receivedBy: string; // User who recorded the tithe
  verifiedBy?: string; // Optional verification
  isVerified: boolean;

  // Categorization
  titheType:
    | "Regular"
    | "Special Offering"
    | "Thanksgiving"
    | "First Fruits"
    | "Harvest";
  category: "Tithe" | "Offering" | "Building Fund" | "Mission" | "Welfare";
}

export interface SystemSecurity {
  encryptionKey: string;
  lastBackup: string;
  backupFrequency: "Daily" | "Weekly" | "Monthly";
  auditRetentionDays: number;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  requirePasswordChange: boolean;
  passwordChangeFrequencyDays: number;
}

class DatabaseService {
  private static instance: DatabaseService;
  private readonly STORAGE_PREFIX = "tsoam_secure_";
  private readonly AUDIT_LOG_KEY = "audit_logs";

  // Encryption keys (in production, these would be environment variables)
  private readonly ENCRYPTION_ENABLED = true;
  private readonly SECURITY_VERSION = "3.0.0";

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private constructor() {
    this.initializeSecurity();
  }

  private initializeSecurity(): void {
    const security = this.getSecurityConfig();
    if (!security) {
      this.setSecurityConfig({
        encryptionKey: this.generateEncryptionKey(),
        lastBackup: new Date().toISOString(),
        backupFrequency: "Daily",
        auditRetentionDays: 365,
        maxLoginAttempts: 3,
        sessionTimeoutMinutes: 30,
        requirePasswordChange: false,
        passwordChangeFrequencyDays: 90,
      });
    }
  }

  private generateEncryptionKey(): string {
    return (
      "TSOAM-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9)
    );
  }

  private generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}-${timestamp}-${random}`;
  }

  // Security and Audit Methods
  private logAudit(log: Omit<AuditLog, "id" | "timestamp">): void {
    const auditLog: AuditLog = {
      ...log,
      id: this.generateId("AUDIT"),
      timestamp: new Date().toISOString(),
    };

    const logs = this.getAuditLogs();
    logs.push(auditLog);

    // Keep only recent logs based on retention policy
    const security = this.getSecurityConfig();
    if (security) {
      const retentionDate = new Date();
      retentionDate.setDate(
        retentionDate.getDate() - security.auditRetentionDays,
      );

      const filteredLogs = logs.filter(
        (log) => new Date(log.timestamp) > retentionDate,
      );

      this.setItem(this.AUDIT_LOG_KEY, filteredLogs);
    }
  }

  private getCurrentUser(): { id: string; name: string } {
    // In production, this would come from authentication context
    const user = JSON.parse(localStorage.getItem("tsoam_current_user") || "{}");
    return {
      id: user.id || "system",
      name: user.name || "System User",
    };
  }

  // Generic CRUD Operations with Audit
  private setItem<T>(key: string, data: T): void {
    const storageKey = this.STORAGE_PREFIX + key;
    const serializedData = JSON.stringify(data);

    if (this.ENCRYPTION_ENABLED) {
      // Simple encryption (in production, use proper encryption)
      const encrypted = btoa(serializedData);
      localStorage.setItem(storageKey, encrypted);
    } else {
      localStorage.setItem(storageKey, serializedData);
    }
  }

  private getItem<T>(key: string): T | null {
    const storageKey = this.STORAGE_PREFIX + key;
    const data = localStorage.getItem(storageKey);

    if (!data) return null;

    try {
      if (this.ENCRYPTION_ENABLED) {
        const decrypted = atob(data);
        return JSON.parse(decrypted);
      } else {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Error parsing data for key:", key, error);
      return null;
    }
  }

  // Visitors Management
  public getVisitors(): Visitor[] {
    return this.getItem<Visitor[]>("visitors") || [];
  }

  public saveVisitor(visitor: Omit<Visitor, keyof BaseEntity>): string {
    const user = this.getCurrentUser();
    const now = new Date().toISOString();

    const newVisitor: Visitor = {
      ...visitor,
      id: this.generateId("VIS"),
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      updatedBy: user.id,
      isActive: true,
      version: 1,
    };

    const visitors = this.getVisitors();
    visitors.push(newVisitor);
    this.setItem("visitors", visitors);

    this.logAudit({
      entityType: "Visitor",
      entityId: newVisitor.id,
      action: "CREATE",
      newValue: newVisitor,
      userId: user.id,
      userName: user.name,
    });

    return newVisitor.id;
  }

  public updateVisitor(id: string, updates: Partial<Visitor>): boolean {
    const visitors = this.getVisitors();
    const index = visitors.findIndex((v) => v.id === id);

    if (index === -1) return false;

    const user = this.getCurrentUser();
    const oldValue = { ...visitors[index] };

    visitors[index] = {
      ...visitors[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
      version: visitors[index].version + 1,
    };

    this.setItem("visitors", visitors);

    this.logAudit({
      entityType: "Visitor",
      entityId: id,
      action: "UPDATE",
      oldValue,
      newValue: visitors[index],
      userId: user.id,
      userName: user.name,
    });

    return true;
  }

  // New Members Management
  public getNewMembers(): NewMember[] {
    return this.getItem<NewMember[]>("new_members") || [];
  }

  public saveNewMember(newMember: Omit<NewMember, keyof BaseEntity>): string {
    const user = this.getCurrentUser();
    const now = new Date().toISOString();

    const member: NewMember = {
      ...newMember,
      id: this.generateId("NM"),
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      updatedBy: user.id,
      isActive: true,
      version: 1,
    };

    const members = this.getNewMembers();
    members.push(member);
    this.setItem("new_members", members);

    this.logAudit({
      entityType: "NewMember",
      entityId: member.id,
      action: "CREATE",
      newValue: member,
      userId: user.id,
      userName: user.name,
    });

    return member.id;
  }

  public updateNewMember(id: string, updates: Partial<NewMember>): boolean {
    const members = this.getNewMembers();
    const index = members.findIndex((m) => m.id === id);

    if (index === -1) return false;

    const user = this.getCurrentUser();
    const oldValue = { ...members[index] };

    members[index] = {
      ...members[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
      version: members[index].version + 1,
    };

    this.setItem("new_members", members);

    this.logAudit({
      entityType: "NewMember",
      entityId: id,
      action: "UPDATE",
      oldValue,
      newValue: members[index],
      userId: user.id,
      userName: user.name,
    });

    return true;
  }

  // Full Members Management
  public getFullMembers(): FullMember[] {
    return this.getItem<FullMember[]>("full_members") || [];
  }

  public saveFullMember(
    fullMember: Omit<FullMember, keyof BaseEntity>,
  ): string {
    const user = this.getCurrentUser();
    const now = new Date().toISOString();

    const member: FullMember = {
      ...fullMember,
      id: this.generateId("FM"),
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      updatedBy: user.id,
      isActive: true,
      version: 1,
    };

    const members = this.getFullMembers();
    members.push(member);
    this.setItem("full_members", members);

    this.logAudit({
      entityType: "FullMember",
      entityId: member.id,
      action: "CREATE",
      newValue: member,
      userId: user.id,
      userName: user.name,
    });

    return member.id;
  }

  public updateFullMember(id: string, updates: Partial<FullMember>): boolean {
    const members = this.getFullMembers();
    const index = members.findIndex((m) => m.id === id);

    if (index === -1) return false;

    const user = this.getCurrentUser();
    const oldValue = { ...members[index] };

    members[index] = {
      ...members[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
      version: members[index].version + 1,
    };

    this.setItem("full_members", members);

    this.logAudit({
      entityType: "FullMember",
      entityId: id,
      action: "UPDATE",
      oldValue,
      newValue: members[index],
      userId: user.id,
      userName: user.name,
    });

    return true;
  }

  // Employee Management
  public getEmployees(): Employee[] {
    return this.getItem<Employee[]>("employees") || [];
  }

  public saveEmployee(employee: Omit<Employee, keyof BaseEntity>): string {
    const user = this.getCurrentUser();
    const now = new Date().toISOString();

    const newEmployee: Employee = {
      ...employee,
      id: this.generateId("EMP"),
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      updatedBy: user.id,
      isActive: true,
      version: 1,
    };

    const employees = this.getEmployees();
    employees.push(newEmployee);
    this.setItem("employees", employees);

    this.logAudit({
      entityType: "Employee",
      entityId: newEmployee.id,
      action: "CREATE",
      newValue: newEmployee,
      userId: user.id,
      userName: user.name,
    });

    return newEmployee.id;
  }

  // Tithe Management
  public getTithes(): TitheRecord[] {
    return this.getItem<TitheRecord[]>("tithes") || [];
  }

  public saveTithe(tithe: Omit<TitheRecord, keyof BaseEntity>): string {
    const user = this.getCurrentUser();
    const now = new Date().toISOString();

    const newTithe: TitheRecord = {
      ...tithe,
      id: this.generateId("TITHE"),
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      updatedBy: user.id,
      isActive: true,
      version: 1,
    };

    const tithes = this.getTithes();
    tithes.push(newTithe);
    this.setItem("tithes", tithes);

    // Update member's tithe summary
    this.updateMemberTitheSummary(
      tithe.memberId,
      tithe.amount,
      tithe.titheDate,
    );

    this.logAudit({
      entityType: "TitheRecord",
      entityId: newTithe.id,
      action: "CREATE",
      newValue: newTithe,
      userId: user.id,
      userName: user.name,
    });

    return newTithe.id;
  }

  private updateMemberTitheSummary(
    memberId: string,
    amount: number,
    titheDate: string,
  ): void {
    const members = this.getFullMembers();
    const memberIndex = members.findIndex((m) => m.memberId === memberId);

    if (memberIndex !== -1) {
      const member = members[memberIndex];
      member.totalTithes = (member.totalTithes || 0) + amount;
      member.lastTitheDate = titheDate;
      member.lastTitheAmount = amount;

      // Determine tithe frequency based on recent tithes
      const memberTithes = this.getTithes()
        .filter((t) => t.memberId === memberId)
        .sort(
          (a, b) =>
            new Date(b.titheDate).getTime() - new Date(a.titheDate).getTime(),
        );

      if (memberTithes.length >= 3) {
        const recent = memberTithes.slice(0, 3);
        const daysBetween = recent
          .map((tithe, index) => {
            if (index === recent.length - 1) return 0;
            const current = new Date(tithe.titheDate);
            const next = new Date(recent[index + 1].titheDate);
            return Math.abs(
              (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24),
            );
          })
          .filter((days) => days > 0);

        const avgDays =
          daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length;

        if (avgDays <= 10) {
          member.titheFrequency = "Weekly";
        } else if (avgDays <= 35) {
          member.titheFrequency = "Monthly";
        } else {
          member.titheFrequency = "Irregular";
        }
      }

      this.setItem("full_members", members);
    }
  }

  public getMemberTithes(memberId: string): TitheRecord[] {
    return this.getTithes().filter((t) => t.memberId === memberId);
  }

  // Cross-Reference Methods
  public linkEmployeeToMember(employeeId: string, memberId: string): boolean {
    const employees = this.getEmployees();
    const members = this.getFullMembers();

    const employee = employees.find((e) => e.employeeId === employeeId);
    const member = members.find((m) => m.memberId === memberId);

    if (!employee || !member) return false;

    // Update employee record
    this.updateEmployee(employee.id, {
      isChurchMember: true,
      memberId: member.memberId,
      titheNumber: member.titheNumber,
      visitorId: member.visitorId,
    });

    // Update member record
    this.updateFullMember(member.id, {
      isEmployee: true,
      employeeId: employee.employeeId,
      employeeNumber: employee.employeeNumber,
      department: employee.department,
      position: employee.position,
      dateOfEmployment: employee.dateOfEmployment,
    });

    return true;
  }

  public updateEmployee(id: string, updates: Partial<Employee>): boolean {
    const employees = this.getEmployees();
    const index = employees.findIndex((e) => e.id === id);

    if (index === -1) return false;

    const user = this.getCurrentUser();
    const oldValue = { ...employees[index] };

    employees[index] = {
      ...employees[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
      version: employees[index].version + 1,
    };

    this.setItem("employees", employees);

    this.logAudit({
      entityType: "Employee",
      entityId: id,
      action: "UPDATE",
      oldValue,
      newValue: employees[index],
      userId: user.id,
      userName: user.name,
    });

    return true;
  }

  // Search and Query Methods
  public searchMembers(query: string): {
    visitors: Visitor[];
    newMembers: NewMember[];
    fullMembers: FullMember[];
  } {
    const searchTerm = query.toLowerCase();

    return {
      visitors: this.getVisitors().filter(
        (v) =>
          v.fullName.toLowerCase().includes(searchTerm) ||
          v.visitorId.toLowerCase().includes(searchTerm) ||
          v.phoneNumber.includes(searchTerm),
      ),
      newMembers: this.getNewMembers().filter(
        (m) =>
          m.fullName.toLowerCase().includes(searchTerm) ||
          m.visitorId.toLowerCase().includes(searchTerm) ||
          m.phoneNumber.includes(searchTerm),
      ),
      fullMembers: this.getFullMembers().filter(
        (m) =>
          m.fullName.toLowerCase().includes(searchTerm) ||
          m.memberId.toLowerCase().includes(searchTerm) ||
          m.titheNumber.toLowerCase().includes(searchTerm) ||
          m.visitorId.toLowerCase().includes(searchTerm) ||
          m.phoneNumber.includes(searchTerm),
      ),
    };
  }

  // Security and Audit Methods
  public getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(this.AUDIT_LOG_KEY) || [];
  }

  public getSecurityConfig(): SystemSecurity | null {
    return this.getItem<SystemSecurity>("security_config");
  }

  public setSecurityConfig(config: SystemSecurity): void {
    this.setItem("security_config", config);
  }

  // Backup and Export
  public exportAllData(): any {
    return {
      visitors: this.getVisitors(),
      newMembers: this.getNewMembers(),
      fullMembers: this.getFullMembers(),
      employees: this.getEmployees(),
      tithes: this.getTithes(),
      auditLogs: this.getAuditLogs(),
      exportDate: new Date().toISOString(),
      version: this.SECURITY_VERSION,
    };
  }

  public importData(data: any): boolean {
    try {
      if (data.visitors) this.setItem("visitors", data.visitors);
      if (data.newMembers) this.setItem("new_members", data.newMembers);
      if (data.fullMembers) this.setItem("full_members", data.fullMembers);
      if (data.employees) this.setItem("employees", data.employees);
      if (data.tithes) this.setItem("tithes", data.tithes);

      const user = this.getCurrentUser();
      this.logAudit({
        entityType: "System",
        entityId: "DATA_IMPORT",
        action: "UPDATE",
        newValue: {
          importDate: new Date().toISOString(),
          recordCount: Object.keys(data).length,
        },
        userId: user.id,
        userName: user.name,
      });

      return true;
    } catch (error) {
      console.error("Import failed:", error);
      return false;
    }
  }

  // Statistics and Reports
  public getStatistics(): {
    totalVisitors: number;
    totalNewMembers: number;
    totalFullMembers: number;
    totalEmployees: number;
    totalTithes: number;
    totalTitheAmount: number;
    memberEmployees: number;
  } {
    const visitors = this.getVisitors();
    const newMembers = this.getNewMembers();
    const fullMembers = this.getFullMembers();
    const employees = this.getEmployees();
    const tithes = this.getTithes();

    return {
      totalVisitors: visitors.filter((v) => v.isActive).length,
      totalNewMembers: newMembers.filter((m) => m.isActive).length,
      totalFullMembers: fullMembers.filter((m) => m.isActive).length,
      totalEmployees: employees.filter((e) => e.isActive).length,
      totalTithes: tithes.filter((t) => t.isActive).length,
      totalTitheAmount: tithes.reduce((sum, t) => sum + t.amount, 0),
      memberEmployees: fullMembers.filter((m) => m.isEmployee).length,
    };
  }
}

export const databaseService = DatabaseService.getInstance();
