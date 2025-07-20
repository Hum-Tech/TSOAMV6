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
  Shield,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ActivityLog {
  id: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  severity: "Info" | "Warning" | "Error" | "Critical";
  userId: string;
  userName: string;
  userRole: string;
  sensitivityLevel: "public" | "internal" | "confidential" | "restricted";
}

interface RecentActivitiesProps {
  userId?: string;
  role?: string;
  showAllUsers?: boolean;
}

// Define what each role can see
const rolePermissions = {
  Admin: {
    canViewAllActivities: true,
    canViewSensitiveData: true,
    canViewUserActions: true,
    allowedModules: ["*"], // All modules
    maxSensitivityLevel: "restricted",
  },
  "HR Officer": {
    canViewAllActivities: false,
    canViewSensitiveData: true,
    canViewUserActions: true,
    allowedModules: ["HR", "Members", "Welfare", "System"],
    maxSensitivityLevel: "confidential",
  },
  "Finance Officer": {
    canViewAllActivities: false,
    canViewSensitiveData: true,
    canViewUserActions: false,
    allowedModules: ["Finance", "Inventory", "System"],
    maxSensitivityLevel: "internal",
  },
  User: {
    canViewAllActivities: false,
    canViewSensitiveData: false,
    canViewUserActions: false,
    allowedModules: ["Members", "Welfare", "Events"],
    maxSensitivityLevel: "public",
  },
};

const sensitivityLevels = {
  public: 1,
  internal: 2,
  confidential: 3,
  restricted: 4,
};

