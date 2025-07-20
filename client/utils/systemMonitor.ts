/**
 * System Monitoring Utilities
 * Handles real-time system performance monitoring and logging
 */

interface SystemMetrics {
  timestamp: Date;
  memoryUsage: number;
  activeUsers: number;
  apiResponseTime: number;
  errorRate: number;
  dbConnections: number;
}

interface SecurityEvent {
  type: "login_attempt" | "access_denied" | "permission_change" | "data_export";
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
}

class SystemMonitor {
  private metrics: SystemMetrics[] = [];
  private securityEvents: SecurityEvent[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  // Start system monitoring
  startMonitoring(intervalMs: number = 5000) {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    console.log("System monitoring started");
  }

  // Stop system monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log("System monitoring stopped");
  }

  // Collect system metrics
  private async collectMetrics() {
    try {
      const startTime = performance.now();

      // Test API response time
      const response = await fetch("/api/health");
      const apiResponseTime = performance.now() - startTime;

      // Get memory usage (if available)
      const memoryUsage = (performance as any).memory
        ? (performance as any).memory.usedJSHeapSize / 1024 / 1024
        : 0;

      const metrics: SystemMetrics = {
        timestamp: new Date(),
        memoryUsage: Math.round(memoryUsage),
        activeUsers: this.getActiveUsersCount(),
        apiResponseTime: Math.round(apiResponseTime),
        errorRate: this.calculateErrorRate(),
        dbConnections: response.ok ? 1 : 0,
      };

      this.metrics.push(metrics);

      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      // Log critical performance issues
      if (apiResponseTime > 5000) {
        this.logSecurityEvent({
          type: "login_attempt",
          ipAddress: "unknown",
          userAgent: navigator.userAgent,
          details: `Slow API response: ${apiResponseTime}ms`,
          severity: "high",
          // timestamp will be added by the security service
        });
      }
    } catch (error) {
      console.error("Failed to collect system metrics:", error);
    }
  }

  // Log security events
  logSecurityEvent(event: Omit<SecurityEvent, "timestamp">) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 200 security events
    if (this.securityEvents.length > 200) {
      this.securityEvents = this.securityEvents.slice(-200);
    }

    // Send critical events to server immediately
    if (event.severity === "critical" || event.severity === "high") {
      this.sendSecurityEventToServer(securityEvent);
    }

    console.log("Security event logged:", securityEvent);
  }

  // Send security event to server
  private async sendSecurityEventToServer(event: SecurityEvent) {
    try {
      await fetch("/api/system-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: event.type.replace("_", " ").toUpperCase(),
          module: "Security Monitor",
          details: event.details,
          severity:
            event.severity === "critical"
              ? "Critical"
              : event.severity === "high"
                ? "Error"
                : "Warning",
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          user_id: event.userId,
        }),
      });
    } catch (error) {
      console.error("Failed to send security event to server:", error);
    }
  }

  // Get active users count (simplified)
  private getActiveUsersCount(): number {
    const lastActivity = localStorage.getItem("last_activity");
    const activeThreshold = 5 * 60 * 1000; // 5 minutes

    if (lastActivity) {
      const timeSinceActivity = Date.now() - parseInt(lastActivity);
      return timeSinceActivity < activeThreshold ? 1 : 0;
    }
    return 0;
  }

  // Calculate error rate
  private calculateErrorRate(): number {
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length === 0) return 0;

    const errors = recentMetrics.filter(
      (m) => m.apiResponseTime > 10000 || m.dbConnections === 0,
    ).length;
    return (errors / recentMetrics.length) * 100;
  }

  // Get latest metrics
  getLatestMetrics(): SystemMetrics | null {
    return this.metrics.length > 0
      ? this.metrics[this.metrics.length - 1]
      : null;
  }

  // Get recent security events
  getRecentSecurityEvents(count: number = 10): SecurityEvent[] {
    return this.securityEvents.slice(-count);
  }

  // Get metrics history
  getMetricsHistory(minutes: number = 30): SystemMetrics[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.metrics.filter((m) => m.timestamp > cutoff);
  }

  // Check system health
  getSystemHealth(): {
    status: "healthy" | "warning" | "critical";
    issues: string[];
    metrics: SystemMetrics | null;
  } {
    const latest = this.getLatestMetrics();
    const issues: string[] = [];
    let status: "healthy" | "warning" | "critical" = "healthy";

    if (!latest) {
      return {
        status: "critical",
        issues: ["No metrics available"],
        metrics: null,
      };
    }

    // Check response time
    if (latest.apiResponseTime > 5000) {
      issues.push("Slow API response time");
      status = "critical";
    } else if (latest.apiResponseTime > 2000) {
      issues.push("API response time degraded");
      status = "warning";
    }

    // Check memory usage
    if (latest.memoryUsage > 100) {
      issues.push("High memory usage");
      status = status === "critical" ? "critical" : "warning";
    }

    // Check error rate
    if (latest.errorRate > 10) {
      issues.push("High error rate");
      status = "critical";
    } else if (latest.errorRate > 5) {
      issues.push("Elevated error rate");
      status = status === "critical" ? "critical" : "warning";
    }

    // Check database connectivity
    if (latest.dbConnections === 0) {
      issues.push("Database connectivity issues");
      status = "critical";
    }

    return { status, issues, metrics: latest };
  }
}

// Global system monitor instance
export const systemMonitor = new SystemMonitor();

// Activity tracking
export function trackUserActivity() {
  localStorage.setItem("last_activity", Date.now().toString());
}

// Track page visits
export function trackPageVisit(page: string) {
  systemMonitor.logSecurityEvent({
    type: "login_attempt",
    ipAddress: "unknown",
    userAgent: navigator.userAgent,
    details: `Page visit: ${page}`,
    severity: "low",
  });
  trackUserActivity();
}

// Track login attempts
export function trackLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string,
) {
  systemMonitor.logSecurityEvent({
    type: "login_attempt",
    ipAddress: ipAddress || "unknown",
    userAgent: navigator.userAgent,
    details: `Login attempt for ${email}: ${success ? "SUCCESS" : "FAILED"}`,
    severity: success ? "low" : "medium",
  });
}

// Track permission changes
export function trackPermissionChange(
  userId: string,
  changes: string,
  adminId: string,
) {
  systemMonitor.logSecurityEvent({
    type: "permission_change",
    userId: adminId,
    ipAddress: "unknown",
    userAgent: navigator.userAgent,
    details: `Permission changes for user ${userId}: ${changes}`,
    severity: "high",
  });
}

// Track data exports
export function trackDataExport(
  module: string,
  format: string,
  userId: string,
) {
  systemMonitor.logSecurityEvent({
    type: "data_export",
    userId,
    ipAddress: "unknown",
    userAgent: navigator.userAgent,
    details: `Data export: ${module} as ${format}`,
    severity: "medium",
  });
}

// Track access denied events
export function trackAccessDenied(
  resource: string,
  userId: string,
  reason: string,
) {
  systemMonitor.logSecurityEvent({
    type: "access_denied",
    userId,
    ipAddress: "unknown",
    userAgent: navigator.userAgent,
    details: `Access denied to ${resource}: ${reason}`,
    severity: "medium",
  });
}

// Auto-start monitoring when module loads
if (typeof window !== "undefined") {
  systemMonitor.startMonitoring();

  // Track user activity on various events
  ["click", "keydown", "scroll", "mousemove"].forEach((event) => {
    document.addEventListener(event, trackUserActivity, { passive: true });
  });

  // Track page unload
  window.addEventListener("beforeunload", () => {
    systemMonitor.stopMonitoring();
  });
}

export default systemMonitor;
