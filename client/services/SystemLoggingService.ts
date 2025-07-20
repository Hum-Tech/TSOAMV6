/**
 * TSOAM Church Management System - System Logging Service
 *
 * Comprehensive logging service for production use
 * Tracks all system activities, user actions, security events, and errors
 *
 * @author TSOAM Development Team
 * @version 2.0.0
 */

export interface SystemLog {
  id: string;
  timestamp: string;
  level: "Info" | "Warning" | "Error" | "Security" | "Debug";
  event: string;
  description: string;
  user: string;
  ipAddress: string;
  module: string;
  action: string;
  details?: string;
  sessionId?: string;
  userAgent?: string;
  duration?: number; // For performance tracking
  success?: boolean;
  errorCode?: string;
  stackTrace?: string;
}

export interface LogFilter {
  level?: "Info" | "Warning" | "Error" | "Security" | "Debug" | "All";
  module?: string;
  user?: string;
  dateFrom?: string;
  dateTo?: string;
  event?: string;
}

export interface LogStats {
  totalLogs: number;
  todayLogs: number;
  errorCount: number;
  warningCount: number;
  securityEvents: number;
  topModules: { module: string; count: number }[];
  topUsers: { user: string; count: number }[];
  recentErrors: SystemLog[];
}

class SystemLoggingService {
  private static instance: SystemLoggingService;
  private logs: SystemLog[] = [];
  private maxLogs = 10000; // Maximum logs to keep in memory
  private subscribers: Array<(logs: SystemLog[]) => void> = [];
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.loadLogs();
    this.startLogCleanup();
    this.detectUserAgent();
  }

  public static getInstance(): SystemLoggingService {
    if (!SystemLoggingService.instance) {
      SystemLoggingService.instance = new SystemLoggingService();
    }
    return SystemLoggingService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectUserAgent(): string {
    return navigator.userAgent || "Unknown";
  }

  private getCurrentUser(): string {
    try {
      const user = localStorage.getItem("tsoam_user");
      if (user) {
        const userData = JSON.parse(user);
        return userData.email || userData.name || "Unknown User";
      }
    } catch (error) {
      // Silently fail
    }
    return "System";
  }

  private getClientIP(): string {
    // In a real application, you would get this from the server
    // For now, we'll simulate it
    return "192.168.1." + Math.floor(Math.random() * 255);
  }

  private loadLogs(): void {
    try {
      const stored = localStorage.getItem("tsoam_system_logs");
      if (stored) {
        this.logs = JSON.parse(stored);
        // Keep only recent logs in memory
        if (this.logs.length > this.maxLogs) {
          this.logs = this.logs.slice(-this.maxLogs);
          this.saveLogs();
        }
      } else {
        // Initialize with system start log
        this.log(
          "Info",
          "System",
          "SYSTEM_START",
          "System logging service initialized",
          {
            version: "2.0.0",
            maxLogs: this.maxLogs,
          },
        );
      }
    } catch (error) {
      console.error("Failed to load system logs:", error);
      this.logs = [];
    }
  }

  private saveLogs(): void {
    try {
      localStorage.setItem("tsoam_system_logs", JSON.stringify(this.logs));
    } catch (error) {
      console.error("Failed to save system logs:", error);
      // If localStorage is full, remove oldest logs and try again
      if (this.logs.length > 1000) {
        this.logs = this.logs.slice(-1000);
        try {
          localStorage.setItem("tsoam_system_logs", JSON.stringify(this.logs));
        } catch (retryError) {
          console.error("Failed to save logs even after cleanup:", retryError);
        }
      }
    }
  }

  private startLogCleanup(): void {
    // Clean up old logs every hour
    setInterval(
      () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const initialCount = this.logs.length;
        this.logs = this.logs.filter(
          (log) => new Date(log.timestamp) > thirtyDaysAgo,
        );

        if (this.logs.length !== initialCount) {
          this.saveLogs();
          console.log(
            `Cleaned up ${initialCount - this.logs.length} old log entries`,
          );
        }
      },
      60 * 60 * 1000,
    ); // 1 hour
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback([...this.logs]));
  }

  public subscribe(callback: (logs: SystemLog[]) => void): void {
    this.subscribers.push(callback);
  }

  public unsubscribe(callback: (logs: SystemLog[]) => void): void {
    this.subscribers = this.subscribers.filter((sub) => sub !== callback);
  }

  /**
   * Main logging method
   */
  public log(
    level: SystemLog["level"],
    module: string,
    action: string,
    description: string,
    details?: any,
    user?: string,
    duration?: number,
    success?: boolean,
    errorCode?: string,
    stackTrace?: string,
  ): void {
    const timestamp = new Date().toISOString();
    const logId = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const logEntry: SystemLog = {
      id: logId,
      timestamp,
      level,
      event: this.generateEventName(action),
      description,
      user: user || this.getCurrentUser(),
      ipAddress: this.getClientIP(),
      module,
      action,
      details: details ? JSON.stringify(details) : undefined,
      sessionId: this.sessionId,
      userAgent: this.detectUserAgent(),
      duration,
      success,
      errorCode,
      stackTrace,
    };

    this.logs.push(logEntry);

    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.saveLogs();
    this.notifySubscribers();

    // Console output for development
    if (level === "Error") {
      console.error(`[${level}] ${module}: ${description}`, details);
    } else if (level === "Warning") {
      console.warn(`[${level}] ${module}: ${description}`, details);
    } else {
      console.log(`[${level}] ${module}: ${description}`, details);
    }
  }

  private generateEventName(action: string): string {
    const eventMap: { [key: string]: string } = {
      LOGIN_SUCCESS: "User Login",
      LOGIN_FAILED: "Failed Login",
      LOGOUT: "User Logout",
      CREATE_MEMBER: "Member Added",
      UPDATE_MEMBER: "Member Updated",
      DELETE_MEMBER: "Member Deleted",
      CREATE_TRANSACTION: "Financial Transaction",
      UPDATE_TRANSACTION: "Transaction Updated",
      DELETE_TRANSACTION: "Transaction Deleted",
      BACKUP_CREATE: "Backup Created",
      BACKUP_RESTORE: "Backup Restored",
      SETTINGS_UPDATE: "Settings Updated",
      PASSWORD_CHANGE: "Password Changed",
      EXPORT_DATA: "Data Exported",
      SYSTEM_ERROR: "System Error",
      PERMISSION_DENIED: "Access Denied",
      DATA_CORRUPTION: "Data Corruption Detected",
      SECURITY_BREACH: "Security Breach",
      SESSION_EXPIRED: "Session Expired",
      INVALID_INPUT: "Invalid Input",
      API_CALL: "API Call",
      DATABASE_ERROR: "Database Error",
      NETWORK_ERROR: "Network Error",
    };

    return eventMap[action] || action.replace(/_/g, " ");
  }

  /**
   * Convenience methods for different log levels
   */
  public info(
    module: string,
    action: string,
    description: string,
    details?: any,
  ): void {
    this.log("Info", module, action, description, details);
  }

  public warning(
    module: string,
    action: string,
    description: string,
    details?: any,
  ): void {
    this.log("Warning", module, action, description, details);
  }

  public error(
    module: string,
    action: string,
    description: string,
    details?: any,
    errorCode?: string,
    stackTrace?: string,
  ): void {
    this.log(
      "Error",
      module,
      action,
      description,
      details,
      undefined,
      undefined,
      false,
      errorCode,
      stackTrace,
    );
  }

  public security(
    module: string,
    action: string,
    description: string,
    details?: any,
  ): void {
    this.log("Security", module, action, description, details);
  }

  public debug(
    module: string,
    action: string,
    description: string,
    details?: any,
  ): void {
    this.log("Debug", module, action, description, details);
  }

  /**
   * Performance logging
   */
  public logPerformance(
    module: string,
    action: string,
    duration: number,
    description?: string,
  ): void {
    const level = duration > 5000 ? "Warning" : "Info"; // Warn if operation takes > 5 seconds
    this.log(
      level,
      module,
      action,
      description || `Operation completed in ${duration}ms`,
      { duration },
      undefined,
      duration,
      true,
    );
  }

  /**
   * Get filtered logs
   */
  public getLogs(filter?: LogFilter): SystemLog[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level && filter.level !== "All") {
        filteredLogs = filteredLogs.filter((log) => log.level === filter.level);
      }

      if (filter.module) {
        filteredLogs = filteredLogs.filter((log) =>
          log.module.toLowerCase().includes(filter.module!.toLowerCase()),
        );
      }

      if (filter.user) {
        filteredLogs = filteredLogs.filter((log) =>
          log.user.toLowerCase().includes(filter.user!.toLowerCase()),
        );
      }

      if (filter.event) {
        filteredLogs = filteredLogs.filter(
          (log) =>
            log.event.toLowerCase().includes(filter.event!.toLowerCase()) ||
            log.action.toLowerCase().includes(filter.event!.toLowerCase()),
        );
      }

      if (filter.dateFrom) {
        const fromDate = new Date(filter.dateFrom);
        filteredLogs = filteredLogs.filter(
          (log) => new Date(log.timestamp) >= fromDate,
        );
      }

      if (filter.dateTo) {
        const toDate = new Date(filter.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        filteredLogs = filteredLogs.filter(
          (log) => new Date(log.timestamp) <= toDate,
        );
      }
    }

    return filteredLogs.reverse(); // Most recent first
  }

  /**
   * Get log statistics
   */
  public getLogStats(): LogStats {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = this.logs.filter(
      (log) => new Date(log.timestamp) >= today,
    );

    const errorLogs = this.logs.filter((log) => log.level === "Error");
    const warningLogs = this.logs.filter((log) => log.level === "Warning");
    const securityLogs = this.logs.filter((log) => log.level === "Security");

    // Top modules
    const moduleCount: { [key: string]: number } = {};
    this.logs.forEach((log) => {
      moduleCount[log.module] = (moduleCount[log.module] || 0) + 1;
    });

    const topModules = Object.entries(moduleCount)
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top users
    const userCount: { [key: string]: number } = {};
    this.logs.forEach((log) => {
      userCount[log.user] = (userCount[log.user] || 0) + 1;
    });

    const topUsers = Object.entries(userCount)
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recentErrors = errorLogs.slice(-10).reverse();

    return {
      totalLogs: this.logs.length,
      todayLogs: todayLogs.length,
      errorCount: errorLogs.length,
      warningCount: warningLogs.length,
      securityEvents: securityLogs.length,
      topModules,
      topUsers,
      recentErrors,
    };
  }

  /**
   * Export logs to different formats
   */
  public exportLogs(format: "json" | "csv", filter?: LogFilter): void {
    const logs = this.getLogs(filter);
    const timestamp = new Date().toISOString().split("T")[0];

    if (format === "json") {
      const dataStr = JSON.stringify(logs, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      this.downloadFile(dataBlob, `TSOAM_System_Logs_${timestamp}.json`);
    } else if (format === "csv") {
      const headers = [
        "ID",
        "Timestamp",
        "Level",
        "Event",
        "Description",
        "User",
        "IP Address",
        "Module",
        "Action",
        "Session ID",
        "Duration",
        "Success",
        "Details",
      ];

      const csvContent = [
        headers.join(","),
        ...logs.map((log) =>
          [
            log.id,
            log.timestamp,
            log.level,
            `"${log.event}"`,
            `"${log.description}"`,
            `"${log.user}"`,
            log.ipAddress,
            log.module,
            log.action,
            log.sessionId || "",
            log.duration || "",
            log.success !== undefined ? log.success.toString() : "",
            `"${log.details || ""}"`,
          ].join(","),
        ),
      ].join("\n");

      const dataBlob = new Blob([csvContent], { type: "text/csv" });
      this.downloadFile(dataBlob, `TSOAM_System_Logs_${timestamp}.csv`);
    }
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all logs (admin only)
   */
  public clearLogs(): void {
    this.logs = [];
    this.saveLogs();
    this.notifySubscribers();
    this.info(
      "System",
      "CLEAR_LOGS",
      "All system logs cleared by administrator",
    );
  }

  /**
   * Get unique modules
   */
  public getModules(): string[] {
    const modules = new Set(this.logs.map((log) => log.module));
    return Array.from(modules).sort();
  }

  /**
   * Get unique users
   */
  public getUsers(): string[] {
    const users = new Set(this.logs.map((log) => log.user));
    return Array.from(users).sort();
  }
}

// Export singleton instance
export const systemLoggingService = SystemLoggingService.getInstance();
export default systemLoggingService;
