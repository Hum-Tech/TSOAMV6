/**
 * TSOAM Church Management System - Offline Status Indicator
 *
 * Visual indicator showing offline/online status and sync progress.
 * Provides user feedback about connectivity and data synchronization.
 *
 * Features:
 * - Real-time connectivity status
 * - Sync progress indication
 * - Offline queue status
 * - Manual sync trigger
 * - Export queue status
 *
 * @author TSOAM Development Team
 * @version 2.0.0
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  WifiOff,
  Wifi,
  RefreshCw,
  Download,
  Upload,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { offlineService } from "@/services/OfflineService";
import { exportService } from "@/services/ExportService";
import type { SyncProgress } from "@/services/OfflineService";
import type { ExportProgress } from "@/services/ExportService";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<{
    lastSync: number;
    pendingOperations: number;
    isOnline: boolean;
  }>({
    lastSync: 0,
    pendingOperations: 0,
    isOnline: navigator.onLine,
  });
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(
    null,
  );
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Update online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Subscribe to sync progress
    const handleSyncProgress = (progress: SyncProgress) => {
      setSyncProgress(progress);
      setIsSyncing(progress.step !== "Complete" && progress.step !== "Error");
    };

    const handleExportProgress = (progress: ExportProgress) => {
      setExportProgress(progress);
    };

    offlineService.onSyncProgress(handleSyncProgress);
    exportService.onProgress(handleExportProgress);

    // Load initial sync status
    loadSyncStatus();

    // Update sync status periodically
    const statusInterval = setInterval(loadSyncStatus, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      offlineService.offSyncProgress(handleSyncProgress);
      exportService.offProgress(handleExportProgress);
      clearInterval(statusInterval);
    };
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await offlineService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.warn(
        "Failed to load sync status (offline service may not be available):",
        error,
      );
      // Provide default status
      setSyncStatus({
        lastSync: 0,
        pendingOperations: 0,
        isOnline: navigator.onLine,
      });
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      alert("Cannot sync while offline. Please check your connection.");
      return;
    }

    try {
      setIsSyncing(true);
      await offlineService.forceSyncAll();
      await loadSyncStatus();
    } catch (error) {
      console.error("Manual sync failed:", error);
      alert("Sync failed: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (timestamp: number) => {
    if (timestamp === 0) return "Never";

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const getStatusColor = () => {
    if (!isOnline) return "bg-red-500";
    if (syncStatus.pendingOperations > 0) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (isSyncing) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (syncStatus.pendingOperations > 0)
      return <Clock className="h-4 w-4 text-yellow-600" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (isSyncing) return "Syncing...";
    if (syncStatus.pendingOperations > 0) return "Pending Sync";
    return "Online";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative flex items-center gap-2 px-3"
        >
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
          <div
            className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${getStatusColor()}`}
          />
          {syncStatus.pendingOperations > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 text-xs">
              {syncStatus.pendingOperations}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Connection Status</h4>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Offline</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Synchronization</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Last sync:</span>
                <span>{formatLastSync(syncStatus.lastSync)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending operations:</span>
                <Badge
                  variant={
                    syncStatus.pendingOperations > 0 ? "secondary" : "outline"
                  }
                >
                  {syncStatus.pendingOperations}
                </Badge>
              </div>
            </div>
          </div>

          {syncProgress && (
            <div className="space-y-2">
              <h4 className="font-medium">Sync Progress</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{syncProgress.step}</span>
                  <span>{syncProgress.progress}%</span>
                </div>
                <Progress value={syncProgress.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {syncProgress.message}
                </p>
                {syncProgress.errors.length > 0 && (
                  <div className="text-xs text-red-600">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    {syncProgress.errors.length} error
                    {syncProgress.errors.length > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          )}

          {exportProgress && (
            <div className="space-y-2">
              <h4 className="font-medium">Export Progress</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{exportProgress.step}</span>
                  <span>{exportProgress.progress}%</span>
                </div>
                <Progress value={exportProgress.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {exportProgress.message}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium">Actions</h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualSync}
                disabled={!isOnline || isSyncing}
                className="flex-1"
              >
                {isSyncing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Sync Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                <Download className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          {!isOnline && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-800">
                    Working Offline
                  </p>
                  <p className="text-xs text-yellow-700">
                    Your changes are saved locally and will sync when you're
                    back online.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isOnline && syncStatus.pendingOperations > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <div className="flex items-start gap-2">
                <Upload className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-800">
                    Data Ready to Sync
                  </p>
                  <p className="text-xs text-blue-700">
                    {syncStatus.pendingOperations} operation
                    {syncStatus.pendingOperations > 1 ? "s" : ""} waiting to
                    sync with the server.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isOnline && syncStatus.pendingOperations === 0 && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-800">
                    All Synced
                  </p>
                  <p className="text-xs text-green-700">
                    Your data is up to date and synchronized with the server.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default OfflineIndicator;
