import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  DollarSign,
  Users,
  Package,
  Heart,
  Calendar,
  FileText,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ActivityLog {
  id: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  severity: "Info" | "Warning" | "Error" | "Critical";
}

interface RecentActivitiesProps {
  userId?: string;
  role?: string;
}

export function RecentActivities({ userId, role }: RecentActivitiesProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserActivities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/system-logs?user_id=${userId}&limit=10`,
      );
      const data = await response.json();

      if (data.success) {
        setActivities(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch user activities:", error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserActivities();
      // Refresh every 2 minutes
      const interval = setInterval(fetchUserActivities, 120000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const getActivityIcon = (module: string) => {
    switch (module.toLowerCase()) {
      case "finance":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "members":
      case "member management":
        return <Users className="h-4 w-4 text-blue-600" />;
      case "inventory":
        return <Package className="h-4 w-4 text-purple-600" />;
      case "welfare":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "events":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "hr":
      case "human resources":
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
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
    const colors: { [key: string]: string } = {
      Critical: "bg-red-100 text-red-800",
      Error: "bg-red-100 text-red-800",
      Warning: "bg-yellow-100 text-yellow-800",
      Info: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge
        variant={variants[severity] || "default"}
        className={colors[severity]}
      >
        {severity}
      </Badge>
    );
  };

  const navigateToModule = (module: string) => {
    const moduleRoutes: { [key: string]: string } = {
      finance: "/finance",
      members: "/members",
      "member management": "/members",
      inventory: "/inventory",
      welfare: "/welfare",
      events: "/events",
      hr: "/hr",
      "human resources": "/hr",
      dashboard: "/",
      settings: "/settings",
      users: "/users",
    };

    const route = moduleRoutes[module.toLowerCase()];
    if (route) {
      navigate(route);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading activities...</span>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">No recent activities</p>
        <p className="text-sm text-gray-400">
          Your actions will appear here as you use the system
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing your last {activities.length} activities
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUserActivities}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id} className="hover:bg-gray-50">
              <TableCell>{getActivityIcon(activity.module)}</TableCell>
              <TableCell className="font-medium">{activity.action}</TableCell>
              <TableCell>
                <Badge variant="outline">{activity.module}</Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate" title={activity.details}>
                  {activity.details}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatTimestamp(activity.timestamp)}
              </TableCell>
              <TableCell>{getSeverityBadge(activity.severity)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToModule(activity.module)}
                  title={`Go to ${activity.module}`}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {activities.length >= 10 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/system-logs")}
            className="text-sm"
          >
            View All Activities
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
