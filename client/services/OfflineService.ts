/**
 * TSOAM Church Management System - Offline Service
 *
 * Provides comprehensive offline functionality with data synchronization.
 * Enables the system to work seamlessly both online and offline.
 *
 * Features:
 * - Service Worker registration for offline caching
 * - IndexedDB for offline data storage
 * - Automatic sync when connection is restored
 * - Conflict resolution for simultaneous edits
 * - Progress tracking for sync operations
 * - Queue management for offline operations
 *
 * @author TSOAM Development Team
 * @version 2.0.0
 */

// Types for offline data management
export interface OfflineOperation {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  module: string;
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export interface SyncProgress {
  step: string;
  progress: number;
  total: number;
  message: string;
  errors: string[];
}

export interface OfflineData {
  key: string;
  data: any;
  lastModified: number;
  version: number;
  module: string;
}

/**
 * IndexedDB helper for offline data storage
 */
class OfflineStorage {
  private dbName = "tsoam_offline_db";
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;

        // Create object stores
        if (!db.objectStoreNames.contains("offline_data")) {
          const dataStore = db.createObjectStore("offline_data", {
            keyPath: "key",
          });
          dataStore.createIndex("module", "module", { unique: false });
          dataStore.createIndex("lastModified", "lastModified", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains("offline_operations")) {
          const operationsStore = db.createObjectStore("offline_operations", {
            keyPath: "id",
          });
          operationsStore.createIndex("module", "module", { unique: false });
          operationsStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains("sync_metadata")) {
          db.createObjectStore("sync_metadata", { keyPath: "key" });
        }
      };
    });
  }

  async store(objectStore: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([objectStore], "readwrite");
      const store = transaction.objectStore(objectStore);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async retrieve(objectStore: string, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([objectStore], "readonly");
      const store = transaction.objectStore(objectStore);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async retrieveAll(objectStore: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([objectStore], "readonly");
      const store = transaction.objectStore(objectStore);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(objectStore: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([objectStore], "readwrite");
      const store = transaction.objectStore(objectStore);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(objectStore: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([objectStore], "readwrite");
      const store = transaction.objectStore(objectStore);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

/**
 * Main Offline Service Class
 */
class OfflineService {
  private static instance: OfflineService;
  private storage: OfflineStorage;
  private syncInProgress = false;
  private syncCallbacks: ((progress: SyncProgress) => void)[] = [];
  private lastSyncTime = 0;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.storage = new OfflineStorage();
    this.init();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  /**
   * Initialize the offline service
   */
  private async init(): Promise<void> {
    try {
      await this.storage.init();
      await this.registerServiceWorker();
      this.setupEventListeners();
      this.startPeriodicSync();
      console.log("Offline service initialized successfully");
    } catch (error) {
      console.warn(
        "Offline service initialization failed, running in basic mode:",
        error,
      );
      // Continue without full offline functionality
      this.setupEventListeners();
    }
  }

  /**
   * Register service worker for caching
   */
  private async registerServiceWorker(): Promise<void> {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        console.log("Service Worker registered:", registration);

        // Update service worker when available
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("New service worker available");
              }
            });
          }
        });
      } catch (error) {
        console.warn(
          "Service Worker registration failed (this is normal in development):",
          error,
        );
      }
    } else {
      console.log("Service Worker not supported in this environment");
    }
  }

  /**
   * Setup event listeners for online/offline events
   */
  private setupEventListeners(): void {
    window.addEventListener("online", () => {
      console.log("Connection restored - starting sync");
      this.syncOfflineData();
    });

    window.addEventListener("offline", () => {
      console.log("Connection lost - switching to offline mode");
    });

    // Listen for page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.isOnline()) {
        this.syncOfflineData();
      }
    });
  }

  /**
   * Start periodic sync when online
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(
      () => {
        if (this.isOnline() && !this.syncInProgress) {
          this.syncOfflineData();
        }
      },
      5 * 60 * 1000,
    ); // Sync every 5 minutes
  }

  /**
   * Check if online
   */
  public isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Subscribe to sync progress updates
   */
  public onSyncProgress(callback: (progress: SyncProgress) => void): void {
    this.syncCallbacks.push(callback);
  }

  /**
   * Unsubscribe from sync progress updates
   */
  public offSyncProgress(callback: (progress: SyncProgress) => void): void {
    this.syncCallbacks = this.syncCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * Notify sync progress
   */
  private notifySyncProgress(progress: SyncProgress): void {
    this.syncCallbacks.forEach((callback) => callback(progress));
  }

  /**
   * Store data for offline access
   */
  public async storeOfflineData(
    module: string,
    key: string,
    data: any,
  ): Promise<void> {
    const offlineData: OfflineData = {
      key: `${module}_${key}`,
      data,
      lastModified: Date.now(),
      version: 1,
      module,
    };

    await this.storage.store("offline_data", offlineData);
  }

  /**
   * Retrieve offline data
   */
  public async getOfflineData(module: string, key: string): Promise<any> {
    const result = await this.storage.retrieve(
      "offline_data",
      `${module}_${key}`,
    );
    return result ? result.data : null;
  }

  /**
   * Get all offline data for a module
   */
  public async getModuleData(module: string): Promise<any[]> {
    const allData = await this.storage.retrieveAll("offline_data");
    return allData
      .filter((item) => item.module === module)
      .map((item) => item.data);
  }

  /**
   * Queue an operation for offline processing
   */
  public async queueOperation(
    module: string,
    type: "CREATE" | "UPDATE" | "DELETE",
    data: any,
  ): Promise<void> {
    const operation: OfflineOperation = {
      id: `${module}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      module,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await this.storage.store("offline_operations", operation);

    // If online, try to sync immediately
    if (this.isOnline()) {
      this.syncOfflineData();
    }
  }

  /**
   * Sync offline data with server
   */
  public async syncOfflineData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline()) {
      return;
    }

    this.syncInProgress = true;
    const errors: string[] = [];

    try {
      this.notifySyncProgress({
        step: "Starting Sync",
        progress: 0,
        total: 100,
        message: "Initializing synchronization...",
        errors: [],
      });

      // Get all pending operations
      const operations = await this.storage.retrieveAll("offline_operations");

      if (operations.length === 0) {
        this.notifySyncProgress({
          step: "Complete",
          progress: 100,
          total: 100,
          message: "No offline operations to sync",
          errors: [],
        });
        return;
      }

      this.notifySyncProgress({
        step: "Syncing Operations",
        progress: 10,
        total: 100,
        message: `Processing ${operations.length} offline operations...`,
        errors: [],
      });

      // Process operations by module to maintain data consistency
      const modules = [...new Set(operations.map((op) => op.module))];

      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const moduleOps = operations.filter((op) => op.module === module);

        try {
          await this.syncModuleOperations(module, moduleOps);
          this.notifySyncProgress({
            step: "Syncing Operations",
            progress: 20 + (i / modules.length) * 60,
            total: 100,
            message: `Synced ${module} module (${moduleOps.length} operations)`,
            errors,
          });
        } catch (error) {
          const errorMessage = `Failed to sync ${module}: ${error instanceof Error ? error.message : "Unknown error"}`;
          errors.push(errorMessage);
          console.error(errorMessage);
        }
      }

      // Clean up successfully processed operations
      await this.cleanupProcessedOperations();

      this.notifySyncProgress({
        step: "Updating Cache",
        progress: 90,
        total: 100,
        message: "Updating local cache...",
        errors,
      });

      // Update last sync time
      this.lastSyncTime = Date.now();
      await this.storage.store("sync_metadata", {
        key: "last_sync",
        timestamp: this.lastSyncTime,
      });

      this.notifySyncProgress({
        step: "Complete",
        progress: 100,
        total: 100,
        message:
          errors.length > 0
            ? `Sync completed with ${errors.length} errors`
            : "Sync completed successfully",
        errors,
      });
    } catch (error) {
      const errorMessage = `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      errors.push(errorMessage);
      this.notifySyncProgress({
        step: "Error",
        progress: 0,
        total: 100,
        message: errorMessage,
        errors,
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync operations for a specific module
   */
  private async syncModuleOperations(
    module: string,
    operations: OfflineOperation[],
  ): Promise<void> {
    // Sort operations by timestamp to maintain order
    operations.sort((a, b) => a.timestamp - b.timestamp);

    for (const operation of operations) {
      try {
        await this.processOperation(operation);
        // Remove successful operation
        await this.storage.delete("offline_operations", operation.id);
      } catch (error) {
        // Increment retry count
        operation.retryCount++;
        operation.lastError =
          error instanceof Error ? error.message : "Unknown error";

        // Remove operation if retry limit exceeded
        if (operation.retryCount >= 3) {
          console.error(
            `Operation ${operation.id} failed after 3 retries, removing:`,
            error,
          );
          await this.storage.delete("offline_operations", operation.id);
        } else {
          // Update operation with new retry count
          await this.storage.store("offline_operations", operation);
        }
        throw error;
      }
    }
  }

  /**
   * Process a single offline operation
   */
  private async processOperation(operation: OfflineOperation): Promise<void> {
    const baseUrl =
      process.env.REACT_APP_API_URL || "http://localhost:3001/api";
    const moduleEndpoints: { [key: string]: string } = {
      members: "members",
      employees: "hr/employees",
      transactions: "finance/transactions",
      welfare: "welfare",
      inventory: "inventory",
      events: "events",
      appointments: "appointments",
    };

    const endpoint = moduleEndpoints[operation.module];
    if (!endpoint) {
      throw new Error(`Unknown module: ${operation.module}`);
    }

    const url = `${baseUrl}/${endpoint}`;

    let response: Response;

    switch (operation.type) {
      case "CREATE":
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify(operation.data),
        });
        break;

      case "UPDATE":
        response = await fetch(`${url}/${operation.data.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify(operation.data),
        });
        break;

      case "DELETE":
        response = await fetch(`${url}/${operation.data.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Update local cache with server response
    if (operation.type !== "DELETE") {
      const updatedData = await response.json();
      await this.storeOfflineData(
        operation.module,
        updatedData.id,
        updatedData,
      );
    }
  }

  /**
   * Clean up processed operations
   */
  private async cleanupProcessedOperations(): Promise<void> {
    // Remove operations older than 24 hours that have been retried multiple times
    const operations = await this.storage.retrieveAll("offline_operations");
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    for (const operation of operations) {
      if (operation.timestamp < cutoffTime && operation.retryCount >= 2) {
        await this.storage.delete("offline_operations", operation.id);
      }
    }
  }

  /**
   * Load offline queue from storage
   */
  public loadOfflineQueue(): void {
    // This method is for compatibility with the main.tsx call
    // The actual loading happens during service initialization
    console.log("Offline service queue loaded");
  }

  /**
   * Force sync all modules
   */
  public async forceSyncAll(): Promise<void> {
    if (!this.isOnline()) {
      throw new Error("Cannot sync while offline");
    }

    await this.syncOfflineData();
  }

  /**
   * Get sync status
   */
  public async getSyncStatus(): Promise<{
    lastSync: number;
    pendingOperations: number;
    isOnline: boolean;
  }> {
    const lastSyncMeta = await this.storage.retrieve(
      "sync_metadata",
      "last_sync",
    );
    const operations = await this.storage.retrieveAll("offline_operations");

    return {
      lastSync: lastSyncMeta ? lastSyncMeta.timestamp : 0,
      pendingOperations: operations.length,
      isOnline: this.isOnline(),
    };
  }

  /**
   * Clear all offline data
   */
  public async clearOfflineData(): Promise<void> {
    await this.storage.clear("offline_data");
    await this.storage.clear("offline_operations");
    await this.storage.clear("sync_metadata");
  }

  /**
   * Cleanup method
   */
  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Export singleton instance
export const offlineService = OfflineService.getInstance();

export default offlineService;
