/**
 * TSOAM Church Management System - Member Tithe Records Component
 *
 * Simple viewer for individual member's tithe history with print functionality
 *
 * @author TSOAM Development Team
 * @version 1.0.0
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Printer,
  Download,
  DollarSign,
  Calendar,
  Plus,
  CreditCard,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FullMember {
  id: string;
  memberId: string;
  titheNumber: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  membershipDate: string;
  totalTithes?: number;
  lastTitheDate?: string;
  lastTitheAmount?: number;
}

interface TitheRecord {
  id: string;
  titheId: string;
  memberId: string;
  memberName: string;
  titheNumber: string;
  amount: number;
  paymentMethod: "Cash" | "M-Pesa" | "Bank Transfer" | "Cheque" | "Card";
  paymentReference?: string;
  titheDate: string;
  category: "Tithe" | "Offering" | "Building Fund" | "Mission" | "Welfare";
  receivedBy: string;
  notes?: string;
}

interface MemberTitheRecordsProps {
  isOpen: boolean;
  onClose: () => void;
  member: FullMember | null;
}

export function MemberTitheRecords({
  isOpen,
  onClose,
  member,
}: MemberTitheRecordsProps) {
  const [titheRecords, setTitheRecords] = useState<TitheRecord[]>([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalRecords: 0,
    averageAmount: 0,
    lastTitheDate: "",
  });

  // Tithe recording states
  const [activeTab, setActiveTab] = useState<"view" | "record">("view");
  const [titheForm, setTitheForm] = useState({
    amount: "",
    paymentMethod: "Cash" as const,
    paymentReference: "",
    notes: "",
    titheDate: new Date().toISOString().split("T")[0], // Default to today
  });
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    if (member && isOpen) {
      loadMemberTithes();
    }
  }, [member, isOpen]);

  const validateTitheDate = (selectedDate: string) => {
    const today = new Date();
    const selected = new Date(selectedDate);

    // Remove time component for accurate comparison
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);

    if (selected > today) {
      setDateError("Tithe date cannot be in the future");
      return false;
    } else {
      setDateError("");
      return true;
    }
  };

  const loadMemberTithes = () => {
    if (!member) return;

    // Mock tithe data - STRICTLY TITHES ONLY (no offerings or other contributions)
    const allRecords: TitheRecord[] = [
      {
        id: "1",
        titheId: "TITHE-2025-001",
        memberId: member.memberId,
        memberName: member.fullName,
        titheNumber: member.titheNumber,
        amount: 5000,
        paymentMethod: "M-Pesa",
        paymentReference: "RBK8H61G2M",
        titheDate: "2025-01-12",
        category: "Tithe",
        receivedBy: "Pastor John",
      },
      {
        id: "2",
        titheId: "TITHE-2025-002",
        memberId: member.memberId,
        memberName: member.fullName,
        titheNumber: member.titheNumber,
        amount: 3000,
        paymentMethod: "Cash",
        titheDate: "2025-01-05",
        category: "Tithe",
        receivedBy: "Elder Mary",
      },
      {
        id: "3",
        titheId: "TITHE-2025-003",
        memberId: member.memberId,
        memberName: member.fullName,
        titheNumber: member.titheNumber,
        amount: 10000,
        paymentMethod: "Bank Transfer",
        paymentReference: "TXN12345",
        titheDate: "2024-12-29",
        category: "Offering", // Changed to valid category
        receivedBy: "Treasurer Paul",
        notes: "Year-end thanksgiving offering",
      },
      {
        id: "4",
        titheId: "TITHE-2025-004",
        memberId: member.memberId,
        memberName: member.fullName,
        titheNumber: member.titheNumber,
        amount: 5000,
        paymentMethod: "M-Pesa",
        paymentReference: "RBK9H72H3N",
        titheDate: "2024-12-22",
        category: "Tithe",
        receivedBy: "Pastor John",
      },
      {
        id: "5",
        titheId: "TITHE-2025-005",
        memberId: member.memberId,
        memberName: member.fullName,
        titheNumber: member.titheNumber,
        amount: 4500,
        paymentMethod: "Cash",
        titheDate: "2024-12-15",
        category: "Tithe",
        receivedBy: "Elder Mary",
      },
      {
        id: "6",
        titheId: "TITHE-2025-006",
        memberId: member.memberId,
        memberName: member.fullName,
        titheNumber: member.titheNumber,
        amount: 2000,
        paymentMethod: "M-Pesa",
        paymentReference: "RBK7G52F4K",
        titheDate: "2024-12-08",
        category: "Building Fund", // This will be filtered out
        receivedBy: "Elder Mary",
      },
    ];

    // FILTER STRICTLY FOR TITHES ONLY - exclude all other offerings
    const titheOnlyRecords = allRecords.filter(
      (record) => record.category === "Tithe",
    );
    setTitheRecords(titheOnlyRecords);

    // Calculate summary - TITHES ONLY
    const totalAmount = titheOnlyRecords.reduce(
      (sum, record) => sum + record.amount,
      0,
    );
    const totalRecords = titheOnlyRecords.length;
    const averageAmount = totalRecords > 0 ? totalAmount / totalRecords : 0;
    const lastTitheDate =
      titheOnlyRecords.length > 0 ? titheOnlyRecords[0].titheDate : "";

    setSummary({
      totalAmount,
      totalRecords,
      averageAmount,
      lastTitheDate,
    });
  };

  const handleRecordTithe = () => {
    if (!member) return;

    if (!titheForm.amount || parseFloat(titheForm.amount) <= 0) {
      alert("Please enter a valid tithe amount.");
      return;
    }

    if (!validateTitheDate(titheForm.titheDate)) {
      alert("Please select a valid tithe date. Date cannot be in the future.");
      return;
    }

    // Create new tithe record
    const newTithe: TitheRecord = {
      id: `new-${Date.now()}`,
      titheId: `TITHE-${new Date().getFullYear()}-${String(titheRecords.length + 1).padStart(3, "0")}`,
      memberId: member.memberId,
      memberName: member.fullName,
      titheNumber: member.titheNumber,
      amount: parseFloat(titheForm.amount),
      paymentMethod: titheForm.paymentMethod,
      paymentReference: titheForm.paymentReference || undefined,
      titheDate: titheForm.titheDate,
      category: "Tithe",
      receivedBy: "Current User", // In production, this would come from auth context
      notes: titheForm.notes || undefined,
    };

    // Add to existing records
    const updatedRecords = [newTithe, ...titheRecords];
    setTitheRecords(updatedRecords);

    // Update summary
    const newTotalAmount = updatedRecords.reduce(
      (sum, record) => sum + record.amount,
      0,
    );
    const newTotalRecords = updatedRecords.length;
    const newAverageAmount =
      newTotalRecords > 0 ? newTotalAmount / newTotalRecords : 0;

    setSummary({
      totalAmount: newTotalAmount,
      totalRecords: newTotalRecords,
      averageAmount: newAverageAmount,
      lastTitheDate: newTithe.titheDate,
    });

    // Reset form
    setTitheForm({
      amount: "",
      paymentMethod: "Cash",
      paymentReference: "",
      notes: "",
      titheDate: new Date().toISOString().split("T")[0],
    });
    setDateError("");

    // Switch to view tab to show the new record
    setActiveTab("view");

    alert(
      `Tithe recorded successfully!\nAmount: KSH ${newTithe.amount.toLocaleString()}\nTithe ID: ${newTithe.titheId}`,
    );
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tithe Records - ${member?.fullName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #800020;
              padding-bottom: 25px;
              background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
              padding: 25px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(128, 0, 32, 0.1);
            }
            .church-logo {
              margin-bottom: 15px;
            }
            .church-name {
              font-size: 28px;
              font-weight: bold;
              color: #800020;
              margin-bottom: 5px;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .church-subtitle {
              font-size: 14px;
              color: #800020;
              margin-bottom: 15px;
              font-weight: 500;
            }
            .document-title {
              font-size: 22px;
              margin-bottom: 8px;
              color: #800020;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              border: 2px solid #800020;
              padding: 10px;
              background-color: rgba(128, 0, 32, 0.05);
            }
            .report-subtitle {
              font-size: 14px;
              color: #666;
              margin-bottom: 10px;
              font-style: italic;
            }
            .generation-date {
              font-size: 12px;
              color: #888;
            }
            .member-info {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .member-info h3 {
              margin: 0 0 10px 0;
              color: #800020;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-bottom: 30px;
            }
            .summary-card {
              background: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              text-align: center;
            }
            .summary-card .value {
              font-size: 18px;
              font-weight: bold;
              color: #800020;
            }
            .summary-card .label {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #800020;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f2f2f2;
            }
            .category-badge {
              background: #e3f2fd;
              color: #1565c0;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="church-logo">
              <div class="church-name">THE SEED OF ABRAHAM MINISTRY</div>
              <div class="church-subtitle">CHURCH MANAGEMENT SYSTEM</div>
            </div>
            <div class="document-title">MEMBER TITHE RECORDS REPORT</div>
            <div class="report-subtitle">Tithes Only - Excluding Other Offerings</div>
            <div class="generation-date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          </div>

          <div class="member-info">
            <h3>Member Information</h3>
            <div><strong>Name:</strong> ${member?.fullName}</div>
            <div><strong>Member ID:</strong> ${member?.memberId}</div>
            <div><strong>Tithe Number:</strong> ${member?.titheNumber}</div>
            <div><strong>Phone:</strong> ${member?.phoneNumber}</div>
            <div><strong>Member Since:</strong> ${new Date(member?.membershipDate || "").toLocaleDateString()}</div>
          </div>

          <div class="summary">
            <div class="summary-card">
              <div class="value">KSH ${summary.totalAmount.toLocaleString()}</div>
              <div class="label">Total Tithes</div>
            </div>
            <div class="summary-card">
              <div class="value">${summary.totalRecords}</div>
              <div class="label">Total Records</div>
            </div>
            <div class="summary-card">
              <div class="value">KSH ${Math.round(summary.averageAmount).toLocaleString()}</div>
              <div class="label">Average Amount</div>
            </div>
            <div class="summary-card">
              <div class="value">${summary.lastTitheDate ? new Date(summary.lastTitheDate).toLocaleDateString() : "N/A"}</div>
              <div class="label">Last Tithe Date</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount (KSH)</th>
                <th>Payment Method</th>
                <th>Reference</th>
                <th>Received By</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${titheRecords
                .map(
                  (record) => `
                <tr>
                  <td>${new Date(record.titheDate).toLocaleDateString()}</td>
                  <td>${record.amount.toLocaleString()}</td>
                  <td>${record.paymentMethod}</td>
                  <td>${record.paymentReference || "-"}</td>
                  <td>${record.receivedBy}</td>
                  <td>${record.notes || "-"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            <div>This is an official record of tithe contributions for ${member?.fullName}</div>
            <div>The Seed of Abraham Ministry - Church Management System - Printed on ${new Date().toLocaleString()}</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadCSV = () => {
    const csvContent = [
      [
        "Date",
        "Amount (KSH)",
        "Payment Method",
        "Reference",
        "Received By",
        "Notes",
      ],
      ...titheRecords.map((record) => [
        new Date(record.titheDate).toLocaleDateString(),
        record.amount.toString(),
        record.paymentMethod,
        record.paymentReference || "",
        record.receivedBy,
        record.notes || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${member?.fullName}_Tithe_Records_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" style={{ color: "#800020" }} />
            <span style={{ color: "#800020" }}>
              Tithe Records - {member.fullName}
            </span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Tithe contributions only - excludes offerings, building fund, and
            other contributions
          </p>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "view" | "record")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view">View Records</TabsTrigger>
            <TabsTrigger value="record" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Record Tithe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-6">
            {/* Member Info Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Member Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">
                      Member ID
                    </div>
                    <div className="font-mono">{member.memberId}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">
                      Tithe Number
                    </div>
                    <div className="font-mono">{member.titheNumber}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">
                      Phone
                    </div>
                    <div>{member.phoneNumber}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">
                      Member Since
                    </div>
                    <div>
                      {new Date(member.membershipDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    KSH {summary.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Tithes
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {summary.totalRecords}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Records
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    KSH {Math.round(summary.averageAmount).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average Amount
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    <Calendar className="h-6 w-6 mx-auto mb-1" />
                  </div>
                  <div className="text-sm font-medium">
                    {summary.lastTitheDate
                      ? new Date(summary.lastTitheDate).toLocaleDateString()
                      : "No records"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last Tithe Date
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleDownloadCSV}
                className="font-semibold py-3 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-500"
              >
                <Download className="h-4 w-4 mr-2" />
                📊 Download CSV
              </Button>
              <Button
                onClick={handlePrint}
                className="font-semibold py-3 bg-green-600 hover:bg-green-700 border-green-600 text-white"
              >
                <Printer className="h-4 w-4 mr-2" />
                🖨️ Print Records
              </Button>
            </div>

            {/* Tithe Records Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg" style={{ color: "#800020" }}>
                  Tithe History (Tithes Only)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  This report shows tithe contributions only. Other offerings
                  and contributions are tracked separately.
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Received By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {titheRecords.length > 0 ? (
                      titheRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {new Date(record.titheDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">
                              KSH {record.amount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {record.paymentMethod}
                            </Badge>
                          </TableCell>

                          <TableCell className="font-mono text-xs">
                            {record.paymentReference || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.receivedBy}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {record.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No tithe records found for this member
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="record" className="space-y-6">
            {/* Record New Tithe */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle
                  className="text-lg flex items-center gap-2"
                  style={{ color: "#800020" }}
                >
                  <CreditCard className="h-5 w-5" />
                  Record New Tithe for {member.fullName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Recording tithe for Member ID: {member.memberId} • Tithe
                  Number: {member.titheNumber}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Amount and Payment Method */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Tithe Amount (KSH) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                        KSH
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        value={titheForm.amount}
                        onChange={(e) =>
                          setTitheForm({ ...titheForm, amount: e.target.value })
                        }
                        onFocus={(e) => {
                          if (
                            e.target.value === "0" ||
                            e.target.value === "0.00"
                          ) {
                            setTitheForm({ ...titheForm, amount: "" });
                          }
                        }}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="text-lg font-semibold pl-16 pr-4 py-3 text-right bg-green-50 border-green-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method *</Label>
                    <Select
                      value={titheForm.paymentMethod}
                      onValueChange={(value: any) =>
                        setTitheForm({ ...titheForm, paymentMethod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                        <SelectItem value="Bank Transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment Reference */}
                {titheForm.paymentMethod !== "Cash" && (
                  <div className="space-y-2">
                    <Label htmlFor="reference">Payment Reference</Label>
                    <Input
                      id="reference"
                      value={titheForm.paymentReference}
                      onChange={(e) =>
                        setTitheForm({
                          ...titheForm,
                          paymentReference: e.target.value,
                        })
                      }
                      placeholder="Transaction ID, Cheque number, etc."
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    value={titheForm.notes}
                    onChange={(e) =>
                      setTitheForm({ ...titheForm, notes: e.target.value })
                    }
                    placeholder="Additional notes about this tithe..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Tithe Date Picker */}
                <div className="space-y-2">
                  <Label htmlFor="titheDate">Tithe Date *</Label>
                  <div className="relative">
                    <Input
                      id="titheDate"
                      type="date"
                      value={titheForm.titheDate}
                      max={new Date().toISOString().split("T")[0]} // Prevent future dates
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setTitheForm({ ...titheForm, titheDate: newDate });
                        validateTitheDate(newDate);
                      }}
                      className={`${dateError ? "border-red-500 focus:ring-red-500" : ""}`}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  {dateError && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span className="text-red-500">⚠</span>
                      {dateError}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Select the date when the tithe was received. Future dates
                    are not allowed.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleRecordTithe}
                    disabled={
                      !titheForm.amount ||
                      parseFloat(titheForm.amount) <= 0 ||
                      !titheForm.titheDate ||
                      !!dateError
                    }
                    className="flex-1 font-semibold py-3 bg-green-600 hover:bg-green-700 border-green-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    💰 Record Tithe
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTitheForm({
                        amount: "",
                        paymentMethod: "Cash",
                        paymentReference: "",
                        notes: "",
                        titheDate: new Date().toISOString().split("T")[0],
                      });
                      setDateError("");
                    }}
                    className="font-semibold py-3 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-500"
                  >
                    🔄 Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
