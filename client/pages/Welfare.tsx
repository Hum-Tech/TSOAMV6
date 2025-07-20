import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { financialTransactionService } from "@/services/FinancialTransactionService";
import {
  Plus,
  Search,
  Download,
  Heart,
  DollarSign,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Home,
  Briefcase,
  Upload,
  File,
  Trash2,
  Eye,
} from "lucide-react";
import { exportService } from "@/services/ExportService";

// Types for welfare data
interface WelfareRequest {
  id: number;
  requestId: string;
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  typeOfAssistanceNeeded: string;
  specificAmountRequested: number;
  reasonForRequest: string;
  status: "Pending" | "Under Review" | "Approved" | "Denied" | "Completed";
  dateOfApplication: string;
  membershipStatus: "Active" | "Inactive" | "Non-Member";
  serviceGroup: string;
  monthlyIncome: number;
  employmentStatus: string;
}

interface WelfareBudget {
  serviceType: "Medical" | "Rent" | "Business" | "School Fees";
  allocatedBudget: number;
  usedBudget: number;
  remainingBudget: number;
  numberOfRequests: number;
  numberApproved: number;
  numberDenied: number;
}

function Welfare() {
  const [activeTab, setActiveTab] = useState("requests");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);

  // Sample data
  const [welfareRequests] = useState<WelfareRequest[]>([
    {
      id: 1,
      requestId: "TWF-2025-001",
      fullName: "Mary Wanjiku",
      phoneNumber: "+254 700 123 456",
      emailAddress: "mary.wanjiku@email.com",
      typeOfAssistanceNeeded: "Medical",
      specificAmountRequested: 50000,
      reasonForRequest: "Child needs urgent medical treatment for pneumonia",
      status: "Under Review",
      dateOfApplication: "2025-01-15",
      membershipStatus: "Active",
      serviceGroup: "Women's Ministry",
      monthlyIncome: 0,
      employmentStatus: "Unemployed",
    },
    {
      id: 2,
      requestId: "TWF-2025-002",
      fullName: "John Kiprotich",
      phoneNumber: "+254 700 987 654",
      emailAddress: "john.kiprotich@email.com",
      typeOfAssistanceNeeded: "Rent",
      specificAmountRequested: 30000,
      reasonForRequest: "Need assistance with 2 months rent arrears",
      status: "Approved",
      dateOfApplication: "2025-01-14",
      membershipStatus: "Active",
      serviceGroup: "Men's Ministry",
      monthlyIncome: 25000,
      employmentStatus: "Self-employed",
    },
  ]);

  const [welfareBudgets] = useState<WelfareBudget[]>([
    {
      serviceType: "Medical",
      allocatedBudget: 500000,
      usedBudget: 150000,
      remainingBudget: 350000,
      numberOfRequests: 8,
      numberApproved: 5,
      numberDenied: 2,
    },
    {
      serviceType: "Rent",
      allocatedBudget: 300000,
      usedBudget: 120000,
      remainingBudget: 180000,
      numberOfRequests: 4,
      numberApproved: 3,
      numberDenied: 1,
    },
    {
      serviceType: "Business",
      allocatedBudget: 400000,
      usedBudget: 80000,
      remainingBudget: 320000,
      numberOfRequests: 2,
      numberApproved: 1,
      numberDenied: 1,
    },
    {
      serviceType: "School Fees",
      allocatedBudget: 600000,
      usedBudget: 200000,
      remainingBudget: 400000,
      numberOfRequests: 10,
      numberApproved: 7,
      numberDenied: 2,
    },
  ]);

  // Export functions
  const handleExport = async (format: "excel" | "pdf" | "csv") => {
    const filteredRequests = welfareRequests.filter((request) => {
      const matchesSearch =
        request.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requestId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || request.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    const formattedData = filteredRequests.map((request) => ({
      "Request ID": request.requestId,
      "Full Name": request.fullName,
      Phone: request.phoneNumber,
      Email: request.emailAddress,
      "Assistance Type": request.typeOfAssistanceNeeded,
      "Amount Requested": request.specificAmountRequested,
      Status: request.status,
      "Application Date": request.dateOfApplication,
      "Membership Status": request.membershipStatus,
      "Service Group": request.serviceGroup,
      Reason: request.reasonForRequest,
      "Monthly Income": request.monthlyIncome,
      "Employment Status": request.employmentStatus,
    }));

    try {
      await exportService.export({
        filename: `TSOAM_Welfare_Requests_${new Date().toISOString().split("T")[0]}`,
        title: "TSOAM Church Welfare Requests Report",
        subtitle: `Generated on ${new Date().toLocaleDateString()} | Total Requests: ${formattedData.length}`,
        data: formattedData,
        format: format as "pdf" | "excel" | "csv",
        columns: [
          { key: "Request ID", title: "Request ID", width: 15 },
          { key: "Full Name", title: "Full Name", width: 25 },
          { key: "Phone", title: "Phone", width: 15 },
          { key: "Email", title: "Email", width: 25 },
          { key: "Assistance Type", title: "Assistance Type", width: 20 },
          { key: "Amount Requested", title: "Amount Requested" },
          { key: "Status", title: "Status" },
          { key: "Application Date", title: "Application Date" },
          { key: "Membership Status", title: "Membership Status" },
          { key: "Service Group", title: "Service Group" },
          { key: "Reason", title: "Reason" },
          { key: "Monthly Income", title: "Monthly Income" },
          { key: "Employment Status", title: "Employment Status" },
        ],
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed: " + error.message);
    }
  };

  // Filter functions
  const filteredRequests = welfareRequests.filter((request) => {
    const matchesSearch =
      request.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Status icon and color functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="h-4 w-4" />;
      case "Denied":
        return <XCircle className="h-4 w-4" />;
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "Under Review":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "text-green-600";
      case "Denied":
        return "text-red-600";
      case "Pending":
        return "text-yellow-600";
      case "Under Review":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case "Medical":
        return Heart;
      case "Rent":
        return Home;
      case "Business":
        return Briefcase;
      case "School Fees":
        return GraduationCap;
      default:
        return Heart;
    }
  };

  // Calculate totals
  const totalRequests = welfareRequests.length;
  const approvedRequests = welfareRequests.filter(
    (r) => r.status === "Approved",
  ).length;
  const pendingRequests = welfareRequests.filter(
    (r) => r.status === "Pending",
  ).length;
  const totalAmountRequested = welfareRequests.reduce(
    (sum, r) => sum + r.specificAmountRequested,
    0,
  );

  // Function to process welfare payment (sync with Finance)
  const processWelfarePayment = (request: WelfareRequest) => {
    if (request.status === "Approved") {
      // Record welfare payment in Finance module
      financialTransactionService.addWelfarePayment({
        memberName: request.fullName,
        memberId: String(request.id),
        paymentType: request.typeOfAssistanceNeeded,
        amount: request.specificAmountRequested,
        reason: request.reasonForRequest,
      });

      toast({
        title: "Welfare Payment Recorded",
        description: `Payment of KSh ${request.specificAmountRequested.toLocaleString()} to ${request.fullName} has been sent to Finance for approval.`,
      });
    }
  };

  // Handle welfare request approval
  const handleWelfareApproval = (
    request: WelfareRequest,
    newStatus: string,
  ) => {
    // Update request status
    const updatedRequests = welfareRequests.map((r) =>
      r.id === request.id ? { ...r, status: newStatus as any } : r,
    );

    // If approved, process financial transaction
    if (newStatus === "Approved") {
      processWelfarePayment({ ...request, status: "Approved" as any });
    }

    // Save welfare data for Dashboard integration
    const welfareModuleData = {
      requests: updatedRequests,
      lastUpdated: new Date().toISOString(),
      totalRequests: updatedRequests.length,
      approvedRequests: updatedRequests.filter((r) => r.status === "Approved")
        .length,
      pendingRequests: updatedRequests.filter((r) => r.status === "Pending")
        .length,
    };
    localStorage.setItem(
      "welfare_module_data",
      JSON.stringify(welfareModuleData),
    );

    toast({
      title: "Request Updated",
      description: `Welfare request has been ${newStatus.toLowerCase()}.`,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Welfare Management"
          description="Manage church welfare requests and assistance programs"
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Requests
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests}</div>
              <p className="text-xs text-muted-foreground">All time requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {approvedRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pendingRequests}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSH {totalAmountRequested.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Amount requested</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="requests">Welfare Requests</TabsTrigger>
              <TabsTrigger value="budget">Budget Overview</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button onClick={() => handleExport("excel")}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Dialog
                open={showNewRequestDialog}
                onOpenChange={setShowNewRequestDialog}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      TSOAM Welfare Form (TWF) - Assistance Application
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid gap-6 py-4">
                      {/* Personal Information Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                          Personal Information
                        </h3>

                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name *</Label>
                          <Input id="fullName" placeholder="Enter full name" />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="age">Age *</Label>
                            <Input id="age" type="number" placeholder="Age" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input id="phone" placeholder="+254 7XX XXX XXX" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="email@example.com"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="residence">Residence *</Label>
                            <Input
                              id="residence"
                              placeholder="Current residence"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cityStateZip">
                              City/State/ZIP *
                            </Label>
                            <Input
                              id="cityStateZip"
                              placeholder="City, State, ZIP"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="maritalStatus">
                              Marital Status *
                            </Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select marital status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Single">Single</SelectItem>
                                <SelectItem value="Married">Married</SelectItem>
                                <SelectItem value="Divorced">
                                  Divorced
                                </SelectItem>
                                <SelectItem value="Widowed">Widowed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dependents">
                              Number of Dependents
                            </Label>
                            <Input
                              id="dependents"
                              type="number"
                              onFocus={(e) => {
                                if (
                                  e.target.value === "0" ||
                                  e.target.value === "0.00"
                                ) {
                                  e.target.value = "";
                                }
                              }}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Church Affiliation Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                          Church Affiliation
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="membershipStatus">
                              Membership Status *
                            </Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select membership status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Active Member">
                                  Active Member
                                </SelectItem>
                                <SelectItem value="Inactive Member">
                                  Inactive Member
                                </SelectItem>
                                <SelectItem value="Non-Member">
                                  Non-Member
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="membershipLength">
                              Length of Membership
                            </Label>
                            <Input
                              id="membershipLength"
                              placeholder="e.g., 3 years"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="serviceGroup">
                              Service Group *
                            </Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select service group" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Youth Ministry">
                                  Youth Ministry
                                </SelectItem>
                                <SelectItem value="Worship Team">
                                  Worship Team
                                </SelectItem>
                                <SelectItem value="Sunday School">
                                  Sunday School
                                </SelectItem>
                                <SelectItem value="Ushering">
                                  Ushering
                                </SelectItem>
                                <SelectItem value="Prayer Ministry">
                                  Prayer Ministry
                                </SelectItem>
                                <SelectItem value="Evangelism">
                                  Evangelism
                                </SelectItem>
                                <SelectItem value="None">None</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="serviceGroupStatus">
                              Service Group Status
                            </Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">
                                  Inactive
                                </SelectItem>
                                <SelectItem value="Leadership">
                                  Leadership
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="titheStatus">Tithe Status *</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tithe status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Faithful Tither">
                                  Faithful Tither
                                </SelectItem>
                                <SelectItem value="Inconsistent Tither">
                                  Inconsistent Tither
                                </SelectItem>
                                <SelectItem value="Non-Tither">
                                  Non-Tither
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Service Attendance *</Label>
                            <div className="flex gap-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="midweek" />
                                <Label htmlFor="midweek" className="text-sm">
                                  Midweek
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="sunday" />
                                <Label htmlFor="sunday" className="text-sm">
                                  Sunday
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="events" />
                                <Label htmlFor="events" className="text-sm">
                                  Church Events
                                </Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Information Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                          Financial Information
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="employmentStatus">
                              Employment Status *
                            </Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select employment status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Employed Full-time">
                                  Employed Full-time
                                </SelectItem>
                                <SelectItem value="Employed Part-time">
                                  Employed Part-time
                                </SelectItem>
                                <SelectItem value="Self-Employed">
                                  Self-Employed
                                </SelectItem>
                                <SelectItem value="Unemployed">
                                  Unemployed
                                </SelectItem>
                                <SelectItem value="Student">Student</SelectItem>
                                <SelectItem value="Retired">Retired</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="monthlyIncome">
                              Monthly Income (KSH) *
                            </Label>
                            <Input
                              id="monthlyIncome"
                              type="number"
                              onFocus={(e) => {
                                if (
                                  e.target.value === "0" ||
                                  e.target.value === "0.00"
                                ) {
                                  e.target.value = "";
                                }
                              }}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="governmentAssistance">
                              Receiving Government Assistance?
                            </Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Yes">Yes</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="otherIncome">
                              Other Income Sources
                            </Label>
                            <Input
                              id="otherIncome"
                              placeholder="Describe other income sources"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="financialHardship">
                            Financial Hardship Description *
                          </Label>
                          <Textarea
                            id="financialHardship"
                            placeholder="Describe your current financial hardship situation"
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Assistance Requested Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                          Assistance Requested
                        </h3>

                        <div className="space-y-2">
                          <Label htmlFor="assistanceType">
                            Type of Assistance Needed *
                          </Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select assistance type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Medical">Medical</SelectItem>
                              <SelectItem value="School Fees">
                                School Fees
                              </SelectItem>
                              <SelectItem value="Rent">Rent</SelectItem>
                              <SelectItem value="Food">Food</SelectItem>
                              <SelectItem value="Business">
                                Business Support
                              </SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="amount">
                            Specific Amount Requested (KSH) *
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                              KSH
                            </span>
                            <Input
                              id="amount"
                              type="number"
                              onFocus={(e) => {
                                if (
                                  e.target.value === "0" ||
                                  e.target.value === "0.00"
                                ) {
                                  e.target.value = "";
                                }
                              }}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className="font-semibold pl-16 pr-4 py-3 text-right bg-green-50 border-green-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reason">Reason for Request *</Label>
                          <Textarea
                            id="reason"
                            placeholder="Provide detailed explanation of why you need this assistance"
                            rows={4}
                          />
                        </div>
                      </div>

                      {/* Supporting Documents Upload */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                          Supporting Documents
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Proof of Income */}
                          <div className="space-y-2">
                            <Label>Proof of Income (Pay slips, etc.)</Label>
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-3">
                              <div className="text-center">
                                <FileText className="mx-auto h-6 w-6 text-gray-400" />
                                <div className="mt-1">
                                  <label
                                    htmlFor="incomeProof"
                                    className="cursor-pointer"
                                  >
                                    <span className="text-sm text-blue-600 hover:text-blue-500">
                                      Upload files
                                    </span>
                                    <input
                                      id="incomeProof"
                                      type="file"
                                      multiple
                                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                                <p className="text-xs text-gray-500">
                                  PDF, DOC, JPG up to 10MB
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Proof of Expenses */}
                          <div className="space-y-2">
                            <Label>
                              Proof of Expenses (Bills, Rent, Fees statements)
                            </Label>
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-3">
                              <div className="text-center">
                                <FileText className="mx-auto h-6 w-6 text-gray-400" />
                                <div className="mt-1">
                                  <label
                                    htmlFor="expenseProof"
                                    className="cursor-pointer"
                                  >
                                    <span className="text-sm text-blue-600 hover:text-blue-500">
                                      Upload files
                                    </span>
                                    <input
                                      id="expenseProof"
                                      type="file"
                                      multiple
                                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                                <p className="text-xs text-gray-500">
                                  PDF, DOC, JPG up to 10MB
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Identification */}
                          <div className="space-y-2">
                            <Label>
                              Identification (Driver's License, ID Card)
                            </Label>
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-3">
                              <div className="text-center">
                                <FileText className="mx-auto h-6 w-6 text-gray-400" />
                                <div className="mt-1">
                                  <label
                                    htmlFor="identification"
                                    className="cursor-pointer"
                                  >
                                    <span className="text-sm text-blue-600 hover:text-blue-500">
                                      Upload files
                                    </span>
                                    <input
                                      id="identification"
                                      type="file"
                                      multiple
                                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                                <p className="text-xs text-gray-500">
                                  PDF, DOC, JPG up to 10MB
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Additional Documents */}
                          <div className="space-y-2">
                            <Label>
                              Additional Documents (Medical Reports, Forms,
                              etc.)
                            </Label>
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-3">
                              <div className="text-center">
                                <FileText className="mx-auto h-6 w-6 text-gray-400" />
                                <div className="mt-1">
                                  <label
                                    htmlFor="additionalDocs"
                                    className="cursor-pointer"
                                  >
                                    <span className="text-sm text-blue-600 hover:text-blue-500">
                                      Upload files
                                    </span>
                                    <input
                                      id="additionalDocs"
                                      type="file"
                                      multiple
                                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                                <p className="text-xs text-gray-500">
                                  PDF, DOC, JPG up to 10MB
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Declaration and Signature */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                          Declaration and Signature
                        </h3>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm leading-relaxed">
                            <strong>Declaration:</strong> I hereby declare that
                            all the information provided in this application is
                            true, accurate, and complete to the best of my
                            knowledge. I understand that any false information
                            may result in the rejection of my application or
                            termination of assistance. I also acknowledge that I
                            may be required to provide additional documentation
                            or attend an interview as part of the verification
                            process.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="applicantSignature">
                              Applicant's Signature (Type full name) *
                            </Label>
                            <Input
                              id="applicantSignature"
                              placeholder="Type your full name as signature"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="applicationDate">
                              Date of Application *
                            </Label>
                            <Input
                              id="applicationDate"
                              type="date"
                              defaultValue={
                                new Date().toISOString().split("T")[0]
                              }
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox id="declaration" required />
                          <Label htmlFor="declaration" className="text-sm">
                            I agree to the declaration statement above and
                            confirm that all information provided is accurate *
                          </Label>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> This application will be
                            reviewed by the TSOAM Welfare Committee. You will be
                            contacted within 7-14 business days regarding the
                            status of your application.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowNewRequestDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          toast({
                            title: "Request Submitted",
                            description:
                              "Your welfare request has been submitted successfully",
                          });
                          setShowNewRequestDialog(false);
                        }}
                      >
                        Submit Request
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="requests" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Denied">Denied</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Requests Table */}
            <Card>
              <CardHeader>
                <CardTitle>Welfare Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Assistance Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.requestId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {request.fullName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.membershipStatus} •{" "}
                              {request.serviceGroup}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {request.phoneNumber}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {request.emailAddress}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{request.typeOfAssistanceNeeded}</TableCell>
                        <TableCell>
                          KSH {request.specificAmountRequested.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "Approved"
                                ? "default"
                                : request.status === "Denied"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className={`flex items-center gap-1 w-fit ${getStatusColor(request.status)}`}
                          >
                            {getStatusIcon(request.status)}
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(
                            request.dateOfApplication,
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-4">
            {/* Budget Overview */}
            <div className="grid gap-4 md:grid-cols-2">
              {welfareBudgets.map((budget) => {
                const ServiceIcon = getServiceIcon(budget.serviceType);
                const usagePercentage =
                  (budget.usedBudget / budget.allocatedBudget) * 100;

                return (
                  <Card key={budget.serviceType}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ServiceIcon className="h-4 w-4" />
                        {budget.serviceType}
                      </CardTitle>
                      <Badge
                        variant={
                          usagePercentage > 80 ? "destructive" : "secondary"
                        }
                      >
                        {usagePercentage.toFixed(0)}% used
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Budget:</span>
                          <span>
                            KSH {budget.allocatedBudget.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Used:</span>
                          <span>KSH {budget.usedBudget.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Remaining:</span>
                          <span>
                            KSH {budget.remainingBudget.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={usagePercentage} className="mt-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{budget.numberOfRequests} requests</span>
                          <span>
                            {budget.numberApproved} approved,{" "}
                            {budget.numberDenied} denied
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Export detailed welfare reports for analysis and auditing
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Button
                    variant="outline"
                    onClick={() => handleExport("excel")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel Report
                  </Button>
                  <Button variant="outline" onClick={() => handleExport("pdf")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF Report
                  </Button>
                  <Button variant="outline" onClick={() => handleExport("csv")}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

export default Welfare;
