import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  UserCheck,
  AlertTriangle,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  FileText,
} from "lucide-react";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  employeeId?: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  documents?: string[];
  ipAddress?: string;
  userAgent?: string;
}

interface AccountVerificationProps {
  onUserApproved?: (userId: string) => void;
  onUserRejected?: (userId: string) => void;
}

export function AccountVerification({
  onUserApproved,
  onUserRejected,
}: AccountVerificationProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">(
    "approve",
  );
  const [approvalReason, setApprovalReason] = useState("");
  const [assignedRole, setAssignedRole] = useState("");
  const [assignedDepartment, setAssignedDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users/pending-verification");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPendingUsers(data.users || []);
      } else {
        console.warn("API returned unsuccessful response:", data);
        // Fall through to fallback
        throw new Error("API returned unsuccessful response");
      }
    } catch (error) {
      console.warn("API not available, using demo mode:", error.message);

      // Fallback to localStorage and check for actual pending users
      try {
        let storedUsers = [];

        // First check for actual newly created users from system
        const systemUsersData = localStorage.getItem("tsoam_system_users");
        if (systemUsersData) {
          const systemUsers = JSON.parse(systemUsersData);
          const pendingSystemUsers = systemUsers
            .filter((user: any) => !user.isActive && user.isNewAccount)
            .map((user: any) => ({
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone || "N/A",
              role: user.role,
              department: user.department,
              employeeId: user.employeeId,
              requested_by: "Account Registration",
              request_date: user.createdAt || new Date().toISOString(),
              status: "pending",
              request_reason: "New account registration",
              ip_address: "127.0.0.1",
              userAgent: navigator.userAgent,
            }));

          if (pendingSystemUsers.length > 0) {
            setPendingUsers(pendingSystemUsers);
            setIsLoading(false);
            return;
          }
        }

        // Then check dedicated pending users storage
        const stored = localStorage.getItem("pending_users");
        if (stored) {
          storedUsers = JSON.parse(stored);
        } else {
          // Create mock pending users for demo
          storedUsers = [
            {
              id: "pending_001",
              name: "John Kamau",
              email: "john.kamau@example.com",
              phone: "+254 700 123 456",
              role: "Member",
              department: "Youth Ministry",
              employeeId: "EMP001",
              requested_by: "Login Form",
              request_date: new Date(
                Date.now() - 2 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              status: "pending",
              request_reason: "New member registration request",
              ip_address: "192.168.1.1",
              userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            {
              id: "pending_002",
              name: "Grace Wanjiku",
              email: "grace.wanjiku@example.com",
              phone: "+254 721 456 789",
              role: "Staff",
              department: "Finance",
              employeeId: "EMP002",
              requested_by: "HR Manager",
              request_date: new Date(
                Date.now() - 1 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              status: "pending",
              request_reason: "New staff member account",
              ip_address: "192.168.1.2",
              userAgent:
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            },
            {
              id: "pending_003",
              name: "Peter Mwangi",
              email: "peter.mwangi@example.com",
              phone: "+254 733 789 012",
              role: "Administrator",
              department: "IT",
              employeeId: "EMP003",
              requested_by: "System Admin",
              request_date: new Date(
                Date.now() - 3 * 60 * 60 * 1000,
              ).toISOString(),
              status: "pending",
              request_reason: "IT administrator access request",
              ip_address: "192.168.1.3",
              userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
            },
          ];

          // Save mock data to localStorage
          localStorage.setItem("pending_users", JSON.stringify(storedUsers));
        }

        setPendingUsers(storedUsers);
        console.log("Demo mode: Using mock pending users");
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        setPendingUsers([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleViewDetails = (user: PendingUser) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const handleApprovalAction = (
    user: PendingUser,
    action: "approve" | "reject",
  ) => {
    setSelectedUser(user);
    setApprovalAction(action);
    setAssignedRole(user.role);
    setAssignedDepartment(user.department || "");
    setApprovalReason("");
    setShowApprovalDialog(true);
  };

  const processApproval = async () => {
    if (!selectedUser) return;

    if (approvalAction === "reject" && !approvalReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejecting this account.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/users/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: approvalAction,
          assignedRole: assignedRole,
          assignedDepartment: assignedDepartment,
          reason: approvalReason,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        await handleSuccessfulApproval();
      } else {
        throw new Error(result.error || "Failed to process account");
      }
    } catch (error) {
      console.warn(
        "API not available, processing in demo mode:",
        error.message,
      );

      // Handle in demo mode with localStorage
      try {
        // Handle system users first
        const systemUsersData = localStorage.getItem("tsoam_system_users");
        if (systemUsersData) {
          const systemUsers = JSON.parse(systemUsersData);
          const userIndex = systemUsers.findIndex(
            (u: any) => u.id === selectedUser.id,
          );

          if (userIndex !== -1) {
            if (approvalAction === "approve") {
              // Activate the user
              systemUsers[userIndex].isActive = true;
              systemUsers[userIndex].role = assignedRole;
              systemUsers[userIndex].department = assignedDepartment;
              systemUsers[userIndex].approvedAt = new Date().toISOString();
            } else {
              // Remove rejected user
              systemUsers.splice(userIndex, 1);
            }

            localStorage.setItem(
              "tsoam_system_users",
              JSON.stringify(systemUsers),
            );
          }
        }

        // Also handle legacy pending users
        const storedUsers = JSON.parse(
          localStorage.getItem("pending_users") || "[]",
        );
        const updatedUsers = storedUsers.filter(
          (user: any) => user.id !== selectedUser.id,
        );
        localStorage.setItem("pending_users", JSON.stringify(updatedUsers));

        if (approvalAction === "approve") {
          // Add to approved users list for legacy support
          const approvedUsers = JSON.parse(
            localStorage.getItem("church_users") || "[]",
          );
          const newUser = {
            id: selectedUser.id,
            name: selectedUser.name,
            email: selectedUser.email,
            phone: selectedUser.phone,
            role: assignedRole || selectedUser.role,
            department: assignedDepartment || selectedUser.department,
            employeeId: selectedUser.employeeId,
            isActive: true,
            approvedDate: new Date().toISOString(),
            approvedBy: "Current User", // In real app, this would be the logged-in user
          };
          approvedUsers.push(newUser);
          localStorage.setItem("church_users", JSON.stringify(approvedUsers));
        }

        await handleSuccessfulApproval(true);
      } catch (demoError) {
        console.error("Demo mode processing failed:", demoError);
        toast({
          title: "Error",
          description: "Failed to process account. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSuccessfulApproval = async (isDemo = false) => {
    toast({
      title: "Account Processed",
      description: `Account has been ${approvalAction === "approve" ? "approved" : "rejected"} successfully.${isDemo ? " (Demo Mode)" : ""}`,
    });

    // Remove from pending list
    setPendingUsers((prev) =>
      prev.filter((user) => user.id !== selectedUser.id),
    );

    // Call callbacks
    if (approvalAction === "approve" && onUserApproved) {
      onUserApproved(selectedUser.id);
    } else if (approvalAction === "reject" && onUserRejected) {
      onUserRejected(selectedUser.id);
    }

    // Log the action (non-blocking)
    try {
      await fetch("/api/system-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: `Account ${approvalAction === "approve" ? "Approved" : "Rejected"}`,
          module: "User Management",
          details: `${approvalAction === "approve" ? "Approved" : "Rejected"} account for ${selectedUser.name} (${selectedUser.email})${isDemo ? " (Demo Mode)" : ""}`,
          severity: "Info",
        }),
      });
    } catch (logError) {
      console.warn("Failed to log action:", logError);
    }

    // Close dialog and reset state
    setShowApprovalDialog(false);
    setSelectedUser(null);
    setApprovalReason("");
    setAssignedRole("");
    setAssignedDepartment("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="default"
            className="flex items-center gap-1 bg-green-100 text-green-800"
          >
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: { [key: string]: string } = {
      Admin: "bg-red-100 text-red-800",
      "HR Officer": "bg-blue-100 text-blue-800",
      "Finance Officer": "bg-green-100 text-green-800",
      User: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge
        variant="outline"
        className={colors[role] || "bg-gray-100 text-gray-800"}
      >
        {role}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Clock className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">
            Loading pending accounts...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Account Verification
          {pendingUsers.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingUsers.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              No pending account verifications
            </p>
            <p className="text-sm text-gray-500">
              New account requests will appear here for approval
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Details</TableHead>
                <TableHead>Requested Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3 text-gray-400" />
                      {user.department || "Not specified"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(user.requestedAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {user.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApprovalAction(user, "approve")
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprovalAction(user, "reject")}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
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

        {/* User Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Account Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded">
                      {selectedUser.name}
                    </div>
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded">
                      {selectedUser.email}
                    </div>
                  </div>
                  <div>
                    <Label>Requested Role</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded">
                      {selectedUser.role}
                    </div>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded">
                      {selectedUser.department || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <Label>Employee ID</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded">
                      {selectedUser.employeeId || "Not provided"}
                    </div>
                  </div>
                  <div>
                    <Label>Request Date</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded">
                      {new Date(selectedUser.requestedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {selectedUser.ipAddress && (
                  <div>
                    <Label>Request Information</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                      <div>IP Address: {selectedUser.ipAddress}</div>
                      {selectedUser.userAgent && (
                        <div className="mt-1 text-gray-600">
                          User Agent: {selectedUser.userAgent}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsDialog(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approval Dialog */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {approvalAction === "approve" ? "Approve" : "Reject"} Account
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded">
                  <div className="font-medium">{selectedUser.name}</div>
                  <div className="text-sm text-gray-600">
                    {selectedUser.email}
                  </div>
                </div>

                {approvalAction === "approve" && (
                  <>
                    <div>
                      <Label htmlFor="assignedRole">Assign Role</Label>
                      <Select
                        value={assignedRole}
                        onValueChange={setAssignedRole}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="User">User</SelectItem>
                          <SelectItem value="HR Officer">HR Officer</SelectItem>
                          <SelectItem value="Finance Officer">
                            Finance Officer
                          </SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="assignedDepartment">Department</Label>
                      <Input
                        id="assignedDepartment"
                        value={assignedDepartment}
                        onChange={(e) => setAssignedDepartment(e.target.value)}
                        placeholder="Enter department"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="reason">
                    {approvalAction === "approve"
                      ? "Notes (Optional)"
                      : "Rejection Reason *"}
                  </Label>
                  <Textarea
                    id="reason"
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    placeholder={
                      approvalAction === "approve"
                        ? "Add any notes about this approval..."
                        : "Explain why this account is being rejected..."
                    }
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowApprovalDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={processApproval}
                    className={
                      approvalAction === "approve"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }
                  >
                    {approvalAction === "approve"
                      ? "Approve Account"
                      : "Reject Account"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
