import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Eye,
  Bell,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { financialTransactionService } from "@/services/FinancialTransactionService";
import { useAuth } from "@/contexts/AuthContext";

interface FinanceApprovalCenterProps {
  className?: string;
}

export function FinanceApprovalCenter({
  className,
}: FinanceApprovalCenterProps) {
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">(
    "approve",
  );
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useAuth(); // Get current authenticated user

  useEffect(() => {
    // Load pending transactions
    const loadPendingTransactions = () => {
      const pending = financialTransactionService.getPendingTransactions();
      setPendingTransactions(pending);
    };

    loadPendingTransactions();

    // Subscribe to updates
    const handleUpdate = () => {
      loadPendingTransactions();
    };

    const handleNotification = (notification: any) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 9)]); // Keep last 10

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    };

    financialTransactionService.subscribe(handleUpdate);
    financialTransactionService.subscribeToNotifications(handleNotification);

    return () => {
      financialTransactionService.unsubscribe(handleUpdate);
    };
  }, []);

  const handleApprovalAction = (
    transaction: any,
    action: "approve" | "reject",
  ) => {
    setSelectedTransaction(transaction);
    setApprovalAction(action);
    setRejectionReason("");
    setShowApprovalDialog(true);
  };

  const processApproval = () => {
    if (!selectedTransaction) return;

    const currentUser = user?.name || "Finance Manager";

    if (approvalAction === "approve") {
      const success = financialTransactionService.approveTransaction(
        selectedTransaction.id,
        currentUser,
      );

      if (success) {
        toast({
          title: "Transaction Approved",
          description: `Transaction ${selectedTransaction.id} has been approved.`,
          variant: "default",
        });
      }
    } else {
      if (!rejectionReason.trim()) {
        toast({
          title: "Rejection Reason Required",
          description:
            "Please provide a reason for rejecting this transaction.",
          variant: "destructive",
        });
        return;
      }

      const success = financialTransactionService.rejectTransaction(
        selectedTransaction.id,
        currentUser,
        rejectionReason,
      );

      if (success) {
        toast({
          title: "Transaction Rejected",
          description: `Transaction ${selectedTransaction.id} has been rejected.`,
          variant: "destructive",
        });
      }
    }

    setShowApprovalDialog(false);
    setSelectedTransaction(null);
  };

  const getModuleBadgeColor = (module: string) => {
    switch (module) {
      case "HR":
        return "bg-blue-100 text-blue-800";
      case "Inventory":
        return "bg-yellow-100 text-yellow-800";
      case "Welfare":
        return "bg-purple-100 text-purple-800";
      case "Events":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Finance Approval Center
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {pendingTransactions.length} Pending
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No transactions pending approval</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.id}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getModuleBadgeColor(transaction.module)}
                      >
                        {transaction.module}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.type === "Income"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell className="font-semibold">
                      <span
                        className={
                          transaction.type === "Income"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {transaction.type === "Income" ? "+" : "-"}
                        {transaction.currency}{" "}
                        {transaction.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.requestedBy}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleApprovalAction(transaction, "approve")
                          }
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleApprovalAction(transaction, "reject")
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {notification.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {notification.message}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "Approve" : "Reject"} Transaction
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTransaction && (
              <div className="p-4 border rounded-lg bg-muted">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <strong>ID:</strong> {selectedTransaction.id}
                  </div>
                  <div>
                    <strong>Module:</strong> {selectedTransaction.module}
                  </div>
                  <div>
                    <strong>Type:</strong> {selectedTransaction.type}
                  </div>
                  <div>
                    <strong>Amount:</strong> {selectedTransaction.currency}{" "}
                    {selectedTransaction.amount.toLocaleString()}
                  </div>
                  <div className="col-span-2">
                    <strong>Description:</strong>{" "}
                    {selectedTransaction.description}
                  </div>
                </div>
              </div>
            )}

            {approvalAction === "reject" && (
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a reason for rejecting this transaction..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={processApproval}
                variant={
                  approvalAction === "approve" ? "default" : "destructive"
                }
              >
                {approvalAction === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
