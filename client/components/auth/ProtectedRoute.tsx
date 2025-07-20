import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Home } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

// Define available pages by role
const rolePages = {
  User: [
    "/",
    "/welfare",
    "/events",
    "/messaging",
    "/new-members",
    "/members",
    "/settings",
  ],
  "HR Officer": [
    "/",
    "/members",
    "/new-members",
    "/hr",
    "/messaging",
    "/welfare",
    "/appointments",
    "/events",
    "/settings",
    "/system-logs",
  ],
  "Finance Officer": [
    "/",
    "/finance",
    "/welfare",
    "/messaging",
    "/appointments",
    "/events",
    "/settings",
    "/system-logs",
  ],
  Admin: [
    "/",
    "/members",
    "/new-members",
    "/hr",
    "/finance",
    "/messaging",
    "/welfare",
    "/appointments",
    "/events",
    "/settings",
    "/system-logs",
    "/users",
    "/inventory",
  ],
};

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const userAllowedPages = rolePages[user.role as keyof typeof rolePages] || [
      "/",
    ];

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-lg border border-red-200">
          <div className="mb-4">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-red-600 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. Your role (
              {user.role}) doesn't include access to this module.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>

            <Button
              onClick={() => navigate("/")}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Your authorized pages:</strong>
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              {userAllowedPages.map((page) => (
                <div
                  key={page}
                  className="cursor-pointer hover:text-blue-600"
                  onClick={() => navigate(page)}
                >
                  {page === "/"
                    ? "Dashboard"
                    : page
                        .substring(1)
                        .replace("-", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
