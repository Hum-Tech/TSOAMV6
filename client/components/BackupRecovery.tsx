import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  Download,
  Upload,
  Database,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Calendar,
  FileText,
  Shield,
  Settings,
} from "lucide-react";
import { backupService, type BackupInfo } from "@/services/BackupService";
import { systemLoggingService } from "@/services/SystemLoggingService";

export function BackupRecovery() {
  const [backupFiles, setBackupFiles] = useState<BackupInfo[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [selectedRestoreFile, setSelectedRestoreFile] = useState<string>("");
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [selectedBackupType, setSelectedBackupType] = useState<string>("full");
  const [showCreateJobDialog, setShowCreateJobDialog] = useState(false);
  const [newJob, setNewJob] = useState({
    name: "",
    schedule: "daily",
    type: "full",
    enabled: true,
  });
  const [backupJobs, setBackupJobs] = useState<any[]>([]);

  const fetchBackupData = () => {
    loadBackupData();
  };

  const loadBackupData = () => {
    try {
      const backups = backupService.getBackupHistory();
      setBackupFiles(backups);

      const health = backupService.getSystemHealth();
      setSystemHealth(health);
    } catch (error) {
      console.error("Failed to load backup data:", error);
      systemLoggingService.error(
        "Backup",
        "LOAD_BACKUP_DATA",
        "Failed to load backup data",
        { error: error.message },
      );
    }
  };

  useEffect(() => {
    loadBackupData();
    // Refresh every 30 seconds
    const interval = setInterval(loadBackupData, 30000);
    return () => clearInterval(interval);
  }, []);

  const createBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      systemLoggingService.info(
        "Backup",
        "BACKUP_START",
        "Manual backup initiated by user",
      );

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setBackupProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const backup = await backupService.performBackup(false);

      clearInterval(progressInterval);
      setBackupProgress(100);

      setTimeout(() => {
        setIsCreatingBackup(false);
        setBackupProgress(0);
        loadBackupData(); // Refresh list

        toast({
          title: "Backup Completed",
          description: `Backup created successfully! Size: ${Math.round(backup.size / 1024)}KB`,
        });

        systemLoggingService.info(
          "Backup",
          "BACKUP_COMPLETE",
          `Manual backup completed successfully`,
          { backupId: backup.id, size: backup.size },
        );
      }, 500);
    } catch (error) {
      console.error("Backup creation error:", error);
      setIsCreatingBackup(false);
      setBackupProgress(0);

      systemLoggingService.error(
        "Backup",
        "BACKUP_FAILED",
        "Manual backup failed",
        { error: error.message },
      );

      toast({
        title: "Backup Failed",
        description:
          error instanceof Error ? error.message : "Failed to create backup",
        variant: "destructive",
      });
    }
  };

  const restoreBackup = async () => {
    if (!selectedRestoreFile) {
      toast({
        title: "No File Selected",
        description: "Please select a backup file to restore.",
        variant: "destructive",
      });
      return;
    }

    const confirmRestore = window.confirm(
      "⚠️ WARNING: This will replace ALL current data with the backup data. This action cannot be undone. Are you sure you want to continue?",
    );

    if (!confirmRestore) return;

    setIsRestoring(true);
    setRestoreProgress(0);

    try {
      const response = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backup_file: selectedRestoreFile,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setRestoreProgress((prev) => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              setIsRestoring(false);
              toast({
                title: "Restore Completed",
                description: "Database restored successfully.",
              });
              // Refresh page to reload new data
              window.location.reload();
              return 100;
            }
            return prev + 8;
          });
        }, 600);
      } else {
        throw new Error(result.error || "Restore failed");
      }
    } catch (error) {
      console.error("Restore error:", error);
      setIsRestoring(false);
      setRestoreProgress(0);
      toast({
        title: "Restore Failed",
        description: "Failed to restore database.",
        variant: "destructive",
      });
    }
  };

  const downloadBackup = async (backupId: string) => {
    try {
      systemLoggingService.info(
        "Backup",
        "BACKUP_DOWNLOAD_START",
        `Backup download initiated for ID: ${backupId}`,
      );

      await backupService.downloadBackup(backupId);

      toast({
        title: "Download Started",
        description: "Backup file download started successfully.",
      });

      systemLoggingService.info(
        "Backup",
        "BACKUP_DOWNLOAD_SUCCESS",
        `Backup downloaded successfully`,
        { backupId },
      );
    } catch (error) {
      console.error("Download error:", error);

      systemLoggingService.error(
        "Backup",
        "BACKUP_DOWNLOAD_FAILED",
        "Failed to download backup",
        { backupId, error: error.message },
      );

      toast({
        title: "Download Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to download backup file.",
        variant: "destructive",
      });
    }
  };

  const downloadBackupHistory = async () => {
    try {
      backupService.downloadBackupHistory();

      toast({
        title: "History Downloaded",
        description: "Backup history downloaded as CSV file.",
      });

      systemLoggingService.info(
        "Backup",
        "BACKUP_HISTORY_DOWNLOAD",
        "Backup history downloaded",
      );
    } catch (error) {
      console.error("History download error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download backup history.",
        variant: "destructive",
      });
    }
  };

  const deleteBackup = async (filename: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the backup file "${filename}"? This action cannot be undone.`,
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/backup/delete/${filename}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Backup Deleted",
          description: "Backup file deleted successfully.",
        });
        fetchBackupData(); // Refresh list
      } else {
        throw new Error(result.error || "Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete backup file.",
        variant: "destructive",
      });
    }
  };

  const createBackupJob = async () => {
    if (!newJob.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the backup job.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/backup/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Job Created",
          description: "Backup job created successfully.",
        });
        setShowCreateJobDialog(false);
        setNewJob({
          name: "",
          schedule: "daily",
          type: "full",
          enabled: true,
        });
        fetchBackupData(); // Refresh list
      } else {
        throw new Error(result.error || "Failed to create job");
      }
    } catch (error) {
      console.error("Create job error:", error);
      toast({
        title: "Job Creation Failed",
        description: "Failed to create backup job.",
        variant: "destructive",
      });
    }
  };

  const toggleJob = async (jobId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/backup/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Job Updated",
          description: `Backup job ${enabled ? "enabled" : "disabled"}.`,
        });
        fetchBackupData(); // Refresh list
      }
    } catch (error) {
      console.error("Toggle job error:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update backup job.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            In Progress
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Backup Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Create Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="backupType">Backup Type</Label>
              <Select
                value={selectedBackupType}
                onValueChange={(value: "full" | "incremental") =>
                  setSelectedBackupType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="incremental">
                    Incremental Backup
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isCreatingBackup && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Creating backup...</span>
                  <span>{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} />
              </div>
            )}

            <Button
              onClick={createBackup}
              disabled={isCreatingBackup}
              className="w-full"
            >
              {isCreatingBackup ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Create Backup
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Restore Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="restoreFile">Select Backup File</Label>
              <Select
                value={selectedRestoreFile}
                onValueChange={setSelectedRestoreFile}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose backup file" />
                </SelectTrigger>
                <SelectContent>
                  {backupFiles
                    .filter((file) => file.status === "completed")
                    .map((file) => (
                      <SelectItem key={file.id} value={file.filename}>
                        {file.filename} ({formatFileSize(file.size)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {isRestoring && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Restoring database...</span>
                  <span>{restoreProgress}%</span>
                </div>
                <Progress value={restoreProgress} />
              </div>
            )}

            <Button
              onClick={restoreBackup}
              disabled={isRestoring || !selectedRestoreFile}
              variant="destructive"
              className="w-full"
            >
              {isRestoring ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Restore Database
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Backup Files
            </div>
            <Button variant="outline" size="sm" onClick={fetchBackupData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backupFiles.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No backup files found</p>
              <p className="text-sm text-gray-500">
                Create your first backup to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      {file.filename}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.type}</Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>{file.records_count.toLocaleString()}</TableCell>
                    <TableCell>
                      {new Date(file.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(file.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {file.status === "completed" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadBackup(file.filename)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteBackup(file.filename)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Backup Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Backups
            </div>
            <Dialog
              open={showCreateJobDialog}
              onOpenChange={setShowCreateJobDialog}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Backup Schedule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="jobName">Job Name</Label>
                    <Input
                      id="jobName"
                      value={newJob.name}
                      onChange={(e) =>
                        setNewJob({ ...newJob, name: e.target.value })
                      }
                      placeholder="Enter job name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="schedule">Schedule</Label>
                    <Select
                      value={newJob.schedule}
                      onValueChange={(value) =>
                        setNewJob({ ...newJob, schedule: value })
                      }
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
                    <Label htmlFor="jobType">Backup Type</Label>
                    <Select
                      value={newJob.type}
                      onValueChange={(value: "full" | "incremental") =>
                        setNewJob({ ...newJob, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Backup</SelectItem>
                        <SelectItem value="incremental">
                          Incremental Backup
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateJobDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={createBackupJob}>Create Job</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backupJobs.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No scheduled backups</p>
              <p className="text-sm text-gray-500">
                Create a schedule to automate backups
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>{job.schedule}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {job.last_run
                        ? new Date(job.last_run).toLocaleString()
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {new Date(job.next_run).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          job.enabled
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {job.enabled ? "Active" : "Paused"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleJob(job.id, !job.enabled)}
                      >
                        {job.enabled ? "Pause" : "Resume"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
