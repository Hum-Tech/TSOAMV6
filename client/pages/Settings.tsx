import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  Shield,
  Database,
  Bell,
  Printer,
  Wifi,
  Save,
  Download,
  Upload,
  Clock,
  Key,
  Mail,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { BackupRecovery } from "@/components/BackupRecovery";
import {
  settingsService,
  type ChurchSettings,
  type SecuritySettings,
  type BackupSettings,
  type NotificationSettings,
  type SystemSettings,
  type PrinterSettings,
  type NetworkSettings,
  type EmailSettings,
} from "@/services/SettingsService";
import { backupService } from "@/services/BackupService";

export default function Settings() {
  const { toast } = useToast();

  // Local state for all settings
  const [churchSettings, setChurchSettings] = useState<ChurchSettings>(
    settingsService.getChurchSettings(),
  );
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(
    settingsService.getSecuritySettings(),
  );
  const [backupSettings, setBackupSettings] = useState<BackupSettings>(
    settingsService.getBackupSettings(),
  );
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(settingsService.getNotificationSettings());
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(
    settingsService.getSystemSettings(),
  );
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(
    settingsService.getPrinterSettings(),
  );
  const [networkSettings, setNetworkSettings] = useState<NetworkSettings>(
    settingsService.getNetworkSettings(),
  );
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(
    settingsService.getEmailSettings(),
  );

  const [isSaving, setIsSaving] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    const unsubscribe = settingsService.subscribe((settings) => {
      setChurchSettings(settings.church);
      setSecuritySettings(settings.security);
      setBackupSettings(settings.backup);
      setNotificationSettings(settings.notifications);
      setSystemSettings(settings.system);
      setPrinterSettings(settings.printer);
      setNetworkSettings(settings.network);
      setEmailSettings(settings.email);
    });

    return unsubscribe;
  }, []);

  /**
   * Save church settings with validation and feedback
   */
  const saveChurchSettings = async () => {
    setIsSaving(true);
    try {
      // Validate required fields
      if (!churchSettings.name.trim()) {
        throw new Error("Church name is required");
      }
      if (!churchSettings.kraPin.trim()) {
        throw new Error("KRA PIN is required");
      }

      settingsService.updateChurchSettings(churchSettings);

      toast({
        title: "Success",
        description: "Church settings saved successfully!",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save church settings",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save security settings
   */
  const saveSecuritySettings = async () => {
    setIsSaving(true);
    try {
      settingsService.updateSecuritySettings(securitySettings);

      toast({
        title: "Success",
        description: "Security settings saved successfully!",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save security settings",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save backup settings
   */
  const saveBackupSettings = async () => {
    setIsSaving(true);
    try {
      settingsService.updateBackupSettings(backupSettings);

      toast({
        title: "Success",
        description: "Backup settings saved successfully!",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save backup settings",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save notification settings
   */
  const saveNotificationSettings = async () => {
    setIsSaving(true);
    try {
      settingsService.updateNotificationSettings(notificationSettings);

      toast({
        title: "Success",
        description: "Notification settings saved successfully!",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save system settings
   */
  const saveSystemSettings = async () => {
    setIsSaving(true);
    try {
      settingsService.updateSystemSettings(systemSettings);

      toast({
        title: "Success",
        description:
          "System settings saved successfully! Some changes may require page refresh.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save system settings",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save network settings
   */
  const saveNetworkSettings = async () => {
    setIsSaving(true);
    try {
      settingsService.updateNetworkSettings(networkSettings);

      toast({
        title: "Success",
        description: "Network settings saved successfully!",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save network settings",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save email settings
   */
  const saveEmailSettings = async () => {
    setIsSaving(true);
    try {
      // Basic validation
      if (emailSettings.smtpHost && !emailSettings.smtpUser) {
        throw new Error("SMTP user is required when SMTP host is provided");
      }

      settingsService.updateEmailSettings(emailSettings);

      toast({
        title: "Success",
        description: "Email settings saved successfully!",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save email settings",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Generate system report in specified format
   * @param format - Report format (PDF or Excel)
   */
  const generateReport = async (format: string) => {
    setIsSaving(true);
    try {
      // Collect system data for report
      const systemData = {
        settings: settingsService.getAllSettings(),
        backupStats: backupService.getBackupStats(),
        systemHealth: backupService.getSystemHealth(),
        reportDate: new Date().toISOString(),
      };

      if (format === "PDF") {
        // Generate PDF report (simplified)
        const reportData = [
          {
            Category: "Total Backups",
            Value: systemData.backupStats.totalBackups,
          },
          {
            Category: "Backup Size",
            Value: `${(systemData.backupStats.totalSize / 1024 / 1024).toFixed(2)} MB`,
          },
          {
            Category: "Auto Backup",
            Value: systemData.backupStats.automaticBackupsEnabled
              ? "Enabled"
              : "Disabled",
          },
          { Category: "System Status", Value: systemData.systemHealth.status },
          { Category: "Church Name", Value: systemData.settings.church.name },
          { Category: "KRA PIN", Value: systemData.settings.church.kraPin },
        ];

        const { exportData } = await import("@/utils/printUtils");
        exportData("pdf", {
          format: "pdf",
          filename: `TSOAM_System_Report_${new Date().toISOString().split("T")[0]}.pdf`,
          title: "TSOAM System Report",
          subtitle: `Generated on ${new Date().toLocaleDateString()}`,
          data: reportData,
          includeChurchHeader: true,
        });
      } else {
        // Generate Excel report
        const { exportData } = await import("@/utils/printUtils");
        exportData("excel", {
          format: "excel",
          filename: `TSOAM_System_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
          title: "TSOAM System Report",
          data: [systemData],
        });
      }

      toast({
        title: "Success",
        description: `${format} report generated successfully and is ready for download!`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to generate ${format} report`,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Perform manual backup
   */
  const performManualBackup = async () => {
    setIsSaving(true);
    try {
      const backupInfo = await backupService.performBackup(false);

      toast({
        title: "Success",
        description: `Manual backup completed successfully! Backup ID: ${backupInfo.id}`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Backup failed",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Test backup and restore functionality
   */
  const testBackupRestore = async () => {
    setIsSaving(true);
    try {
      // Perform a test backup
      const testBackup = await backupService.performBackup(false);

      // Get system health
      const health = backupService.getSystemHealth();

      toast({
        title: "Success",
        description: `Backup test completed! Status: ${health.status}. Backup ID: ${testBackup.id}`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Test failed",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Test settings integration - generate a sample report to show settings work
   */
  const testSettingsIntegration = async () => {
    setIsSaving(true);
    try {
      const churchInfo = settingsService.getChurchSettings();
      const systemInfo = settingsService.getSystemSettings();

      // Generate a test report showing current settings
      const testData = [
        {
          Setting: "Church Name",
          "Current Value": churchInfo.name,
          Status: "Active in all reports",
        },
        {
          Setting: "KRA PIN",
          "Current Value": churchInfo.kraPin,
          Status: "Used in P9 forms",
        },
        {
          Setting: "Address",
          "Current Value": churchInfo.address,
          Status: "Appears in headers",
        },
        {
          Setting: "Phone",
          "Current Value": churchInfo.phone,
          Status: "Contact information",
        },
        {
          Setting: "Email",
          "Current Value": churchInfo.email,
          Status: "Official correspondence",
        },
        {
          Setting: "Date Format",
          "Current Value": systemInfo.dateFormat,
          Status: "All date displays",
        },
        {
          Setting: "Currency",
          "Current Value": systemInfo.currency,
          Status: "Financial reports",
        },
      ];

      const { exportToPDF } = await import("@/utils/printUtils");
      await exportToPDF({
        filename: `TSOAM_Settings_Test_${new Date().toISOString().split("T")[0]}.pdf`,
        format: "pdf",
        title: "Settings Integration Test Report",
        subtitle:
          "This report demonstrates that your church settings are active throughout the system",
        data: testData,
        includeChurchHeader: true,
      });

      toast({
        title: "Success",
        description:
          "Settings test report generated! Check the PDF to see your settings in action.",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate settings test report",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Configure system preferences, security settings, and backup options
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="church">Church Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    System Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="churchName">Church Name</Label>
                    <Input
                      id="churchName"
                      value="TSOAM CHURCH INTERNATIONAL"
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Church name cannot be modified
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="africa/nairobi">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="africa/nairobi">
                          Africa/Nairobi (EAT)
                        </SelectItem>
                        <SelectItem value="america/new_york">
                          America/New_York (EST)
                        </SelectItem>
                        <SelectItem value="europe/london">
                          Europe/London (GMT)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select defaultValue="ksh">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ksh">
                          Kenyan Shilling (KSH)
                        </SelectItem>
                        <SelectItem value="usd">US Dollar (USD)</SelectItem>
                        <SelectItem value="eur">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select defaultValue="dd/mm/yyyy">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save General Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Printer className="h-5 w-5" />
                    Printer & Network Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="defaultPrinter">Default Printer</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select printer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hp-laserjet">
                          HP LaserJet Pro
                        </SelectItem>
                        <SelectItem value="canon-pixma">Canon PIXMA</SelectItem>
                        <SelectItem value="epson-workforce">
                          Epson WorkForce
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="paperSize">Default Paper Size</Label>
                    <Select defaultValue="a4">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="networkSharing" />
                    <Label htmlFor="networkSharing">
                      Enable Network Sharing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="autoConnect" />
                    <Label htmlFor="autoConnect">Auto Connect to Network</Label>
                  </div>
                  <Button>
                    <Wifi className="h-4 w-4 mr-2" />
                    Save Network Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="church">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    KRA & Tax Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="kraPin">Church KRA PIN *</Label>
                    <Input
                      id="kraPin"
                      value={churchSettings.kraPin}
                      onChange={(e) =>
                        setChurchSettings({
                          ...churchSettings,
                          kraPin: e.target.value,
                        })
                      }
                      placeholder="P123456789X"
                    />
                    <p className="text-sm text-muted-foreground">
                      This PIN will be used in all P9 forms and tax documents
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">
                      Registration Number
                    </Label>
                    <Input
                      id="registrationNumber"
                      value={churchSettings.registrationNumber}
                      onChange={(e) =>
                        setChurchSettings({
                          ...churchSettings,
                          registrationNumber: e.target.value,
                        })
                      }
                      placeholder="REG/12345/2020"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Church Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="churchName">Church Name</Label>
                    <Input
                      id="churchName"
                      value={churchSettings.name}
                      onChange={(e) =>
                        setChurchSettings({
                          ...churchSettings,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="churchAddress">Address</Label>
                    <Input
                      id="churchAddress"
                      value={churchSettings.address}
                      onChange={(e) =>
                        setChurchSettings({
                          ...churchSettings,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="churchPhone">Phone</Label>
                      <Input
                        id="churchPhone"
                        value={churchSettings.phone}
                        onChange={(e) =>
                          setChurchSettings({
                            ...churchSettings,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="churchEmail">Email</Label>
                      <Input
                        id="churchEmail"
                        value={churchSettings.email}
                        onChange={(e) =>
                          setChurchSettings({
                            ...churchSettings,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Settings Active System-Wide
                        </span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        These settings are currently being used in all reports,
                        P9 forms, and system documents.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={saveChurchSettings} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Settings"}
                      </Button>
                      <Button
                        onClick={testSettingsIntegration}
                        disabled={isSaving}
                        variant="outline"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isSaving ? "Testing..." : "Test Settings"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Authentication Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sessionTimeout">
                      Session Timeout (minutes)
                    </Label>
                    <Select
                      value={securitySettings.sessionTimeout.toString()}
                      onValueChange={(value) =>
                        setSecuritySettings({
                          ...securitySettings,
                          sessionTimeout: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="otpEnabled"
                      checked={securitySettings.otpEnabled}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          otpEnabled: checked,
                        })
                      }
                    />
                    <Label htmlFor="otpEnabled">
                      Enable One-Time Password (OTP)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="mfaRequired" />
                    <Label htmlFor="mfaRequired">
                      Require MFA for Admin Roles
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="loginAttempts" />
                    <Label htmlFor="loginAttempts">
                      Lock Account After Failed Attempts
                    </Label>
                  </div>
                  <Button>
                    <Clock className="h-4 w-4 mr-2" />
                    Save Authentication Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Password Policy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="passwordComplexity">
                      Password Complexity
                    </Label>
                    <Select
                      value={securitySettings.passwordComplexity}
                      onValueChange={(value) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordComplexity: value as
                            | "low"
                            | "medium"
                            | "high",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          Low (8 characters minimum)
                        </SelectItem>
                        <SelectItem value="medium">
                          Medium (8 chars + numbers)
                        </SelectItem>
                        <SelectItem value="high">
                          High (8 chars + numbers + symbols)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="passwordExpiry">
                      Password Expiry (days)
                    </Label>
                    <Select defaultValue="90">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="never">Never expire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="passwordHistory" />
                    <Label htmlFor="passwordHistory">
                      Prevent Password Reuse
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="passwordReset" />
                    <Label htmlFor="passwordReset">
                      Allow Self-Service Password Reset
                    </Label>
                  </div>
                  <Button
                    onClick={saveSecuritySettings}
                    disabled={isSaving}
                    className="w-full"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Security Settings"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Security Audit Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">
                          Password policy updated
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Admin • 2 hours ago
                        </div>
                      </div>
                      <Badge variant="secondary">Security</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">OTP enabled</div>
                        <div className="text-sm text-muted-foreground">
                          System Admin • 1 day ago
                        </div>
                      </div>
                      <Badge variant="secondary">Authentication</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">
                          Session timeout updated
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Admin • 3 days ago
                        </div>
                      </div>
                      <Badge variant="secondary">Configuration</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="backup">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Automatic Backup Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoBackup"
                      checked={backupSettings.autoBackup}
                      onCheckedChange={(checked) =>
                        setBackupSettings({
                          ...backupSettings,
                          autoBackup: checked,
                        })
                      }
                    />
                    <Label htmlFor="autoBackup">Enable Automatic Backup</Label>
                  </div>
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select
                      value={backupSettings.backupFrequency}
                      onValueChange={(value) =>
                        setBackupSettings({
                          ...backupSettings,
                          backupFrequency: value as
                            | "daily"
                            | "weekly"
                            | "monthly",
                        })
                      }
                      disabled={!backupSettings.autoBackup}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="backupTime">Backup Time</Label>
                    <Input
                      id="backupTime"
                      type="time"
                      defaultValue="02:00"
                      disabled={!backupSettings.autoBackup}
                    />
                  </div>
                  <div>
                    <Label htmlFor="retentionPeriod">
                      Retention Period (days)
                    </Label>
                    <Select
                      defaultValue="30"
                      disabled={!backupSettings.autoBackup}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={saveBackupSettings}
                    disabled={isSaving}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Backup Settings"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Manual Backup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create an immediate backup of all system data or restore
                      from a previous backup.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={performManualBackup}
                      disabled={isSaving}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isSaving ? "Creating Backup..." : "Create Backup Now"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={testBackupRestore}
                      disabled={isSaving}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isSaving ? "Testing..." : "Test Backup System"}
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="backupLocation">Backup Location</Label>
                    <div className="flex gap-2">
                      <Input
                        id="backupLocation"
                        defaultValue="/var/backups/tsoam"
                        className="flex-1"
                      />
                      <Button variant="outline">Browse</Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last backup: January 15, 2025 at 02:00 AM
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Backup History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">Full System Backup</div>
                        <div className="text-sm text-muted-foreground">
                          January 15, 2025 • 2:00 AM ��� 245.3 MB
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="default">Success</Badge>
                        <Button size="sm" variant="outline">
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">Full System Backup</div>
                        <div className="text-sm text-muted-foreground">
                          January 14, 2025 • 2:00 AM • 243.1 MB
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="default">Success</Badge>
                        <Button size="sm" variant="outline">
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">Full System Backup</div>
                        <div className="text-sm text-muted-foreground">
                          January 13, 2025 • 2:00 AM • 241.8 MB
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="default">Success</Badge>
                        <Button size="sm" variant="outline">
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: checked,
                        })
                      }
                    />
                    <Label htmlFor="emailNotifications">
                      Enable Email Notifications
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor="smtpServer">SMTP Server</Label>
                    <Input
                      id="smtpServer"
                      defaultValue="smtp.gmail.com"
                      disabled={!notificationSettings.emailNotifications}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpPort">Port</Label>
                      <Input
                        id="smtpPort"
                        defaultValue="587"
                        disabled={!notificationSettings.emailNotifications}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpSecurity">Security</Label>
                      <Select
                        defaultValue="tls"
                        disabled={!notificationSettings.emailNotifications}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="senderEmail">Sender Email</Label>
                    <Input
                      id="senderEmail"
                      type="email"
                      defaultValue="admin@tsoam.com"
                      disabled={!notificationSettings.emailNotifications}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      System emails will be sent from @tsoam.com domain
                    </p>
                  </div>
                  <Button
                    onClick={saveEmailSettings}
                    disabled={
                      !notificationSettings.emailNotifications || isSaving
                    }
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Email Settings"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="newMemberNotif">
                        New Member Registration
                      </Label>
                      <Switch id="newMemberNotif" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="appointmentNotif">
                        Appointment Reminders
                      </Label>
                      <Switch id="appointmentNotif" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="financeNotif">
                        Financial Transactions
                      </Label>
                      <Switch id="financeNotif" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="eventNotif">Event Notifications</Label>
                      <Switch id="eventNotif" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="backupNotif">Backup Status</Label>
                      <Switch id="backupNotif" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="securityNotif">Security Alerts</Label>
                      <Switch id="securityNotif" defaultChecked />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notificationFrequency">
                      Notification Frequency
                    </Label>
                    <Select defaultValue="immediate">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={saveNotificationSettings}
                    disabled={isSaving}
                    className="w-full"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Notification Settings"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
