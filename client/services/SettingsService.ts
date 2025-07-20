// Comprehensive Settings Service
// Manages all system settings and ensures they are effective throughout the application

export interface ChurchSettings {
  name: string;
  kraPin: string;
  address: string;
  phone: string;
  email: string;
  registrationNumber: string;
  website?: string;
  logoUrl?: string;
  establishedYear?: string;
  motto?: string;
}

export interface SecuritySettings {
  otpEnabled: boolean;
  sessionTimeout: number; // in minutes
  passwordComplexity: "low" | "medium" | "high";
  maxLoginAttempts: number;
  requirePasswordChange: boolean;
  passwordChangeInterval: number; // in days
}

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
  backupRetentionDays: number;
  backupLocation: string;
  backupTime: string; // HH:MM format
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  systemAlerts: boolean;
  lowStockAlerts: boolean;
  payrollReminders: boolean;
  membershipAlerts: boolean;
  eventReminders: boolean;
}

export interface SystemSettings {
  timezone: string;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  currency: string;
  language: "en" | "sw";
  theme: "light" | "dark" | "auto";
  defaultPageSize: number;
}

export interface PrinterSettings {
  defaultPrinter: string;
  paperSize: "A4" | "Letter" | "Legal";
  orientation: "portrait" | "landscape";
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface NetworkSettings {
  serverUrl: string;
  apiTimeout: number;
  enableSSL: boolean;
  proxyEnabled: boolean;
  proxyHost?: string;
  proxyPort?: number;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  senderName: string;
  senderEmail: string;
  enableTLS: boolean;
}

export interface AllSettings {
  church: ChurchSettings;
  security: SecuritySettings;
  backup: BackupSettings;
  notifications: NotificationSettings;
  system: SystemSettings;
  printer: PrinterSettings;
  network: NetworkSettings;
  email: EmailSettings;
}

class SettingsService {
  private static instance: SettingsService;
  private settings: AllSettings;
  private subscribers: Array<(settings: AllSettings) => void> = [];
  private readonly STORAGE_KEY = "tsoam_settings";

