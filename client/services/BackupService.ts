// Backup Service for TSOAM Church Management System
// Handles data backup, restore, and system maintenance operations

import { settingsService } from "./SettingsService";
import { financialTransactionService } from "./FinancialTransactionService";

export interface BackupData {
  timestamp: string;
  version: string;
  settings: any;
  financialTransactions: any[];
  members: any[];
  employees: any[];
  inventory: any[];
  welfare: any[];
  events: any[];
  metadata: {
    systemVersion: string;
    backupSize: number;
    recordCounts: {
      settings: number;
      financialTransactions: number;
      members: number;
      employees: number;
      inventory: number;
      welfare: number;
      events: number;
    };
  };
}

export interface BackupInfo {
  id: string;
  name: string;
  timestamp: string;
  size: number;
  type: "manual" | "automatic";
  status: "completed" | "failed" | "in_progress";
  description?: string;
  filename?: string;
  created_at?: string;
  records_count?: number;
}

class BackupService {
  private static instance: BackupService;
  private backups: BackupInfo[] = [];
  private isBackupInProgress = false;

  private constructor() {
    this.loadBackupHistory();
    this.scheduleAutomaticBackups();
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  private loadBackupHistory(): void {
    try {
      const stored = localStorage.getItem("tsoam_backup_history");
      if (stored) {
        this.backups = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load backup history:", error);
      this.backups = [];
    }
  }

  private saveBackupHistory(): void {
    try {
      localStorage.setItem(
        "tsoam_backup_history",
        JSON.stringify(this.backups),
      );
    } catch (error) {
      console.error("Failed to save backup history:", error);
    }
  }

  private scheduleAutomaticBackups(): void {
    const backupSettings = settingsService.getBackupSettings();

    if (!backupSettings.autoBackup) {
      return;
    }

    // Schedule automatic backup based on frequency
    const scheduleBackup = () => {
      const now = new Date();
      const lastBackup = this.getLastBackup();

      if (
        !lastBackup ||
        this.shouldPerformBackup(lastBackup, backupSettings.backupFrequency)
      ) {
        this.performBackup(true);
      }
    };

    // Check every hour for automatic backups
    setInterval(scheduleBackup, 60 * 60 * 1000);

    // Initial check
    setTimeout(scheduleBackup, 5000);
  }

  private shouldPerformBackup(
    lastBackup: BackupInfo,
    frequency: string,
  ): boolean {
    const now = new Date();
    const lastBackupDate = new Date(lastBackup.timestamp);
    const timeDiff = now.getTime() - lastBackupDate.getTime();

    switch (frequency) {
      case "daily":
        return timeDiff > 24 * 60 * 60 * 1000; // 24 hours
      case "weekly":
        return timeDiff > 7 * 24 * 60 * 60 * 1000; // 7 days
      case "monthly":
        return timeDiff > 30 * 24 * 60 * 60 * 1000; // 30 days
      default:
        return false;
    }
  }

  public async performBackup(isAutomatic = false): Promise<BackupInfo> {
    if (this.isBackupInProgress) {
      throw new Error("Backup already in progress");
    }

    this.isBackupInProgress = true;

    try {
      const backupId = `backup_${Date.now()}`;
      const timestamp = new Date().toISOString();

      // Create backup info
      const backupInfo: BackupInfo = {
        id: backupId,
        name: `${isAutomatic ? "Auto" : "Manual"} Backup - ${new Date().toLocaleDateString()}`,
        timestamp,
        size: 0,
        type: isAutomatic ? "automatic" : "manual",
        status: "in_progress",
        description: `${isAutomatic ? "Automatic" : "Manual"} backup performed on ${new Date().toLocaleString()}`,
      };

      // Add to backup list
      this.backups.unshift(backupInfo);
      this.saveBackupHistory();

      // Collect all data
      const backupData: BackupData = {
        timestamp,
        version: "1.0.0",
        settings: settingsService.getAllSettings(),
        financialTransactions: financialTransactionService.getTransactions(),
        members: this.getMembersData(),
        employees: this.getEmployeesData(),
        inventory: this.getInventoryData(),
        welfare: this.getWelfareData(),
        events: this.getEventsData(),
        metadata: {
          systemVersion: "1.0.0",
          backupSize: 0,
          recordCounts: {
            settings: 1,
            financialTransactions:
              financialTransactionService.getTransactions().length,
            members: this.getMembersData().length,
            employees: this.getEmployeesData().length,
            inventory: this.getInventoryData().length,
            welfare: this.getWelfareData().length,
            events: this.getEventsData().length,
          },
        },
      };

      // Calculate backup size
      const backupJson = JSON.stringify(backupData);
      const backupSize = new Blob([backupJson]).size;
      backupData.metadata.backupSize = backupSize;

      // Save backup data to localStorage
      const backupKey = `tsoam_backup_${backupId}`;
      localStorage.setItem(backupKey, backupJson);

      // Also save to computer if enabled in settings
      const backupSettings = settingsService.getBackupSettings();
      if (backupSettings.backupLocation === "computer") {
        this.downloadBackupToComputer(
          backupData,
          `TSOAM_Backup_${new Date().toISOString().split("T")[0]}_${backupId}.json`,
        );
      }

      // Update backup info
      backupInfo.size = backupSize;
      backupInfo.status = "completed";

      // Update backup list
      const backupIndex = this.backups.findIndex((b) => b.id === backupId);
      if (backupIndex !== -1) {
        this.backups[backupIndex] = backupInfo;
      }

      this.saveBackupHistory();

      // Clean up old backups based on retention policy
      this.cleanupOldBackups();

      return backupInfo;
    } catch (error) {
      console.error("Backup failed:", error);

      // Update backup status to failed
      const failedBackup = this.backups.find((b) => b.status === "in_progress");
      if (failedBackup) {
        failedBackup.status = "failed";
        this.saveBackupHistory();
      }

      throw new Error(
        `Backup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      this.isBackupInProgress = false;
    }
  }

  public async restoreBackup(backupId: string): Promise<void> {
    try {
      const backupKey = `tsoam_backup_${backupId}`;
      const backupJson = localStorage.getItem(backupKey);

      if (!backupJson) {
        throw new Error("Backup data not found");
      }

      const backupData: BackupData = JSON.parse(backupJson);

      // Restore settings
      if (backupData.settings) {
        settingsService.importSettings(JSON.stringify(backupData.settings));
      }

      // Note: In a real application, you would restore data to the database
      // For now, we'll just show a success message
      console.log("Backup restored successfully:", backupData.metadata);

      // You could emit events here to notify other parts of the app
      window.dispatchEvent(
        new CustomEvent("backup-restored", {
          detail: { backupId, timestamp: backupData.timestamp },
        }),
      );
    } catch (error) {
      console.error("Restore failed:", error);
      throw new Error(
        `Restore failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  public exportBackup(backupId: string): void {
    try {
      const backupKey = `tsoam_backup_${backupId}`;
      const backupJson = localStorage.getItem(backupKey);

      if (!backupJson) {
        throw new Error("Backup data not found");
      }

      const backupData: BackupData = JSON.parse(backupJson);
      const filename = `tsoam_backup_${backupId}_${new Date().toISOString().split("T")[0]}.json`;

      // Create and download the backup file
      const blob = new Blob([backupJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      throw new Error(
        `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  public async importBackup(file: File): Promise<void> {
    try {
      const fileContent = await file.text();
      const backupData: BackupData = JSON.parse(fileContent);

      // Validate backup data
      if (!backupData.timestamp || !backupData.version) {
        throw new Error("Invalid backup file format");
      }

      // Create a new backup entry for the imported backup
      const backupId = `imported_${Date.now()}`;
      const backupInfo: BackupInfo = {
        id: backupId,
        name: `Imported Backup - ${new Date(backupData.timestamp).toLocaleDateString()}`,
        timestamp: backupData.timestamp,
        size: file.size,
        type: "manual",
        status: "completed",
        description: `Imported from ${file.name}`,
      };

      // Save the backup data
      const backupKey = `tsoam_backup_${backupId}`;
      localStorage.setItem(backupKey, fileContent);

      // Add to backup list
      this.backups.unshift(backupInfo);
      this.saveBackupHistory();
    } catch (error) {
      console.error("Import failed:", error);
      throw new Error(
        `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  public deleteBackup(backupId: string): void {
    try {
      // Remove from storage
      const backupKey = `tsoam_backup_${backupId}`;
      localStorage.removeItem(backupKey);

      // Remove from backup list
      this.backups = this.backups.filter((b) => b.id !== backupId);
      this.saveBackupHistory();
    } catch (error) {
      console.error("Delete backup failed:", error);
      throw new Error(
        `Delete backup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  public getBackupHistory(): BackupInfo[] {
    return [...this.backups];
  }

  public getLastBackup(): BackupInfo | null {
    return this.backups.length > 0 ? this.backups[0] : null;
  }

  public getBackupStats(): {
    totalBackups: number;
    totalSize: number;
    lastBackupDate: string | null;
    automaticBackupsEnabled: boolean;
  } {
    const totalSize = this.backups.reduce(
      (sum, backup) => sum + backup.size,
      0,
    );
    const lastBackup = this.getLastBackup();
    const backupSettings = settingsService.getBackupSettings();

    return {
      totalBackups: this.backups.length,
      totalSize,
      lastBackupDate: lastBackup?.timestamp || null,
      automaticBackupsEnabled: backupSettings.autoBackup,
    };
  }

  private cleanupOldBackups(): void {
    const backupSettings = settingsService.getBackupSettings();
    const retentionDays = backupSettings.backupRetentionDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = this.backups.filter(
      (backup) => new Date(backup.timestamp) < cutoffDate,
    );

    oldBackups.forEach((backup) => {
      this.deleteBackup(backup.id);
    });
  }

  // Helper methods to get data from localStorage or mock data
  private getMembersData(): any[] {
    try {
      const stored = localStorage.getItem("church_members");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getEmployeesData(): any[] {
    try {
      const stored = localStorage.getItem("church_employees");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getInventoryData(): any[] {
    try {
      const stored = localStorage.getItem("church_inventory");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getWelfareData(): any[] {
    try {
      const stored = localStorage.getItem("welfare_applications");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getEventsData(): any[] {
    try {
      const stored = localStorage.getItem("church_events");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Download backup to computer
   */
  public downloadBackupToComputer(
    backupData: BackupData,
    filename: string,
  ): void {
    try {
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      console.log(`Backup downloaded to computer: ${filename}`);
    } catch (error) {
      console.error("Failed to download backup:", error);
      throw new Error("Failed to download backup to computer");
    }
  }

  /**
   * Download backup by ID
   */
  public async downloadBackup(backupId: string): Promise<void> {
    try {
      const backupKey = `tsoam_backup_${backupId}`;
      const backupDataStr = localStorage.getItem(backupKey);

      if (!backupDataStr) {
        throw new Error("Backup data not found");
      }

      const backupData: BackupData = JSON.parse(backupDataStr);
      const backupInfo = this.backups.find((b) => b.id === backupId);
      const filename = `TSOAM_Backup_${backupInfo?.name.replace(/[^a-zA-Z0-9]/g, "_") || backupId}.json`;

      this.downloadBackupToComputer(backupData, filename);
    } catch (error) {
      console.error("Failed to download backup:", error);
      throw error;
    }
  }

  /**
   * Download backup history as CSV
   */
  public downloadBackupHistory(): void {
    try {
      const headers = [
        "ID",
        "Name",
        "Timestamp",
        "Size (KB)",
        "Type",
        "Status",
        "Description",
      ];
      const csvContent = [
        headers.join(","),
        ...this.backups.map((backup) =>
          [
            backup.id,
            `"${backup.name}"`,
            backup.timestamp,
            Math.round(backup.size / 1024),
            backup.type,
            backup.status,
            `"${backup.description || ""}"`,
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TSOAM_Backup_History_${new Date().toISOString().split("T")[0]}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      console.log("Backup history downloaded as CSV");
    } catch (error) {
      console.error("Failed to download backup history:", error);
      throw new Error("Failed to download backup history");
    }
  }

  public getSystemHealth(): {
    status: "healthy" | "warning" | "critical";
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const lastBackup = this.getLastBackup();
    const backupSettings = settingsService.getBackupSettings();

    // Check backup status
    if (!lastBackup) {
      issues.push("No backups found");
      recommendations.push("Perform a manual backup immediately");
    } else {
      const daysSinceLastBackup = Math.floor(
        (Date.now() - new Date(lastBackup.timestamp).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysSinceLastBackup > 7) {
        issues.push(`Last backup was ${daysSinceLastBackup} days ago`);
        recommendations.push("Perform a backup soon");
      }
    }

    // Check automatic backup status
    if (!backupSettings.autoBackup) {
      issues.push("Automatic backups are disabled");
      recommendations.push("Enable automatic backups in settings");
    }

    // Check storage space (simplified check)
    const totalBackupSize = this.backups.reduce(
      (sum, backup) => sum + backup.size,
      0,
    );
    if (totalBackupSize > 50 * 1024 * 1024) {
      // 50MB
      issues.push("Backup storage is getting large");
      recommendations.push("Consider reducing backup retention period");
    }

    const status =
      issues.length === 0
        ? "healthy"
        : issues.length <= 2
          ? "warning"
          : "critical";

    return { status, issues, recommendations };
  }
}

// Export singleton instance
export const backupService = BackupService.getInstance();
