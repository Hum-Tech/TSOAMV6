import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  UserPlus,
  User,
  DollarSign,
  MessageSquare,
  Heart,
  Package,
  Calendar,
  CalendarDays,
  Settings,
  FileText,
  Shield,
  LogOut,
} from "lucide-react";

const allMenuItems = [
  { path: "/", label: "Dashboard", icon: BarChart3, permission: "dashboard" },
  {
    path: "/members",
    label: "Member Management",
    icon: Users,
    permission: "members",
  },
  {
    path: "/new-members",
    label: "New Members",
    icon: UserPlus,
    permission: "members",
  },

  { path: "/hr", label: "Human Resources", icon: User, permission: "hr" },
  {
    path: "/finance",
    label: "Finance",
    icon: DollarSign,
    permission: "finance",
  },
  {
    path: "/messaging",
    label: "Messaging",
    icon: MessageSquare,
    permission: "messaging",
  },
  { path: "/welfare", label: "Welfare", icon: Heart, permission: "welfare" },
  {
    path: "/inventory",
    label: "Inventory",
    icon: Package,
    permission: "inventory",
  },
  {
    path: "/appointments",
    label: "Appointments",
    icon: Calendar,
    permission: "appointments",
  },
  {
    path: "/events",
    label: "Church Events",
    icon: CalendarDays,
    permission: "events",
  },
  {
    path: "/settings",
    label: "Settings",
    icon: Settings,
    permission: "settings",
  },
  {
    path: "/system-logs",
    label: "System Logs",
    icon: FileText,
    permission: "systemLogs",
  },
  { path: "/users", label: "Users", icon: Shield, permission: "users" },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Define allowed modules for Finance Officer role
  const financeAllowedModules = [
    "dashboard",
    "finance",
    "inventory",
    "messaging",
    "events",
    "settings",
  ];

  // Filter menu items based on user permissions and role
  const menuItems = allMenuItems.filter((item) => {
    if (!user?.permissions) return false;

    // For Finance Officer, only show specific modules
    if (user.role === "Finance Officer") {
      return (
        financeAllowedModules.includes(item.permission) &&
        user.permissions[item.permission as keyof typeof user.permissions]
      );
    }

    // For other roles, use standard permission filtering
    return user.permissions[item.permission as keyof typeof user.permissions];
  });

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F0627183da1a04fa4b6c5a1ab36b4780e%2F24ea526264444b8ca043118a01335902?format=webp&width=800"
              alt="TSOAM Logo"
              className="h-20 w-20 object-cover rounded-full border-2 border-primary/20 shadow-lg"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">TSOAM</h1>
            <p className="text-sm text-sidebar-foreground/70">
              Management System
            </p>
          </div>
        </div>
      </div>

      <nav className="p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info and Logout */}
      <div className="p-4 border-t border-sidebar-border">
        {user && (
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-medium text-sidebar-foreground">
                {user.name}
              </div>
              <div className="text-sidebar-foreground/70">{user.role}</div>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