  private constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  private getDefaultSettings(): AllSettings {
    return {
      church: {
        name: "THE SEED OF ABRAHAM MINISTRY",
        kraPin: "P123456789X",
        address: "P.O. Box 12345, Nairobi, Kenya",
        phone: "+254 700 123 456",
        email: "info@tsoam.org",
        registrationNumber: "REG/12345/2020",
        website: "https://tsoam.org",
        establishedYear: "2000",
        motto: "Growing in Faith, Serving in Love",
      },
      security: {
        otpEnabled: true,
        sessionTimeout: 30,
        passwordComplexity: "medium",
        maxLoginAttempts: 5,
        requirePasswordChange: false,
        passwordChangeInterval: 90,
      },
      backup: {
        autoBackup: true,
        backupFrequency: "daily",
        backupRetentionDays: 30,
        backupLocation: "/var/backups/tsoam",
        backupTime: "02:00",
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        systemAlerts: true,
        lowStockAlerts: true,
        payrollReminders: true,
        membershipAlerts: true,
        eventReminders: true,
      },
      system: {
        timezone: "Africa/Nairobi",
        dateFormat: "DD/MM/YYYY",
        currency: "KSh",
        language: "en",
        theme: "light",
        defaultPageSize: 25,
      },
      printer: {
        defaultPrinter: "Default Printer",
        paperSize: "A4",
        orientation: "portrait",
        margins: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20,
        },
      },
      network: {
        serverUrl: "http://localhost:3001",
        apiTimeout: 30000,
        enableSSL: false,
        proxyEnabled: false,
      },
      email: {
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
        smtpUser: "",
        smtpPassword: "",
        senderName: "TSOAM Church",
        senderEmail: "noreply@tsoam.org",
        enableTLS: true,
      },
    };
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        this.settings = this.mergeWithDefaults(parsedSettings);
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
      this.settings = this.getDefaultSettings();
    }
  }

  private mergeWithDefaults(stored: Partial<AllSettings>): AllSettings {
    const defaults = this.getDefaultSettings();
    return {
      church: { ...defaults.church, ...stored.church },
      security: { ...defaults.security, ...stored.security },
      backup: { ...defaults.backup, ...stored.backup },
      notifications: { ...defaults.notifications, ...stored.notifications },
      system: { ...defaults.system, ...stored.system },
      printer: { ...defaults.printer, ...stored.printer },
      network: { ...defaults.network, ...stored.network },
      email: { ...defaults.email, ...stored.email },
    };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
      this.notifySubscribers();
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
      throw new Error("Failed to save settings. Please try again.");
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback(this.settings));
  }

  // Subscribe to settings changes
  public subscribe(callback: (settings: AllSettings) => void): () => void {
    this.subscribers.push(callback);
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  }

  // Get all settings
  public getAllSettings(): AllSettings {
    return { ...this.settings };
  }

  // Get specific setting category
  public getChurchSettings(): ChurchSettings {
    return { ...this.settings.church };
  }

  public getSecuritySettings(): SecuritySettings {
    return { ...this.settings.security };
  }

  public getBackupSettings(): BackupSettings {
    return { ...this.settings.backup };
  }

  public getNotificationSettings(): NotificationSettings {
    return { ...this.settings.notifications };
  }

  public getSystemSettings(): SystemSettings {
    return { ...this.settings.system };
  }

  public getPrinterSettings(): PrinterSettings {
    return { ...this.settings.printer };
  }

  public getNetworkSettings(): NetworkSettings {
    return { ...this.settings.network };
  }

  public getEmailSettings(): EmailSettings {
    return { ...this.settings.email };
  }

  // Update specific setting categories
  public updateChurchSettings(settings: Partial<ChurchSettings>): void {
    this.settings.church = { ...this.settings.church, ...settings };
    this.saveSettings();
  }

  public updateSecuritySettings(settings: Partial<SecuritySettings>): void {
    this.settings.security = { ...this.settings.security, ...settings };
    this.saveSettings();
  }

  public updateBackupSettings(settings: Partial<BackupSettings>): void {
    this.settings.backup = { ...this.settings.backup, ...settings };
    this.saveSettings();
  }

  public updateNotificationSettings(
    settings: Partial<NotificationSettings>,
  ): void {
    this.settings.notifications = {
      ...this.settings.notifications,
      ...settings,
    };
    this.saveSettings();
  }

  public updateSystemSettings(settings: Partial<SystemSettings>): void {
    this.settings.system = { ...this.settings.system, ...settings };
    this.saveSettings();
  }

  public updatePrinterSettings(settings: Partial<PrinterSettings>): void {
    this.settings.printer = { ...this.settings.printer, ...settings };
    this.saveSettings();
  }

  public updateNetworkSettings(settings: Partial<NetworkSettings>): void {
    this.settings.network = { ...this.settings.network, ...settings };
    this.saveSettings();
  }

  public updateEmailSettings(settings: Partial<EmailSettings>): void {
    this.settings.email = { ...this.settings.email, ...settings };
    this.saveSettings();
  }

  // Utility methods for common operations
  public getChurchName(): string {
    return this.settings.church.name;
  }

  public getKRAPin(): string {
    return this.settings.church.kraPin;
  }

  public getCurrency(): string {
    return this.settings.system.currency;
  }

  public getDateFormat(): string {
    return this.settings.system.dateFormat;
  }

  public getTimezone(): string {
    return this.settings.system.timezone;
  }

  public isOTPEnabled(): boolean {
    return this.settings.security.otpEnabled;
  }

  public getSessionTimeout(): number {
    return this.settings.security.sessionTimeout;
  }

  public isAutoBackupEnabled(): boolean {
    return this.settings.backup.autoBackup;
  }

  public areEmailNotificationsEnabled(): boolean {
    return this.settings.notifications.emailNotifications;
  }

  // Reset to defaults
  public resetToDefaults(): void {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
  }

  // Export settings for backup
  public exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  // Import settings from backup
  public importSettings(settingsJson: string): void {
    try {
      const importedSettings = JSON.parse(settingsJson);
      this.settings = this.mergeWithDefaults(importedSettings);
      this.saveSettings();
    } catch (error) {
      throw new Error(
        "Invalid settings format. Please check the imported file.",
      );
    }
  }

  // Validate settings
  public validateSettings(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate church settings
    if (!this.settings.church.name.trim()) {
      errors.push("Church name is required");
    }
    if (!this.settings.church.kraPin.trim()) {
      errors.push("KRA PIN is required");
    }

    // Validate security settings
    if (
      this.settings.security.sessionTimeout < 5 ||
      this.settings.security.sessionTimeout > 480
    ) {
      errors.push("Session timeout must be between 5 and 480 minutes");
    }

    // Validate backup settings
    if (this.settings.backup.backupRetentionDays < 1) {
      errors.push("Backup retention must be at least 1 day");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const settingsService = SettingsService.getInstance();

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  const currency = settingsService.getCurrency();
  return `${currency} ${amount.toLocaleString()}`;
};

// Helper function to format date
export const formatDate = (date: string | Date): string => {
  const format = settingsService.getDateFormat();
  const dateObj = typeof date === "string" ? new Date(date) : date;

  switch (format) {
    case "DD/MM/YYYY":
      return dateObj.toLocaleDateString("en-GB");
    case "MM/DD/YYYY":
      return dateObj.toLocaleDateString("en-US");
    case "YYYY-MM-DD":
      return dateObj.toISOString().split("T")[0];
    default:
      return dateObj.toLocaleDateString();
  }
};
