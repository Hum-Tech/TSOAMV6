import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  Network,
  RefreshCw,
  Server,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { systemMonitor } from "@/utils/systemMonitor";

interface SystemHealth {
  status: "healthy" | "warning" | "critical";
  issues: string[];
  metrics: any;
}

export default function SystemStatus() {
  const { user } = useAuth();
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Check if user has permission to view system status
  if (!user?.permissions?.systemLogs && user?.role !== "Admin") {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to view system status.
            </p>
            <p className="text-sm text-gray-500">
              Contact your administrator for access.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Fetch system data
  const fetchSystemData = async () => {
    setIsLoading(true);
    try {
      const [healthResponse, logsResponse] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/system-logs/critical"),
      ]);

      const healthData = await healthResponse.json();
      const logsData = await logsResponse.json();

      // Get system health from monitor
      const health = systemMonitor.getSystemHealth();
      setSystemHealth(health);

      // Set logs data
      setSystemLogs(logsData.critical_logs || []);

      // Get performance metrics
      const metrics = systemMonitor.getMetricsHistory(60); // Last hour
      setPerformanceData(metrics);

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch system data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: { [key: string]: "default" | "destructive" | "secondary" } =
      {
        Critical: "destructive",
        Error: "destructive",
        Warning: "secondary",
        Info: "default",
      };
    return <Badge variant={variants[severity] || "default"}>{severity}</Badge>;
  };

  return (
    <Layout>
      <PageHeader
        title="System Status"
        description={
          <div className="flex items-center gap-4">
            <span>Real-time system monitoring and health status</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSystemData}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {systemHealth ? (
                    <span className={getStatusColor(systemHealth.status)}>
                      {systemHealth.status.toUpperCase()}
                    </span>
                  ) : (
                    "LOADING"
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  System Status
                </div>
              </div>
              {systemHealth && getStatusIcon(systemHealth.status)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {systemHealth?.metrics?.apiResponseTime || 0}ms
                </div>
                <div className="text-sm text-muted-foreground">
                  API Response Time
                </div>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {systemHealth?.metrics?.memoryUsage || 0}MB
                </div>
                <div className="text-sm text-muted-foreground">
                  Memory Usage
                </div>
              </div>
              <HardDrive className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {systemHealth?.metrics?.activeUsers || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Users
                </div>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Issues Alert */}
      {systemHealth?.issues && systemHealth.issues.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              System Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {systemHealth.issues.map((issue, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-yellow-800">{issue}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics (Last Hour)</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(time) =>
                      new Date(time).toLocaleTimeString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(time) => new Date(time).toLocaleString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="apiResponseTime"
                    stroke="#8884d8"
                    name="Response Time (ms)"
                  />
                  <Line
                    type="monotone"
                    dataKey="memoryUsage"
                    stroke="#82ca9d"
                    name="Memory (MB)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No performance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Components Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span>Database Connection</span>
                </div>
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Connected
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-purple-600" />
                  <span>API Server</span>
                </div>
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Running
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Network className="h-5 w-5 text-orange-600" />
                  <span>Network Connectivity</span>
                </div>
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span>Security Monitor</span>
                </div>
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Critical Events */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Critical Events</CardTitle>
        </CardHeader>
        <CardContent>
          {systemLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemLogs.slice(0, 10).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                    <TableCell>{log.module}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.details}
                    </TableCell>
                    <TableCell>
                      {log.user_name || log.user_id || "System"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No critical events in the last 24 hours
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
