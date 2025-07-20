/**
 * Data Refresh Utility for Real-time Updates
 * Handles triggering dashboard and module data refreshes across the application
 */

// Event types for different data updates
export type DataUpdateEvent =
  | "financial_update"
  | "member_update"
  | "inventory_update"
  | "welfare_update"
  | "hr_update"
  | "event_update"
  | "dashboard_refresh";

// Centralized data refresh manager
class DataRefreshManager {
  private listeners: Map<DataUpdateEvent, Set<() => void>> = new Map();

  // Subscribe to data update events
  subscribe(event: DataUpdateEvent, callback: () => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // Trigger data refresh for specific event type
  trigger(event: DataUpdateEvent, delay: number = 0) {
    setTimeout(() => {
      // Update localStorage to trigger cross-tab updates
      localStorage.setItem(`data_refresh_${event}`, Date.now().toString());

      // Call all registered listeners
      this.listeners.get(event)?.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          console.error(`Error in data refresh callback for ${event}:`, error);
        }
      });

      // Always trigger dashboard refresh for financial updates
      if (event === "financial_update" || event === "dashboard_refresh") {
        this.trigger("dashboard_refresh", 1000);
      }
    }, delay);
  }

  // Trigger multiple events
  triggerMultiple(events: DataUpdateEvent[], delay: number = 0) {
    events.forEach((event) => this.trigger(event, delay));
  }

  // Clear all listeners (useful for cleanup)
  clearAll() {
    this.listeners.clear();
  }
}

// Global instance
export const dataRefreshManager = new DataRefreshManager();

// Convenience functions for common operations
export const refreshDashboard = () => {
  dataRefreshManager.trigger("dashboard_refresh");
};

export const refreshFinancialData = () => {
  dataRefreshManager.trigger("financial_update");
  logDataActivity("Financial data refresh triggered");
};

export const refreshMemberData = () => {
  dataRefreshManager.trigger("member_update");
  logDataActivity("Member data refresh triggered");
};

export const refreshInventoryData = () => {
  dataRefreshManager.trigger("inventory_update");
  logDataActivity("Inventory data refresh triggered");
};

export const refreshWelfareData = () => {
  dataRefreshManager.trigger("welfare_update");
  logDataActivity("Welfare data refresh triggered");
};

export const refreshHRData = () => {
  dataRefreshManager.trigger("hr_update");
  logDataActivity("HR data refresh triggered");
};

export const refreshEventData = () => {
  dataRefreshManager.trigger("event_update");
  logDataActivity("Event data refresh triggered");
};

// System logging for data activities
async function logDataActivity(activity: string) {
  try {
    await fetch("/api/system-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "Data Refresh",
        module: "Data Manager",
        details: activity,
        severity: "Info",
      }),
    });
  } catch (error) {
    console.error("Failed to log data activity:", error);
  }
}

// Cross-tab synchronization
window.addEventListener("storage", (e) => {
  if (e.key?.startsWith("data_refresh_")) {
    const eventType = e.key.replace("data_refresh_", "") as DataUpdateEvent;
    dataRefreshManager.trigger(eventType);
  }
});

// Hook for components to use data refresh
export function useDataRefresh(
  event: DataUpdateEvent,
  callback: () => void,
  dependencies: any[] = [],
) {
  return {
    subscribe: () => dataRefreshManager.subscribe(event, callback),
    trigger: () => dataRefreshManager.trigger(event),
  };
}

// Auto-refresh utility for periodic data updates
export class AutoRefreshManager {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  start(
    key: string,
    callback: () => void,
    intervalMs: number = 30000, // 30 seconds default
  ) {
    this.stop(key); // Clear existing interval

    const interval = setInterval(() => {
      try {
        callback();
      } catch (error) {
        console.error(`Auto-refresh error for ${key}:`, error);
      }
    }, intervalMs);

    this.intervals.set(key, interval);
  }

  stop(key: string) {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }

  stopAll() {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }
}

export const autoRefreshManager = new AutoRefreshManager();

// Real-time calculation utilities
export function calculateFinancialMetrics(data: any[]) {
  if (!data || data.length === 0) return null;

  const current = data[data.length - 1];
  const previous = data[data.length - 2];

  return {
    currentOfferings: current?.offerings || 0,
    currentTithes: current?.tithes || 0,
    currentExpenses: current?.expenses || 0,
    offeringsGrowth:
      previous && previous.offerings > 0
        ? (((current?.offerings || 0) - previous.offerings) /
            previous.offerings) *
          100
        : 0,
    netIncome:
      (current?.offerings || 0) +
      (current?.tithes || 0) -
      (current?.expenses || 0),
  };
}

export function calculateMembershipMetrics(data: any[]) {
  if (!data || data.length === 0) return null;

  const current = data[data.length - 1];
  const previous = data[data.length - 2];

  return {
    totalMembers: current?.fullMembers || 0,
    newMembers: current?.newMembers || 0,
    memberGrowth:
      previous && previous.newMembers > 0
        ? (((current?.newMembers || 0) - previous.newMembers) /
            previous.newMembers) *
          100
        : 0,
  };
}

// Export default for convenience
export default {
  dataRefreshManager,
  autoRefreshManager,
  refreshDashboard,
  refreshFinancialData,
  refreshMemberData,
  refreshInventoryData,
  refreshWelfareData,
  refreshHRData,
  refreshEventData,
  calculateFinancialMetrics,
  calculateMembershipMetrics,
};