export function RecentActivitiesEnhanced({
  userId,
  role,
  showAllUsers = false,
}: RecentActivitiesProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>(
    [],
  );
  const navigate = useNavigate();

  const currentUserRole = user?.role || "User";
  const permissions =
    rolePermissions[currentUserRole as keyof typeof rolePermissions];

  useEffect(() => {
    fetchUserActivities();
  }, [userId, role]);

  useEffect(() => {
    filterActivitiesByRole();
  }, [activities, currentUserRole]);

  const fetchUserActivities = async () => {
    setIsLoading(true);
    try {
      // Simulate API call with role-based mock data
      const mockActivities: ActivityLog[] = [
        {
          id: "1",
          action: "Member Registration",
          module: "Members",
          details: "New member John Doe registered",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          severity: "Info",
          userId: "user1",
          userName: "Jane Smith",
          userRole: "HR Officer",
          sensitivityLevel: "internal",
        },
        {
          id: "2",
          action: "Financial Transaction",
          module: "Finance",
          details: "Offering recorded: KSh 15,000",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          severity: "Info",
          userId: "user2",
          userName: "Peter Mwangi",
          userRole: "Finance Officer",
          sensitivityLevel: "confidential",
        },
        {
          id: "3",
          action: "System Configuration",
          module: "System",
          details: "Updated user permissions for HR module",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          severity: "Warning",
          userId: "admin1",
          userName: "Admin User",
          userRole: "Admin",
          sensitivityLevel: "restricted",
        },
        {
          id: "4",
          action: "Welfare Application",
          module: "Welfare",
          details: "New welfare request submitted",
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          severity: "Info",
          userId: "user3",
          userName: "Mary Wanjiku",
          userRole: "User",
          sensitivityLevel: "internal",
        },
        {
          id: "5",
          action: "Inventory Update",
          module: "Inventory",
          details: "Added 50 units of Office Supplies",
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          severity: "Info",
          userId: "user2",
          userName: "Peter Mwangi",
          userRole: "Finance Officer",
          sensitivityLevel: "internal",
        },
        {
          id: "6",
          action: "User Account Creation",
          module: "System",
          details: "Created new user account for Finance Officer",
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          severity: "Critical",
          userId: "admin1",
          userName: "Admin User",
          userRole: "Admin",
          sensitivityLevel: "restricted",
        },
        {
          id: "7",
          action: "Financial Report",
          module: "Finance",
          details: "Generated monthly financial report",
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          severity: "Info",
          userId: "user2",
          userName: "Peter Mwangi",
          userRole: "Finance Officer",
          sensitivityLevel: "confidential",
        },
        {
          id: "8",
          action: "Event Registration",
          module: "Events",
          details: "25 members registered for Sunday service",
          timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
          severity: "Info",
          userId: "user4",
          userName: "Grace Mutua",
          userRole: "User",
          sensitivityLevel: "public",
        },
      ];

      // Simulate network delay
      setTimeout(() => {
        setActivities(mockActivities);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      setIsLoading(false);
    }
  };

  const filterActivitiesByRole = () => {
    let filtered = activities;

    // Filter by sensitivity level
    const maxSensitivityLevel =
      sensitivityLevels[
        permissions.maxSensitivityLevel as keyof typeof sensitivityLevels
      ];
    filtered = filtered.filter(
      (activity) =>
        sensitivityLevels[activity.sensitivityLevel] <= maxSensitivityLevel,
    );

    // Filter by modules if not admin
    if (!permissions.allowedModules.includes("*")) {
      filtered = filtered.filter((activity) =>
        permissions.allowedModules.includes(activity.module),
      );
    }

    // Filter by user if not allowed to view all activities
    if (!permissions.canViewAllActivities && !showAllUsers) {
      filtered = filtered.filter(
        (activity) =>
          activity.userId === user?.id || activity.userId === userId,
      );
    }

    // Filter out user actions if not permitted
    if (!permissions.canViewUserActions) {
      // Remove activities that show what other users are doing
      filtered = filtered.filter(
        (activity) =>
          activity.userId === user?.id ||
          activity.module === "System" ||
          !activity.details.includes("user") ||
          activity.sensitivityLevel === "public",
      );
    }

    // Filter for important activities only
    const importantActivities = filtered.filter((activity) => {
      // Define what constitutes "important" activities
      const importantActions = [
        "Financial Transaction",
        "Member Registration",
        "System Configuration",
        "User Account Creation",
        "Welfare Application",
        "Financial Report",
      ];

      const importantSeverities = ["Warning", "Error", "Critical"];

      return (
        importantActions.some((action) => activity.action.includes(action)) ||
        importantSeverities.includes(activity.severity) ||
        activity.sensitivityLevel === "confidential" ||
        activity.sensitivityLevel === "restricted"
      );
    });

    // Sort by timestamp (most recent first)
    importantActivities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Limit to only 3 most important recent activities
    const limitedActivities = importantActivities.slice(0, 3);

    setFilteredActivities(limitedActivities);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      Info: "default" as const,
      Warning: "secondary" as const,
      Error: "destructive" as const,
      Critical: "destructive" as const,
    };
    return variants[severity as keyof typeof variants] || "default";
  };

  const getSensitivityIcon = (level: string) => {
    switch (level) {
      case "public":
        return <Eye className="h-3 w-3" />;
      case "internal":
        return <Users className="h-3 w-3" />;
      case "confidential":
        return <Shield className="h-3 w-3" />;
      case "restricted":
        return <EyeOff className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case "Finance":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "Members":
      case "HR":
        return <Users className="h-4 w-4 text-blue-600" />;
      case "Inventory":
        return <Package className="h-4 w-4 text-orange-600" />;
      case "Welfare":
        return <Heart className="h-4 w-4 text-red-600" />;
      case "Events":
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case "System":
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const canViewDetails = (activity: ActivityLog) => {
    return (
      permissions.canViewSensitiveData ||
      activity.sensitivityLevel === "public" ||
      activity.userId === user?.id
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        Loading activities...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Important Activities</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-orange-600">
            Top 3
          </Badge>
          {permissions.canViewAllActivities && (
            <Badge variant="outline" className="text-xs">
              All Users
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {permissions.maxSensitivityLevel} Level
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchUserActivities}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No important activities to display</p>
          <p className="text-xs">
            Only showing critical system events and important transactions
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                {getModuleIcon(activity.module)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">
                    {activity.action}
                  </p>
                  <Badge
                    variant={getSeverityBadge(activity.severity)}
                    className="text-xs"
                  >
                    {activity.severity}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {getSensitivityIcon(activity.sensitivityLevel)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {canViewDetails(activity)
                    ? activity.details
                    : "Details restricted by permissions"}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{activity.module}</span>
                    {permissions.canViewUserActions &&
                      activity.userId !== user?.id && (
                        <>
                          <span>•</span>
                          <span>by {activity.userName}</span>
                          <Badge variant="outline" className="text-xs">
                            {activity.userRole}
                          </Badge>
                        </>
                      )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>
              {canViewDetails(activity) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => {
                    if (activity.module === "Finance") navigate("/finance");
                    else if (activity.module === "Members")
                      navigate("/members");
                    else if (activity.module === "Welfare")
                      navigate("/welfare");
                    else if (activity.module === "Inventory")
                      navigate("/inventory");
                    else if (activity.module === "Events") navigate("/events");
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredActivities.length > 0 && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/system-logs")}
            disabled={!user?.permissions?.systemLogs}
          >
            <FileText className="h-3 w-3 mr-1" />
            View All Logs
          </Button>
        </div>
      )}
    </div>
  );
}
