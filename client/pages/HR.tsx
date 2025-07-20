import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
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
import {
  Plus,
  Search,
  Download,
  User,
  FileText,
  Calendar as CalendarIcon,
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Building,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  UserCheck,
  UserX,
  UserMinus,
  Ban,
  PrinterIcon,
  RefreshCw,
  Calculator,
} from "lucide-react";
import { exportService } from "@/services/ExportService";
import { cn } from "@/lib/utils";
import { settingsService } from "@/services/SettingsService";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

// Enhanced Types for HR Management
interface Employee {
  id: number;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: "Male" | "Female";
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed";
  nationalId: string;
  kraPin: string;
  nhifNumber: string;
  nssfNumber: string;
  department: string;
  position: string;
  employmentType: "Full-time" | "Part-time" | "Volunteer";
  employmentStatus: "Active" | "Suspended" | "Terminated" | "On Leave";
  hireDate: string;
  contractEndDate?: string;
  basicSalary: number;
  allowances: {
    housing: number;
    transport: number;
    medical: number;
    other: number;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    branchCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  education: string;
  skills: string[];
  performanceRating: number;
  lastReviewDate: string;
  nextReviewDate: string;
  leaveBalance: {
    annual: number;
    sick: number;
    maternity: number;
    paternity: number;
  };
  disciplinaryRecords: DisciplinaryRecord[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// P9 Form Interface based on KRA 2024 standards
interface P9FormData {
  year: number;
  employerPin: string;
  employerName: string;
  employeePin: string;
  employeeMainName: string;
  employeeOtherNames: string;
  monthlyData: P9MonthlyData[];
  totalChargeablePay: number;
  totalTax: number;
}

interface P9MonthlyData {
  month: string;
  basicSalary: number;
  benefitsNonCash: number;
  valueOfQuarters: number;
  totalGrossPay: number;
  affordableHousingLevy: number; // AHL - 1.5% of gross pay
  socialHealthInsuranceFund: number; // SHIF - 2.75% of gross pay
  postRetirementMedicalFund: number; // PRMF - max 15,000 per month
  definedContributionRetirementScheme: number; // max 30,000 per month
  ownerOccupiedInterest: number; // max 30,000 per month
  totalDeductions: number;
  chargeablePay: number;
  taxCharged: number;
  personalRelief: number; // 2,400 per month
  insuranceRelief: number; // 15% of premium, max 5,000 per month
  payeTax: number;
}

interface P9EmployeeData extends Employee {
  // Additional fields required for P9
  pensionSchemeNumber?: string;
  postRetirementMedicalFundNumber?: string;
  nhifNumber: string;
  housingLevyNumber?: string;
  insurancePremium?: number;
  ownerOccupiedInterestAmount?: number;
  monthlyPensionContribution?: number;
  monthlyPRMFContribution?: number;
}

interface LeaveRequest {
  id: number;
  employeeId: string;
  employeeName: string;
  leaveType:
    | "Annual"
    | "Sick"
    | "Maternity"
    | "Paternity"
    | "Emergency"
    | "Study"
    | "Compassionate";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  appliedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  reviewNotes?: string;
  attachments: string[];
}

interface PayrollRecord {
  id: number;
  employeeId: string;
  employeeName: string;
  period: string;
  basicSalary: number;
  allowances: number;
  overtime?: number;
  grossSalary: number;
  paye: number;
  sha: number;
  nssf: number;
  housingLevy: number;
  loan?: number;
  otherDeductions?: number;
  totalDeductions: number;
  netSalary: number;
  status?: string;
  processedDate: string;
  processedBy?: string;
  isDemoData?: boolean;
}

interface DisbursementReport {
  id: string;
  batchId: string;
  period: string;
  totalEmployees: number;
  totalGrossAmount: number;
  totalDeductions: number;
  totalNetAmount: number;
  approvedBy: string;
  approvedDate: string;
  disbursementDate: string;
  disbursementMethod: string;
  status: "Approved" | "Disbursed" | "Failed";
  employees: {
    employeeId: string;
    employeeName: string;
    netSalary: number;
    accountNumber?: string;
    disbursementStatus: "Pending" | "Success" | "Failed";
  }[];
  notes?: string;
}

interface DisciplinaryRecord {
  id: number;
  type: "Warning" | "Suspension" | "Termination" | "Counseling";
  reason: string;
  date: string;
  actionTaken: string;
  issuedBy: string;
}

interface PerformanceReview {
  id: number;
  employeeId: string;
  reviewPeriod: string;
  goals: string[];
  achievements: string[];
  areasOfImprovement: string[];
  rating: number;
  comments: string;
  reviewDate: string;
  reviewedBy: string;
  nextReviewDate: string;
}

export default function HR() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [processedPayrollTotal, setProcessedPayrollTotal] = useState<number>(0);
  const [disbursementReports, setDisbursementReports] = useState<
    DisbursementReport[]
  >([]);
  const [performanceReviews, setPerformanceReviews] = useState<
    PerformanceReview[]
  >([]);

  // Dialog states
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showLeaveRequestDialog, setShowLeaveRequestDialog] = useState(false);
  const [showPayrollDialog, setShowPayrollDialog] = useState(false);
  const [showProcessPayrollDialog, setShowProcessPayrollDialog] =
    useState(false);
  const [showP9FormDialog, setShowP9FormDialog] = useState(false);
  const [selectedP9Employee, setSelectedP9Employee] = useState<Employee | null>(
    null,
  );
  const [p9Year, setP9Year] = useState(new Date().getFullYear());
  const [payrollProcessing, setPayrollProcessing] = useState(false);
  const [showEmployeeDetailDialog, setShowEmployeeDetailDialog] =
    useState(false);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [showDisbursementReportsDialog, setShowDisbursementReportsDialog] =
    useState(false);
  const [selectedDisbursementReport, setSelectedDisbursementReport] =
    useState<DisbursementReport | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    nationalId: "",
    kraPin: "",
    nhifNumber: "",
    nssfNumber: "",
    department: "",
    position: "",
    employmentType: "",
    hireDate: "",
    basicSalary: "",
    housingAllowance: "",
    transportAllowance: "",
    medicalAllowance: "",
    otherAllowance: "",
    bankName: "",
    accountNumber: "",
    branchCode: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    education: "",
    skills: "",
    documents: [] as File[],
  });

  const [leaveForm, setLeaveForm] = useState({
    employeeId: "",
    leaveType: "",
    startDate: new Date(),
    endDate: new Date(),
    reason: "",
    attachments: [] as File[],
  });

  const [statusChangeForm, setStatusChangeForm] = useState({
    newStatus: "",
    reason: "",
    effectiveDate: "",
    notes: "",
  });

  useEffect(() => {
    loadHRData();
  }, []);

  const loadHRData = () => {
    // Mock data - replace with actual API calls
    const mockEmployees: Employee[] = [
      {
        id: 1,
        employeeId: "TSOAM-EMP-001",
        fullName: "John Kamau",
        email: "john.kamau@tsoam.org",
        phone: "+254712345678",
        address: "123 Nairobi Street, Nairobi",
        dateOfBirth: "1985-03-15",
        gender: "Male",
        maritalStatus: "Married",
        nationalId: "12345678",
        kraPin: "A123456789X",
        nhifNumber: "NH123456",
        nssfNumber: "NS123456",
        department: "Administration",
        position: "Administrator",
        employmentType: "Full-time",
        employmentStatus: "Active",
        hireDate: "2020-01-15",
        basicSalary: 80000,
        allowances: {
          housing: 20000,
          transport: 10000,
          medical: 5000,
          other: 5000,
        },
        bankDetails: {
          bankName: "KCB Bank",
          accountNumber: "1234567890",
          branchCode: "001",
        },
        emergencyContact: {
          name: "Mary Kamau",
          relationship: "Wife",
          phone: "+254723456789",
        },
        education: "Bachelor's Degree in Business Administration",
        skills: ["Leadership", "Administration", "Communication"],
        performanceRating: 4.5,
        lastReviewDate: "2024-06-15",
        nextReviewDate: "2025-06-15",
        leaveBalance: {
          annual: 21,
          sick: 30,
          maternity: 90,
          paternity: 14,
        },
        disciplinaryRecords: [],
        isActive: true,
        createdAt: "2020-01-15T10:00:00Z",
        updatedAt: "2024-12-01T10:00:00Z",
      },
      {
        id: 2,
        employeeId: "TSOAM-EMP-002",
        fullName: "Grace Wanjiku",
        email: "grace.wanjiku@tsoam.org",
        phone: "+254798765432",
        address: "456 Mombasa Road, Nairobi",
        dateOfBirth: "1990-08-22",
        gender: "Female",
        maritalStatus: "Single",
        nationalId: "87654321",
        kraPin: "B987654321Y",
        nhifNumber: "NH654321",
        nssfNumber: "NS654321",
        department: "Finance",
        position: "Accountant",
        employmentType: "Full-time",
        employmentStatus: "Active",
        hireDate: "2021-03-01",
        basicSalary: 75000,
        allowances: {
          housing: 18000,
          transport: 8000,
          medical: 5000,
          other: 2000,
        },
        bankDetails: {
          bankName: "Equity Bank",
          accountNumber: "0987654321",
          branchCode: "002",
        },
        emergencyContact: {
          name: "Peter Wanjiku",
          relationship: "Brother",
          phone: "+254734567890",
        },
        education: "Bachelor's Degree in Accounting",
        skills: ["Accounting", "Financial Analysis", "Excel"],
        performanceRating: 4.2,
        lastReviewDate: "2024-08-01",
        nextReviewDate: "2025-08-01",
        leaveBalance: {
          annual: 18,
          sick: 25,
          maternity: 90,
          paternity: 0,
        },
        disciplinaryRecords: [],
        isActive: true,
        createdAt: "2021-03-01T10:00:00Z",
        updatedAt: "2024-12-01T10:00:00Z",
      },
      {
        id: 3,
        employeeId: "TSOAM-VOL-001",
        fullName: "David Mwangi",
        email: "david.mwangi@tsoam.org",
        phone: "+254745678901",
        address: "789 Kiambu Road, Kiambu",
        dateOfBirth: "1988-11-10",
        gender: "Male",
        maritalStatus: "Married",
        nationalId: "11223344",
        kraPin: "C112233445Z",
        nhifNumber: "NH112233",
        nssfNumber: "NS112233",
        department: "Youth Ministry",
        position: "Youth Coordinator",
        employmentType: "Volunteer",
        employmentStatus: "Active",
        hireDate: "2022-01-01",
        basicSalary: 0,
        allowances: {
          housing: 0,
          transport: 5000,
          medical: 0,
          other: 2000,
        },
        bankDetails: {
          bankName: "Co-operative Bank",
          accountNumber: "1122334455",
          branchCode: "003",
        },
        emergencyContact: {
          name: "Ruth Mwangi",
          relationship: "Wife",
          phone: "+254756789012",
        },
        education: "Diploma in Theology",
        skills: ["Youth Ministry", "Counseling", "Public Speaking"],
        performanceRating: 4.0,
        lastReviewDate: "2024-09-01",
        nextReviewDate: "2025-09-01",
        leaveBalance: {
          annual: 0,
          sick: 7,
          maternity: 0,
          paternity: 7,
        },
        disciplinaryRecords: [],
        isActive: true,
        createdAt: "2022-01-01T10:00:00Z",
        updatedAt: "2024-12-01T10:00:00Z",
      },
    ];

    const mockLeaveRequests: LeaveRequest[] = [
      {
        id: 1,
        employeeId: "TSOAM-EMP-001",
        employeeName: "John Kamau",
        leaveType: "Annual",
        startDate: "2025-02-01",
        endDate: "2025-02-07",
        days: 7,
        reason: "Family vacation",
        status: "Pending",
        appliedDate: "2025-01-15",
        attachments: [],
      },
      {
        id: 2,
        employeeId: "TSOAM-EMP-002",
        employeeName: "Grace Wanjiku",
        leaveType: "Sick",
        startDate: "2025-01-10",
        endDate: "2025-01-12",
        days: 3,
        reason: "Medical treatment",
        status: "Approved",
        appliedDate: "2025-01-09",
        reviewedBy: "HR Manager",
        reviewedDate: "2025-01-09",
        reviewNotes: "Medical certificate provided",
        attachments: ["medical_certificate.pdf"],
      },
    ];

    setEmployees(mockEmployees);
    setLeaveRequests(mockLeaveRequests);
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" || employee.department === departmentFilter;
    const matchesStatus =
      statusFilter === "all" || employee.employmentStatus === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Active: { variant: "default" as const, icon: CheckCircle },
      Suspended: { variant: "destructive" as const, icon: UserMinus },
      Terminated: { variant: "destructive" as const, icon: UserX },
      "On Leave": { variant: "secondary" as const, icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || CheckCircle;

    return (
      <Badge
        variant={config?.variant || "secondary"}
        className="flex items-center gap-1"
      >
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getEmploymentTypeBadge = (type: string) => {
    const typeColors = {
      "Full-time": "bg-green-500 text-white",
      "Part-time": "bg-blue-500 text-white",
      Volunteer: "bg-purple-500 text-white",
    };

    return (
      <Badge
        className={
          typeColors[type as keyof typeof typeColors] ||
          "bg-gray-500 text-white"
        }
      >
        {type}
      </Badge>
    );
  };

  const handleAddEmployee = async () => {
    if (
      !employeeForm.fullName ||
      !employeeForm.email ||
      !employeeForm.department
    ) {
      alert("Please fill in required fields");
      return;
    }

    const employeeCount = employees.length + 1;
    const employeeId =
      employeeForm.employmentType === "Volunteer"
        ? `TSOAM-VOL-${employeeCount.toString().padStart(3, "0")}`
        : `TSOAM-EMP-${employeeCount.toString().padStart(3, "0")}`;

    const newEmployee: Employee = {
      id: employeeCount,
      employeeId,
      fullName: employeeForm.fullName,
      email: employeeForm.email,
      phone: employeeForm.phone,
      address: employeeForm.address,
      dateOfBirth: employeeForm.dateOfBirth,
      gender: employeeForm.gender as "Male" | "Female",
      maritalStatus: employeeForm.maritalStatus as any,
      nationalId: employeeForm.nationalId,
      kraPin: employeeForm.kraPin,
      nhifNumber: employeeForm.nhifNumber,
      nssfNumber: employeeForm.nssfNumber,
      department: employeeForm.department,
      position: employeeForm.position,
      employmentType: employeeForm.employmentType as any,
      employmentStatus: "Active",
      hireDate: employeeForm.hireDate,
      basicSalary: parseFloat(employeeForm.basicSalary) || 0,
      allowances: {
        housing: parseFloat(employeeForm.housingAllowance) || 0,
        transport: parseFloat(employeeForm.transportAllowance) || 0,
        medical: parseFloat(employeeForm.medicalAllowance) || 0,
        other: parseFloat(employeeForm.otherAllowance) || 0,
      },
      bankDetails: {
        bankName: employeeForm.bankName,
        accountNumber: employeeForm.accountNumber,
        branchCode: employeeForm.branchCode,
      },
      emergencyContact: {
        name: employeeForm.emergencyContactName,
        relationship: employeeForm.emergencyContactRelationship,
        phone: employeeForm.emergencyContactPhone,
      },
      education: employeeForm.education,
      skills: employeeForm.skills.split(",").map((s) => s.trim()),
      performanceRating: 0,
      lastReviewDate: "",
      nextReviewDate: "",
      leaveBalance: {
        annual:
          employeeForm.employmentType === "Full-time"
            ? 21
            : employeeForm.employmentType === "Part-time"
              ? 14
              : 0,
        sick: employeeForm.employmentType === "Volunteer" ? 7 : 30,
        maternity: 90,
        paternity: 14,
      },
      disciplinaryRecords: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEmployees([...employees, newEmployee]);

    // Upload documents if any
    if (employeeForm.documents && employeeForm.documents.length > 0) {
      try {
        const formData = new FormData();
        employeeForm.documents.forEach((file, index) => {
          formData.append("documents", file);
          formData.append(
            "document_types",
            index === 0
              ? "CV"
              : index === 1
                ? "ID"
                : index === 2
                  ? "Certificate"
                  : "Other",
          );
        });

        const response = await fetch(
          `/api/hr/employees/${newEmployee.id}/documents`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          console.error("Failed to upload documents");
        }
      } catch (error) {
        console.error("Document upload error:", error);
      }
    }

    // Reset form
    setEmployeeForm({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      gender: "",
      maritalStatus: "",
      nationalId: "",
      kraPin: "",
      nhifNumber: "",
      nssfNumber: "",
      department: "",
      position: "",
      employmentType: "",
      hireDate: "",
      basicSalary: "",
      housingAllowance: "",
      transportAllowance: "",
      medicalAllowance: "",
      otherAllowance: "",
      bankName: "",
      accountNumber: "",
      branchCode: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      education: "",
      skills: "",
      documents: [] as File[],
    });

    setShowAddEmployeeDialog(false);
    alert(
      `Employee ${newEmployee.fullName} added successfully with ID: ${employeeId}${employeeForm.documents.length > 0 ? ` and ${employeeForm.documents.length} document(s) uploaded` : ""}`,
    );
  };

  const handleLeaveRequest = () => {
    if (!leaveForm.employeeId || !leaveForm.leaveType || !leaveForm.reason) {
      alert("Please fill in required fields");
      return;
    }

    const employee = employees.find(
      (e) => e.employeeId === leaveForm.employeeId,
    );
    if (!employee) {
      alert("Employee not found");
      return;
    }

    const startDate = new Date(leaveForm.startDate);
    const endDate = new Date(leaveForm.endDate);
    const days =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    const newLeaveRequest: LeaveRequest = {
      id: leaveRequests.length + 1,
      employeeId: leaveForm.employeeId,
      employeeName: employee.fullName,
      leaveType: leaveForm.leaveType as any,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      days,
      reason: leaveForm.reason,
      status: "Pending",
      appliedDate: new Date().toISOString().split("T")[0],
      attachments: leaveForm.attachments.map((f) => f.name),
    };

    setLeaveRequests([...leaveRequests, newLeaveRequest]);

    // Reset form
    setLeaveForm({
      employeeId: "",
      leaveType: "",
      startDate: new Date(),
      endDate: new Date(),
      reason: "",
      attachments: [],
    });

    setShowLeaveRequestDialog(false);
    alert("Leave request submitted successfully!");
  };

  const handleStatusChange = () => {
    if (
      !selectedEmployee ||
      !statusChangeForm.newStatus ||
      !statusChangeForm.reason
    ) {
      alert("Please fill in required fields");
      return;
    }

    const updatedEmployees = employees.map((emp) =>
      emp.id === selectedEmployee.id
        ? {
            ...emp,
            employmentStatus: statusChangeForm.newStatus as any,
            updatedAt: new Date().toISOString(),
          }
        : emp,
    );

    setEmployees(updatedEmployees);

    // Add disciplinary record if suspended or terminated
    if (
      statusChangeForm.newStatus === "Suspended" ||
      statusChangeForm.newStatus === "Terminated"
    ) {
      const disciplinaryRecord: DisciplinaryRecord = {
        id: Date.now(),
        type:
          statusChangeForm.newStatus === "Suspended"
            ? "Suspension"
            : "Termination",
        reason: statusChangeForm.reason,
        date:
          statusChangeForm.effectiveDate ||
          new Date().toISOString().split("T")[0],
        actionTaken:
          statusChangeForm.notes ||
          `Employee ${statusChangeForm.newStatus.toLowerCase()}`,
        issuedBy: "HR Manager", // In real app, this would be current user
      };

      const updatedEmployee = updatedEmployees.find(
        (e) => e.id === selectedEmployee.id,
      );
      if (updatedEmployee) {
        updatedEmployee.disciplinaryRecords.push(disciplinaryRecord);
      }
    }

    // Reset form and close dialog
    setStatusChangeForm({
      newStatus: "",
      reason: "",
      effectiveDate: "",
      notes: "",
    });
    setShowStatusChangeDialog(false);
    setSelectedEmployee(null);

    alert(
      `Employee status changed to ${statusChangeForm.newStatus} successfully!`,
    );
  };

  // Process payroll for all employees
  const handleProcessPayroll = async () => {
    setPayrollProcessing(true);

    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const activeEmployees = employees.filter(
        (emp) => emp.employmentStatus === "Active",
      );

      if (activeEmployees.length === 0) {
        alert("No active employees found to process payroll.");
        return;
      }

      // Since the API is not available (404 error), process in demo mode
      console.log("Processing payroll in demo mode - API not available");

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate demo payroll records
      const demoPayrollRecords = activeEmployees.map((employee, index) => {
        const basicSalary = employee.basicSalary || 50000; // Default if not set
        const allowances = Object.values(employee.allowances || {}).reduce(
          (a, b) => a + b,
          0,
        );
        const grossSalary = basicSalary + allowances;

        // Kenya tax calculations
        const paye = calculatePayrollPAYE(grossSalary);
        const nssf = Math.min(grossSalary * 0.06, 2160); // 6% capped at KSH 2,160
        const sha = grossSalary * 0.0275; // 2.75% SHA
        const housingLevy = grossSalary * 0.015; // 1.5% Housing Levy

        const totalDeductions = paye + nssf + sha + housingLevy;
        const netSalary = grossSalary - totalDeductions;

        return {
          id: index + 1,
          employeeId: String(employee.id),
          employeeName: employee.fullName,
          period: currentMonth,
          basicSalary: basicSalary,
          allowances: allowances,
          grossSalary: grossSalary,
          paye: Math.round(paye),
          nssf: Math.round(nssf),
          sha: Math.round(sha),
          housingLevy: Math.round(housingLevy),
          totalDeductions: Math.round(totalDeductions),
          netSalary: Math.round(netSalary),
          status: "Processed",
          processedDate: new Date().toISOString(),
          isDemoData: true,
        };
      });

      // Update payroll records in state
      setPayrollRecords(demoPayrollRecords);

      // Update dashboard total with processed payroll
      const totalProcessedPayroll = demoPayrollRecords.reduce(
        (sum, record) => sum + record.netSalary,
        0,
      );
      setProcessedPayrollTotal(totalProcessedPayroll);

      // Save HR data to localStorage for Dashboard integration
      const hrModuleData = {
        employees: employees,
        payrollRecords: demoPayrollRecords,
        lastUpdated: new Date().toISOString(),
        totalPayroll: totalProcessedPayroll,
        activeEmployees: activeEmployees.length,
      };
      localStorage.setItem("hr_module_data", JSON.stringify(hrModuleData));

      // Sync payroll transactions to Finance module
      try {
        const { financialTransactionService } = await import(
          "@/services/FinancialTransactionService"
        );
        financialTransactionService.addBatchPayroll(demoPayrollRecords);
        console.log("✅ Payroll transactions synced to Finance module");
      } catch (error) {
        console.warn("⚠️ Could not sync payroll to Finance:", error);
      }

      // Show success message
      alert(
        `✅ Demo Mode: Payroll processed successfully!\n\n` +
          `📊 Processed: ${activeEmployees.length} employees\n` +
          `📅 Period: ${currentMonth}\n` +
          `💰 Total Payroll: KSh ${demoPayrollRecords.reduce((sum, record) => sum + record.netSalary, 0).toLocaleString()}\n\n` +
          `ℹ️ This is demonstration data. In production, this would connect to your payroll system.`,
      );

      setShowProcessPayrollDialog(false);

      // Log demo processing for debugging
      console.log("Demo payroll processing completed:", {
        employeeCount: activeEmployees.length,
        period: currentMonth,
        totalGross: demoPayrollRecords.reduce(
          (sum, record) => sum + record.grossSalary,
          0,
        ),
        totalNet: demoPayrollRecords.reduce(
          (sum, record) => sum + record.netSalary,
          0,
        ),
        records: demoPayrollRecords,
      });

      // Optional: Try to log the activity (non-blocking)
      try {
        await fetch("/api/system-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Payroll Processing",
            module: "HR",
            details: `Demo payroll processed for ${activeEmployees.length} employees (${currentMonth})`,
            severity: "Info",
          }),
        });
      } catch (logError) {
        console.log("Could not log activity:", logError.message);
        // Non-blocking - continue without logging
      }
    } catch (error) {
      console.error("Payroll processing error:", error);

      let errorMessage = "Failed to process payroll. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setPayrollProcessing(false);
    }
  };

  // Function to handle disbursement report from Finance
  const handleDisbursementReport = (disbursementData: any) => {
    console.log(
      "📊 Received disbursement report from Finance:",
      disbursementData,
    );

    const newDisbursementReport: DisbursementReport = {
      id: disbursementData.reportId || `DISB-${Date.now()}`,
      batchId: disbursementData.batchId,
      period: disbursementData.period,
      totalEmployees: disbursementData.totalEmployees,
      totalGrossAmount: disbursementData.totalGrossAmount,
      totalDeductions: disbursementData.totalDeductions,
      totalNetAmount: disbursementData.totalNetAmount,
      approvedBy: disbursementData.approvedBy,
      approvedDate: disbursementData.approvedDate,
      disbursementDate: disbursementData.disbursementDate,
      disbursementMethod:
        disbursementData.disbursementMethod || "Bank Transfer",
      status: "Approved",
      employees: disbursementData.employees || [],
      notes: disbursementData.notes,
    };

    setDisbursementReports((prev) => [newDisbursementReport, ...prev]);

    // Update HR module data for dashboard sync
    const hrModuleData = {
      totalEmployees: employees.length,
      recentPayroll: disbursementData.totalNetAmount,
      disbursementReports: disbursementReports.length + 1,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem("hr_module_data", JSON.stringify(hrModuleData));

    // Show notification
    setTimeout(() => {
      alert(
        `💰 Payroll Disbursement Approved!\n\n` +
          `👥 Employees: ${disbursementData.totalEmployees}\n` +
          `💵 Total Amount: KSh ${disbursementData.totalNetAmount?.toLocaleString()}\n` +
          `✅ Approved by: ${disbursementData.approvedBy}\n` +
          `📅 Disbursement Date: ${new Date(disbursementData.disbursementDate).toLocaleDateString()}`,
      );
    }, 500);
  };

  // Listen for disbursement reports and rejections from Finance module
  useEffect(() => {
    const handleFinanceEvents = (event: StorageEvent) => {
      // Handle disbursement reports
      if (event.key === "hr_disbursement_event" && event.newValue) {
        try {
          const disbursementData = JSON.parse(event.newValue);
          handleDisbursementReport(disbursementData);

          // Clear the event after processing
          localStorage.removeItem("hr_disbursement_event");
        } catch (error) {
          console.error("Error processing disbursement event:", error);
        }
      }

      // Handle rejection notifications
      if (event.key === "hr_rejection_event" && event.newValue) {
        try {
          const rejectionData = JSON.parse(event.newValue);
          console.log(
            "❌ Received payroll rejection from Finance:",
            rejectionData,
          );

          // Show rejection notification
          setTimeout(() => {
            alert(
              `❌ Payroll Rejected by Finance!\n\n` +
                `📅 Period: ${rejectionData.period}\n` +
                `💰 Amount: KSh ${rejectionData.amount?.toLocaleString()}\n` +
                `👤 Rejected by: ${rejectionData.rejectedBy}\n` +
                `📝 Reason: ${rejectionData.rejectionReason}\n` +
                `📅 Date: ${new Date(rejectionData.rejectedDate).toLocaleDateString()}\n\n` +
                `⚠️ Please review and resubmit the payroll if necessary.`,
            );
          }, 500);

          // Clear the event after processing
          localStorage.removeItem("hr_rejection_event");
        } catch (error) {
          console.error("Error processing rejection event:", error);
        }
      }
    };

    // Listen for localStorage changes
    window.addEventListener("storage", handleFinanceEvents);

    // Check for pending events when component mounts
    const checkForPendingEvents = () => {
      // Check for pending disbursement reports
      const pendingDisbursement = localStorage.getItem("hr_disbursement_event");
      if (pendingDisbursement) {
        try {
          const disbursementData = JSON.parse(pendingDisbursement);
          handleDisbursementReport(disbursementData);
          localStorage.removeItem("hr_disbursement_event");
        } catch (error) {
          console.error("Error processing pending disbursement:", error);
        }
      }

      // Check for pending rejections
      const pendingRejection = localStorage.getItem("hr_rejection_event");
      if (pendingRejection) {
        try {
          const rejectionData = JSON.parse(pendingRejection);
          console.log("❌ Processing pending rejection:", rejectionData);

          setTimeout(() => {
            alert(
              `❌ Payroll Rejected by Finance!\n\n` +
                `��� Period: ${rejectionData.period}\n` +
                `💰 Amount: KSh ${rejectionData.amount?.toLocaleString()}\n` +
                `👤 Rejected by: ${rejectionData.rejectedBy}\n` +
                `📝 Reason: ${rejectionData.rejectionReason}\n` +
                `📅 Date: ${new Date(rejectionData.rejectedDate).toLocaleDateString()}\n\n` +
                `⚠️ Please review and resubmit the payroll if necessary.`,
            );
          }, 500);

          localStorage.removeItem("hr_rejection_event");
        } catch (error) {
          console.error("Error processing pending rejection:", error);
        }
      }
    };

    checkForPendingEvents();
    const interval = setInterval(checkForPendingEvents, 2000);

    return () => {
      window.removeEventListener("storage", handleFinanceEvents);
      clearInterval(interval);
    };
  }, [employees, disbursementReports]);

  // P9 Form Calculation Functions based on KRA 2024 standards
  const calculateP9Data = (employee: Employee, year: number): P9FormData => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthlyData: P9MonthlyData[] = months.map((month) => {
      const basicSalary = employee.basicSalary;
      const housingAllowance = employee.allowances?.housing || 0;
      const transportAllowance = employee.allowances?.transport || 0;
      const medicalAllowance = employee.allowances?.medical || 0;
      const otherAllowances = employee.allowances?.other || 0;

      // Calculate benefits (allowances)
      const benefitsNonCash =
        housingAllowance +
        transportAllowance +
        medicalAllowance +
        otherAllowances;

      // Value of quarters (30% of basic salary or actual, whichever is lower)
      const valueOfQuarters = Math.min(housingAllowance, basicSalary * 0.3);

      // Total gross pay
      const totalGrossPay = basicSalary + benefitsNonCash;

      // Statutory deductions (effective December 2024)
      const affordableHousingLevy = totalGrossPay * 0.015; // 1.5%
      const socialHealthInsuranceFund = totalGrossPay * 0.0275; // 2.75%

      // Optional deductions with limits
      const pensionContribution = Math.min(
        (employee as any).monthlyPensionContribution || 0,
        30000,
      );
      const prmfContribution = Math.min(
        (employee as any).monthlyPRMFContribution || 0,
        15000,
      );
      const ownerOccupiedInterest = Math.min(
        (employee as any).ownerOccupiedInterestAmount || 0,
        30000,
      );

      // Total deductions
      const totalDeductions =
        affordableHousingLevy +
        socialHealthInsuranceFund +
        pensionContribution +
        prmfContribution +
        ownerOccupiedInterest;

      // Chargeable pay
      const chargeablePay = totalGrossPay - totalDeductions;

      // Calculate tax using KRA 2024 tax bands
      const taxCharged = calculatePAYE(chargeablePay);

      // Reliefs
      const personalRelief = 2400; // KSh 2,400 per month
      const insurancePremium = (employee as any).insurancePremium || 0;
      const insuranceRelief = Math.min(insurancePremium * 0.15, 5000); // 15% up to KSh 5,000

      // Final PAYE tax
      const payeTax = Math.max(
        taxCharged - personalRelief - insuranceRelief,
        0,
      );

      return {
        month,
        basicSalary,
        benefitsNonCash,
        valueOfQuarters,
        totalGrossPay,
        affordableHousingLevy,
        socialHealthInsuranceFund,
        postRetirementMedicalFund: prmfContribution,
        definedContributionRetirementScheme: pensionContribution,
        ownerOccupiedInterest,
        totalDeductions,
        chargeablePay,
        taxCharged,
        personalRelief,
        insuranceRelief,
        payeTax,
      };
    });

    const totalChargeablePay = monthlyData.reduce(
      (sum, data) => sum + data.chargeablePay,
      0,
    );
    const totalTax = monthlyData.reduce((sum, data) => sum + data.payeTax, 0);

    // Split employee name
    const nameParts = employee.fullName.split(" ");
    const employeeMainName = nameParts[0] || "";
    const employeeOtherNames = nameParts.slice(1).join(" ") || "";

    // Get church settings from localStorage or use default
    const savedChurchSettings = localStorage.getItem("churchSettings");
    const churchSettings = savedChurchSettings
      ? JSON.parse(savedChurchSettings)
      : { kraPin: "P123456789X", name: "THE SEED OF ABRAHAM MINISTRY" };

    return {
      year,
      employerPin: churchSettings.kraPin,
      employerName: churchSettings.name,
      employeePin: employee.kraPin,
      employeeMainName,
      employeeOtherNames,
      monthlyData,
      totalChargeablePay,
      totalTax,
    };
  };

  // Calculate PAYE using KRA 2024 tax bands
  const calculatePAYE = (chargeablePay: number): number => {
    if (chargeablePay <= 24000) return 0;

    let tax = 0;

    // Tax bands for 2024
    if (chargeablePay > 24000 && chargeablePay <= 32333) {
      tax = (chargeablePay - 24000) * 0.1;
    } else if (chargeablePay > 32333 && chargeablePay <= 500000) {
      tax = (32333 - 24000) * 0.1 + (chargeablePay - 32333) * 0.25;
    } else if (chargeablePay > 500000 && chargeablePay <= 800000) {
      tax =
        (32333 - 24000) * 0.1 +
        (500000 - 32333) * 0.25 +
        (chargeablePay - 500000) * 0.3;
    } else if (chargeablePay > 800000) {
      tax =
        (32333 - 24000) * 0.1 +
        (500000 - 32333) * 0.25 +
        (800000 - 500000) * 0.3 +
        (chargeablePay - 800000) * 0.35;
    }

    return Math.round(tax);
  };

  // Generate P9 PDF
  const generateP9PDF = async (employee: Employee, year: number) => {
    const p9Data = calculateP9Data(employee, year);
    const doc = new jsPDF("landscape", "mm", "a4"); // A4 landscape: 297mm x 210mm

    // Get dynamic church settings
    const churchSettings = settingsService.getChurchSettings();

    // Header - Centered and compact
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(churchSettings.name.toUpperCase(), 148, 12, { align: "center" });
    doc.setFontSize(12);
    doc.text("KENYA REVENUE AUTHORITY", 148, 20, { align: "center" });
    doc.text("TAX DEDUCTION CARD (P9A)", 148, 28, { align: "center" });
    doc.text(`YEAR ${year}`, 148, 36, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("ISO 9001:2015 CERTIFIED", 148, 42, { align: "center" });

    // Church details - smaller font
    doc.setFontSize(6);
    doc.text(
      `${churchSettings.address} | ${churchSettings.phone} | ${churchSettings.email}`,
      148,
      47,
      { align: "center" },
    );

    // Employer and Employee Details - more compact layout
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Employer's PIN: ${churchSettings.kraPin}`, 15, 55);
    doc.text(`Employer's Name: ${churchSettings.name.toUpperCase()}`, 15, 60);
    doc.text(`Employee's PIN: ${p9Data.employeePin}`, 200, 55);
    doc.text(`Employee's Main Name: ${p9Data.employeeMainName}`, 15, 65);
    doc.text(`Employee's Other Names: ${p9Data.employeeOtherNames}`, 15, 70);

    // Table headers
    const tableHeaders = [
      "MONTH",
      "Basic Salary",
      "Benefits Non-Cash",
      "Value of Quarters",
      "Total Gross Pay",
      "Affordable Housing Levy (AHL)",
      "Social Health Insurance Fund (SHIF)",
      "Post Retirement Medical Fund (PRMF)",
      "Defined Contribution Retirement Scheme",
      "Owner Occupied Interest",
      "Total Deductions",
      "Chargeable Pay",
      "Tax Charged",
      "Personal Relief",
      "Insurance Relief",
      "PAYE Tax",
    ];

    // Table data
    const tableData = p9Data.monthlyData.map((data) => [
      data.month,
      data.basicSalary.toLocaleString(),
      data.benefitsNonCash.toLocaleString(),
      data.valueOfQuarters.toLocaleString(),
      data.totalGrossPay.toLocaleString(),
      data.affordableHousingLevy.toLocaleString(),
      data.socialHealthInsuranceFund.toLocaleString(),
      data.postRetirementMedicalFund.toLocaleString(),
      data.definedContributionRetirementScheme.toLocaleString(),
      data.ownerOccupiedInterest.toLocaleString(),
      data.totalDeductions.toLocaleString(),
      data.chargeablePay.toLocaleString(),
      data.taxCharged.toLocaleString(),
      data.personalRelief.toLocaleString(),
      data.insuranceRelief.toLocaleString(),
      data.payeTax.toLocaleString(),
    ]);

    // Add totals row
    const totals = p9Data.monthlyData.reduce(
      (acc, data) => ({
        basicSalary: acc.basicSalary + data.basicSalary,
        benefitsNonCash: acc.benefitsNonCash + data.benefitsNonCash,
        valueOfQuarters: acc.valueOfQuarters + data.valueOfQuarters,
        totalGrossPay: acc.totalGrossPay + data.totalGrossPay,
        affordableHousingLevy:
          acc.affordableHousingLevy + data.affordableHousingLevy,
        socialHealthInsuranceFund:
          acc.socialHealthInsuranceFund + data.socialHealthInsuranceFund,
        postRetirementMedicalFund:
          acc.postRetirementMedicalFund + data.postRetirementMedicalFund,
        definedContributionRetirementScheme:
          acc.definedContributionRetirementScheme +
          data.definedContributionRetirementScheme,
        ownerOccupiedInterest:
          acc.ownerOccupiedInterest + data.ownerOccupiedInterest,
        totalDeductions: acc.totalDeductions + data.totalDeductions,
        chargeablePay: acc.chargeablePay + data.chargeablePay,
        taxCharged: acc.taxCharged + data.taxCharged,
        personalRelief: acc.personalRelief + data.personalRelief,
        insuranceRelief: acc.insuranceRelief + data.insuranceRelief,
        payeTax: acc.payeTax + data.payeTax,
      }),
      {
        basicSalary: 0,
        benefitsNonCash: 0,
        valueOfQuarters: 0,
        totalGrossPay: 0,
        affordableHousingLevy: 0,
        socialHealthInsuranceFund: 0,
        postRetirementMedicalFund: 0,
        definedContributionRetirementScheme: 0,
        ownerOccupiedInterest: 0,
        totalDeductions: 0,
        chargeablePay: 0,
        taxCharged: 0,
        personalRelief: 0,
        insuranceRelief: 0,
        payeTax: 0,
      },
    );

    tableData.push([
      "TOTAL",
      totals.basicSalary.toLocaleString(),
      totals.benefitsNonCash.toLocaleString(),
      totals.valueOfQuarters.toLocaleString(),
      totals.totalGrossPay.toLocaleString(),
      totals.affordableHousingLevy.toLocaleString(),
      totals.socialHealthInsuranceFund.toLocaleString(),
      totals.postRetirementMedicalFund.toLocaleString(),
      totals.definedContributionRetirementScheme.toLocaleString(),
      totals.ownerOccupiedInterest.toLocaleString(),
      totals.totalDeductions.toLocaleString(),
      totals.chargeablePay.toLocaleString(),
      totals.taxCharged.toLocaleString(),
      totals.personalRelief.toLocaleString(),
      totals.insuranceRelief.toLocaleString(),
      totals.payeTax.toLocaleString(),
    ]);

    // Use autoTable for better formatting and auto-fit
    let finalY = 160; // Default fallback position

    try {
      // Generate table with autoTable for proper fitting
      const autoTable = await import("jspdf-autotable");

      (doc as any).autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 75,
        theme: "grid",
        styles: {
          fontSize: 5,
          cellPadding: 1,
          overflow: "linebreak",
          halign: "center",
          valign: "middle",
        },
        headStyles: {
          fillColor: [128, 128, 128],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 5,
          cellPadding: 1,
        },
        columnStyles: {
          0: { cellWidth: 15 }, // Month
          1: { cellWidth: 16 }, // Basic Salary
          2: { cellWidth: 16 }, // Benefits Non-Cash
          3: { cellWidth: 16 }, // Value of Quarters
          4: { cellWidth: 16 }, // Total Gross Pay
          5: { cellWidth: 18 }, // Affordable Housing Levy
          6: { cellWidth: 18 }, // Social Health Insurance Fund
          7: { cellWidth: 18 }, // Post Retirement Medical Fund
          8: { cellWidth: 20 }, // Defined Contribution Retirement Scheme
          9: { cellWidth: 16 }, // Owner Occupied Interest
          10: { cellWidth: 16 }, // Total Deductions
          11: { cellWidth: 16 }, // Chargeable Pay
          12: { cellWidth: 14 }, // Tax Charged
          13: { cellWidth: 14 }, // Personal Relief
          14: { cellWidth: 14 }, // Insurance Relief
          15: { cellWidth: 14 }, // PAYE Tax
        },
        margin: { left: 10, right: 10 },
        tableWidth: "auto",
        showHead: "everyPage",
        didDrawPage: function (data) {
          // Ensure table fits on page
          if (data.cursor.y > 180) {
            doc.addPage();
          }
        },
      });

      // Get the final Y position after the table
      finalY = (doc as any).lastAutoTable.finalY + 10;

      // Summary section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(
        `TOTAL CHARGEABLE PAY: KSh ${p9Data.totalChargeablePay.toLocaleString()}`,
        15,
        finalY,
      );
      doc.text(
        `TOTAL TAX: KSh ${p9Data.totalTax.toLocaleString()}`,
        150,
        finalY,
      );
    } catch (autoTableError) {
      console.warn("AutoTable failed, using manual table:", autoTableError);

      // Fallback to manual table with smaller text
      let currentY = 75;
      const cellHeight = 8;
      const tableWidth = 276;
      const startX = 10;

      // Define optimized column widths for landscape A4
      const columnWidths = [
        15, 16, 16, 16, 16, 18, 18, 18, 20, 16, 16, 16, 14, 14, 14, 14,
      ];

      // Draw table headers
      doc.setFillColor(200, 200, 200);
      doc.setFontSize(4);
      doc.setFont("helvetica", "bold");

      // Header row
      doc.rect(startX, currentY, tableWidth, cellHeight + 2, "F");
      let currentX = startX + 0.5;

      tableHeaders.forEach((header, index) => {
        const colWidth = columnWidths[index] || 16;
        // Split long headers
        const headerLines = doc.splitTextToSize(header, colWidth - 1);
        const lineHeight = 2.5;
        const startLineY = currentY + 2;

        headerLines.forEach((line: string, lineIndex: number) => {
          doc.text(line, currentX + 0.5, startLineY + lineIndex * lineHeight);
        });

        // Draw column separator
        doc.setDrawColor(128, 128, 128);
        doc.line(
          currentX + colWidth,
          currentY,
          currentX + colWidth,
          currentY + cellHeight + 2,
        );
        currentX += colWidth;
      });
      currentY += cellHeight + 2;

      // Data rows
      doc.setFontSize(4);
      doc.setFont("helvetica", "normal");

      tableData.forEach((row, rowIndex) => {
        if (rowIndex === tableData.length - 1) {
          // Total row
          doc.setFont("helvetica", "bold");
          doc.setFillColor(240, 240, 240);
          doc.rect(startX, currentY, tableWidth, cellHeight, "F");
        } else if (rowIndex % 2 === 1) {
          // Alternate row color
          doc.setFillColor(248, 248, 248);
          doc.rect(startX, currentY, tableWidth, cellHeight, "F");
        }

        currentX = startX + 0.5;
        row.forEach((cell, colIndex) => {
          const colWidth = columnWidths[colIndex] || 16;
          const cellText = cell.toString();

          // Fit text within column
          const fittedText = doc.splitTextToSize(cellText, colWidth - 1);
          if (fittedText.length > 0) {
            doc.text(fittedText[0], currentX + 0.5, currentY + 5);
          }

          // Draw column separator
          doc.setDrawColor(200, 200, 200);
          doc.line(
            currentX + colWidth,
            currentY,
            currentX + colWidth,
            currentY + cellHeight,
          );
          currentX += colWidth;
        });

        // Draw row separator
        doc.setDrawColor(200, 200, 200);
        doc.line(
          startX,
          currentY + cellHeight,
          startX + tableWidth,
          currentY + cellHeight,
        );
        currentY += cellHeight;

        if (rowIndex === tableData.length - 1) {
          doc.setFont("helvetica", "normal");
        }
      });

      // Add table border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(startX, 75, tableWidth, currentY - 75);

      // Update finalY for manual table
      finalY = currentY + 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(
        `TOTAL CHARGEABLE PAY: KSh ${p9Data.totalChargeablePay.toLocaleString()}`,
        15,
        finalY,
      );
      doc.text(
        `TOTAL TAX: KSh ${p9Data.totalTax.toLocaleString()}`,
        150,
        finalY,
      );
    }

    // Footer with important notes
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const notes = [
      "IMPORTANT:",
      "(a) For all liable employees and where director/employee received benefits in addition to cash emoluments",
      "(b) Where an employee is eligible to deduction on owner occupier interest",
      "(c) Where an employee contributes to a post retirement medical fund",
      "",
      "2. (a) Deductible interest in respect of any month prior to December 2024 must not exceed Kshs. 25,000/= and commencing December 2024 must not exceed 30,000/=",
      "(b) Deductible pension contribution in respect of any month prior to December 2024 must not exceed Kshs. 20,000/= and commencing December 2024 must not exceed 30,000/=",
      "(c) Deductible contribution to a post retirement medical fund in respect of any month is effective from December 2024, must not exceed Kshs.15,000/=",
      "(d) Deductible Contribution to the Social Health Insurance Fund (SHIF) and deductions made towards Affordable Housing Levy (AHL) are effective December 2024",
      "(e) Personal Relief is Kshs. 2400 per Month or 28,800 per year",
      "(f) Insurance Relief is 15% of the Premium up to a Maximum of Kshs. 5,000 per month or Kshs. 60,000 per year",
    ];

    let noteY = finalY + 20;
    notes.forEach((note) => {
      doc.text(note, 20, noteY);
      noteY += 5;
    });

    // Save PDF
    doc.save(`P9_${employee.fullName.replace(/\s+/g, "_")}_${year}.pdf`);
  };

  // Generate Disbursement Report PDF
  const generateDisbursementPDF = (report: DisbursementReport) => {
    const doc = new jsPDF();

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("THE SEED OF ABRAHAM MINISTRY", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.text("PAYROLL DISBURSEMENT REPORT", 105, 35, { align: "center" });

    // Report Information
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Report ID: ${String(report.id || "N/A")}`, 20, 55);
    doc.text(`Period: ${String(report.period || "N/A")}`, 20, 65);
    doc.text(`Batch ID: ${String(report.batchId || "N/A")}`, 20, 75);
    doc.text(`Approved By: ${String(report.approvedBy || "N/A")}`, 120, 55);
    doc.text(
      `Approval Date: ${new Date(report.approvedDate).toLocaleDateString()}`,
      120,
      65,
    );
    doc.text(
      `Disbursement Date: ${new Date(report.disbursementDate).toLocaleDateString()}`,
      120,
      75,
    );

    // Summary Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("SUMMARY", 20, 95);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Total Employees: ${String(report.totalEmployees || 0)}`, 20, 110);
    doc.text(
      `Total Gross Amount: KSh ${(report.totalGrossAmount || 0).toLocaleString()}`,
      20,
      120,
    );
    doc.text(
      `Total Deductions: KSh ${(report.totalDeductions || 0).toLocaleString()}`,
      20,
      130,
    );
    doc.text(
      `Total Net Amount: KSh ${(report.totalNetAmount || 0).toLocaleString()}`,
      20,
      140,
    );
    doc.text(
      `Disbursement Method: ${String(report.disbursementMethod || "N/A")}`,
      20,
      150,
    );

    // Employee Details Table
    if (report.employees.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("EMPLOYEE DISBURSEMENT DETAILS", 20, 170);

      // Table headers
      const headers = [
        ["Employee ID", "Employee Name", "Net Salary (KSh)", "Status"],
      ];
      const data = report.employees.map((emp) => [
        String(emp.employeeId || "N/A"),
        String(emp.employeeName || "N/A"),
        String((emp.netSalary || 0).toLocaleString()),
        String(emp.disbursementStatus || "N/A"),
      ]);

      // Use autoTable if available
      if ((doc as any).autoTable) {
        (doc as any).autoTable({
          head: headers,
          body: data,
          startY: 180,
          theme: "grid",
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 10,
          },
          bodyStyles: {
            fontSize: 9,
          },
          columnStyles: {
            2: { halign: "right" }, // Align salary column to right
            3: { halign: "center" }, // Center align status
          },
          margin: { top: 10, left: 20, right: 20 },
        });
      } else {
        // Fallback manual table
        let yPos = 185;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");

        // Headers
        doc.text("Employee ID", 20, yPos);
        doc.text("Employee Name", 60, yPos);
        doc.text("Net Salary (KSh)", 120, yPos);
        doc.text("Status", 170, yPos);

        doc.setFont("helvetica", "normal");
        yPos += 10;

        // Data rows
        report.employees.forEach((emp) => {
          if (yPos > 270) {
            // Start new page if needed
            doc.addPage();
            yPos = 20;
          }

          doc.text(String(emp.employeeId || "N/A"), 20, yPos);
          doc.text(
            String(emp.employeeName || "N/A").substring(0, 20),
            60,
            yPos,
          ); // Truncate long names
          doc.text(String((emp.netSalary || 0).toLocaleString()), 120, yPos);
          doc.text(String(emp.disbursementStatus || "N/A"), 170, yPos);
          yPos += 8;
        });
      }
    }

    // Notes section
    if (report.notes && String(report.notes).trim()) {
      const finalY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 20
        : 240;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("NOTES:", 20, finalY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(String(report.notes), 170);
      doc.text(splitNotes, 20, finalY + 10);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("This is a computer-generated report.", 105, pageHeight - 20, {
      align: "center",
    });
    doc.text(
      `Generated on: ${new Date().toLocaleString()}`,
      105,
      pageHeight - 10,
      { align: "center" },
    );

    // Save PDF
    const safePeriod = String(report.period || "Unknown").replace(
      /[^a-zA-Z0-9]/g,
      "_",
    );
    const safeId = String(report.id || "Unknown").replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`Disbursement_Report_${safePeriod}_${safeId}.pdf`);
  };

  // Generate P9 Excel
  const generateP9Excel = (employee: Employee, year: number) => {
    const p9Data = calculateP9Data(employee, year);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // P9 data for Excel
    const excelData = [
      ["KENYA REVENUE AUTHORITY DOMESTIC TAXES DEPARTMENT"],
      [`TAX DEDUCTION CARD YEAR ${year}`],
      ["ISO 9001:2015 CERTIFIED"],
      [],
      [`Employer's PIN`, p9Data.employerPin],
      [`Employer's Name`, p9Data.employerName],
      [`Employee's PIN`, p9Data.employeePin],
      [`Employee's Main Name`, p9Data.employeeMainName],
      [`Employee's Other Names`, p9Data.employeeOtherNames],
      [],
      [
        "MONTH",
        "Basic Salary (KSh)",
        "Benefits Non-Cash (KSh)",
        "Value of Quarters (KSh)",
        "Total Gross Pay (KSh)",
        "Affordable Housing Levy (KSh)",
        "Social Health Insurance Fund (KSh)",
        "Post Retirement Medical Fund (KSh)",
        "Defined Contribution Retirement Scheme (KSh)",
        "Owner Occupied Interest (KSh)",
        "Total Deductions (KSh)",
        "Chargeable Pay (KSh)",
        "Tax Charged (KSh)",
        "Personal Relief (KSh)",
        "Insurance Relief (KSh)",
        "PAYE Tax (KSh)",
      ],
    ];

    // Add monthly data
    p9Data.monthlyData.forEach((data) => {
      excelData.push([
        data.month,
        String(data.basicSalary),
        String(data.benefitsNonCash),
        String(data.valueOfQuarters),
        String(data.totalGrossPay),
        String(data.affordableHousingLevy),
        String(data.socialHealthInsuranceFund),
        String(data.postRetirementMedicalFund),
        String(data.definedContributionRetirementScheme),
        String(data.ownerOccupiedInterest),
        String(data.totalDeductions),
        String(data.chargeablePay),
        String(data.taxCharged),
        String(data.personalRelief),
        String(data.insuranceRelief),
        String(data.payeTax),
      ]);
    });

    // Add totals
    const totals = p9Data.monthlyData.reduce(
      (acc, data) => ({
        basicSalary: acc.basicSalary + data.basicSalary,
        benefitsNonCash: acc.benefitsNonCash + data.benefitsNonCash,
        valueOfQuarters: acc.valueOfQuarters + data.valueOfQuarters,
        totalGrossPay: acc.totalGrossPay + data.totalGrossPay,
        affordableHousingLevy:
          acc.affordableHousingLevy + data.affordableHousingLevy,
        socialHealthInsuranceFund:
          acc.socialHealthInsuranceFund + data.socialHealthInsuranceFund,
        postRetirementMedicalFund:
          acc.postRetirementMedicalFund + data.postRetirementMedicalFund,
        definedContributionRetirementScheme:
          acc.definedContributionRetirementScheme +
          data.definedContributionRetirementScheme,
        ownerOccupiedInterest:
          acc.ownerOccupiedInterest + data.ownerOccupiedInterest,
        totalDeductions: acc.totalDeductions + data.totalDeductions,
        chargeablePay: acc.chargeablePay + data.chargeablePay,
        taxCharged: acc.taxCharged + data.taxCharged,
        personalRelief: acc.personalRelief + data.personalRelief,
        insuranceRelief: acc.insuranceRelief + data.insuranceRelief,
        payeTax: acc.payeTax + data.payeTax,
      }),
      {
        basicSalary: 0,
        benefitsNonCash: 0,
        valueOfQuarters: 0,
        totalGrossPay: 0,
        affordableHousingLevy: 0,
        socialHealthInsuranceFund: 0,
        postRetirementMedicalFund: 0,
        definedContributionRetirementScheme: 0,
        ownerOccupiedInterest: 0,
        totalDeductions: 0,
        chargeablePay: 0,
        taxCharged: 0,
        personalRelief: 0,
        insuranceRelief: 0,
        payeTax: 0,
      },
    );

    excelData.push([
      "TOTAL",
      String(totals.basicSalary),
      String(totals.benefitsNonCash),
      String(totals.valueOfQuarters),
      String(totals.totalGrossPay),
      String(totals.affordableHousingLevy),
      String(totals.socialHealthInsuranceFund),
      String(totals.postRetirementMedicalFund),
      String(totals.definedContributionRetirementScheme),
      String(totals.ownerOccupiedInterest),
      String(totals.totalDeductions),
      String(totals.chargeablePay),
      String(totals.taxCharged),
      String(totals.personalRelief),
      String(totals.insuranceRelief),
      String(totals.payeTax),
    ]);

    excelData.push([]);
    excelData.push([
      `TOTAL CHARGEABLE PAY:`,
      `KSh ${p9Data.totalChargeablePay.toLocaleString()}`,
    ]);
    excelData.push([`TOTAL TAX:`, `KSh ${p9Data.totalTax.toLocaleString()}`]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "P9 Form");

    // Save Excel file
    XLSX.writeFile(
      wb,
      `P9_${employee.fullName.replace(/\s+/g, "_")}_${year}.xlsx`,
    );
  };

  const generatePayslip = (employee: Employee) => {
    const grossSalary =
      employee.basicSalary +
      Object.values(employee.allowances).reduce((a, b) => a + b, 0);

    // Kenya tax calculations
    const paye = calculatePayrollPAYE(grossSalary);
    const sha = grossSalary * 0.0275; // 2.75% SHA
    const nssf = Math.min(grossSalary * 0.06, 2160); // 6% capped at KSH 2,160
    const housingLevy = grossSalary * 0.015; // 1.5% Housing Levy

    const totalDeductions = paye + sha + nssf + housingLevy;
    const netSalary = grossSalary - totalDeductions;

    const payslipData = {
      employee,
      period: new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      basicSalary: employee.basicSalary,
      allowances: Object.values(employee.allowances).reduce((a, b) => a + b, 0),
      grossSalary,
      paye,
      sha,
      nssf,
      housingLevy,
      totalDeductions,
      netSalary,
      generatedDate: new Date().toLocaleDateString(),
    };

    // Generate and print payslip
    printPayslip(payslipData);
  };

  const calculatePayrollPAYE = (grossSalary: number): number => {
    // Kenya PAYE calculation for 2024/2025
    let paye = 0;
    const monthlyIncome = grossSalary;

    if (monthlyIncome <= 24000) {
      paye = monthlyIncome * 0.1; // 10%
    } else if (monthlyIncome <= 32333) {
      paye = 2400 + (monthlyIncome - 24000) * 0.25; // 25%
    } else if (monthlyIncome <= 500000) {
      paye = 2400 + 2083.25 + (monthlyIncome - 32333) * 0.3; // 30%
    } else if (monthlyIncome <= 800000) {
      paye = 2400 + 2083.25 + 140300.1 + (monthlyIncome - 500000) * 0.325; // 32.5%
    } else {
      paye =
        2400 + 2083.25 + 140300.1 + 97500 + (monthlyIncome - 800000) * 0.35; // 35%
    }

    // Personal relief
    paye -= 2400;
    return Math.max(0, paye);
  };

  const printPayslip = (payslipData: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const payslipHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Payslip - ${payslipData.employee.fullName}</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .company-name { font-size: 24px; font-weight: bold; color: #2c5282; }
              .payslip-title { font-size: 18px; margin-top: 10px; }
              .employee-info { margin: 20px 0; }
              .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .table th { background-color: #f8f9fa; }
              .total-row { font-weight: bold; background-color: #e9ecef; }
              .amount { text-align: right; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6c757d; }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="company-name">The Seed of Abraham Ministry (TSOAM)</div>
              <div>P.O. Box 12345, Nairobi, Kenya</div>
              <div>Email: admin@tsoam.org | Phone: +254 700 000 000</div>
              <div class="payslip-title">PAYSLIP FOR ${payslipData.period.toUpperCase()}</div>
          </div>

          <div class="employee-info">
              <table class="table">
                  <tr>
                      <td><strong>Employee Name:</strong></td>
                      <td>${payslipData.employee.fullName}</td>
                      <td><strong>Employee ID:</strong></td>
                      <td>${payslipData.employee.employeeId}</td>
                  </tr>
                  <tr>
                      <td><strong>Department:</strong></td>
                      <td>${payslipData.employee.department}</td>
                      <td><strong>Position:</strong></td>
                      <td>${payslipData.employee.position}</td>
                  </tr>
                  <tr>
                      <td><strong>KRA PIN:</strong></td>
                      <td>${payslipData.employee.kraPin}</td>
                      <td><strong>NSSF No:</strong></td>
                      <td>${payslipData.employee.nssfNumber}</td>
                  </tr>
                  <tr>
                      <td><strong>Bank:</strong></td>
                      <td>${payslipData.employee.bankDetails.bankName}</td>
                      <td><strong>Account No:</strong></td>
                      <td>${payslipData.employee.bankDetails.accountNumber}</td>
                  </tr>
              </table>
          </div>

          <table class="table">
              <thead>
                  <tr>
                      <th>EARNINGS</th>
                      <th class="amount">AMOUNT (KSH)</th>
                      <th>DEDUCTIONS</th>
                      <th class="amount">AMOUNT (KSH)</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td>Basic Salary</td>
                      <td class="amount">${payslipData.basicSalary.toLocaleString()}</td>
                      <td>P.A.Y.E</td>
                      <td class="amount">${payslipData.paye.toLocaleString()}</td>
                  </tr>
                  <tr>
                      <td>Housing Allowance</td>
                      <td class="amount">${payslipData.employee.allowances.housing.toLocaleString()}</td>
                      <td>S.H.A</td>
                      <td class="amount">${payslipData.sha.toLocaleString()}</td>
                  </tr>
                  <tr>
                      <td>Transport Allowance</td>
                      <td class="amount">${payslipData.employee.allowances.transport.toLocaleString()}</td>
                      <td>N.S.S.F</td>
                      <td class="amount">${payslipData.nssf.toLocaleString()}</td>
                  </tr>
                  <tr>
                      <td>Medical Allowance</td>
                      <td class="amount">${payslipData.employee.allowances.medical.toLocaleString()}</td>
                      <td>Housing Levy</td>
                      <td class="amount">${payslipData.housingLevy.toLocaleString()}</td>
                  </tr>
                  <tr>
                      <td>Other Allowances</td>
                      <td class="amount">${payslipData.employee.allowances.other.toLocaleString()}</td>
                      <td></td>
                      <td class="amount"></td>
                  </tr>
                  <tr class="total-row">
                      <td><strong>GROSS PAY</strong></td>
                      <td class="amount"><strong>${payslipData.grossSalary.toLocaleString()}</strong></td>
                      <td><strong>TOTAL DEDUCTIONS</strong></td>
                      <td class="amount"><strong>${payslipData.totalDeductions.toLocaleString()}</strong></td>
                  </tr>
                  <tr class="total-row" style="background-color: #28a745; color: white;">
                      <td colspan="3"><strong>NET PAY</strong></td>
                      <td class="amount"><strong>${payslipData.netSalary.toLocaleString()}</strong></td>
                  </tr>
              </tbody>
          </table>

          <div class="footer">
              <p>This is a computer-generated payslip and does not require a signature.</p>
              <p>Generated on: ${payslipData.generatedDate}</p>
              <p>© 2025 The Seed of Abraham Ministry. All rights reserved.</p>
          </div>
      </body>
      </html>
    `;

    printWindow.document.write(payslipHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const printLeaveForm = (leaveRequest?: LeaveRequest) => {
    const formData = leaveRequest || leaveForm;
    const employee = employees.find(
      (e) => e.employeeId === formData.employeeId,
    );

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const leaveFormHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Leave Application Form</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .company-name { font-size: 24px; font-weight: bold; color: #2c5282; }
              .form-title { font-size: 18px; margin-top: 10px; }
              .form-section { margin: 20px 0; }
              .field { margin: 10px 0; }
              .field label { font-weight: bold; display: inline-block; width: 150px; }
              .field input { border: none; border-bottom: 1px solid #000; margin-left: 10px; }
              .signature-section { margin-top: 50px; }
              .signature-box { display: inline-block; width: 200px; border-bottom: 1px solid #000; margin: 0 20px; }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="company-name">The Seed of Abraham Ministry (TSOAM)</div>
              <div>P.O. Box 12345, Nairobi, Kenya</div>
              <div class="form-title">LEAVE APPLICATION FORM</div>
          </div>

          <div class="form-section">
              <div class="field">
                  <label>Employee Name:</label>
                  <span>${employee?.fullName || "_________________________"}</span>
              </div>
              <div class="field">
                  <label>Employee ID:</label>
                  <span>${formData.employeeId || "_________________________"}</span>
              </div>
              <div class="field">
                  <label>Department:</label>
                  <span>${employee?.department || "_________________________"}</span>
              </div>
              <div class="field">
                  <label>Position:</label>
                  <span>${employee?.position || "_________________________"}</span>
              </div>
          </div>

          <div class="form-section">
              <div class="field">
                  <label>Leave Type:</label>
                  <span>${formData.leaveType || "_________________________"}</span>
              </div>
              <div class="field">
                  <label>Start Date:</label>
                  <span>${typeof formData.startDate === "string" ? formData.startDate : formData.startDate.toISOString().split("T")[0]}</span>
              </div>
              <div class="field">
                  <label>End Date:</label>
                  <span>${typeof formData.endDate === "string" ? formData.endDate : formData.endDate.toISOString().split("T")[0]}</span>
              </div>
              <div class="field">
                  <label>Number of Days:</label>
                  <span>${leaveRequest?.days || Math.ceil(((typeof formData.endDate === "string" ? new Date(formData.endDate) : formData.endDate).getTime() - (typeof formData.startDate === "string" ? new Date(formData.startDate) : formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}</span>
              </div>
              <div class="field">
                  <label>Reason for Leave:</label>
                  <div style="margin-top: 10px; border: 1px solid #000; padding: 10px; min-height: 60px;">
                      ${formData.reason || ""}
                  </div>
              </div>
          </div>

          <div class="signature-section">
              <div style="margin: 30px 0;">
                  <span>Employee Signature: </span>
                  <span class="signature-box"></span>
                  <span style="margin-left: 40px;">Date: </span>
                  <span class="signature-box"></span>
              </div>

              <div style="margin: 30px 0;">
                  <span>Supervisor Approval: </span>
                  <span class="signature-box"></span>
                  <span style="margin-left: 40px;">Date: </span>
                  <span class="signature-box"></span>
              </div>

              <div style="margin: 30px 0;">
                  <span>HR Approval: </span>
                  <span class="signature-box"></span>
                  <span style="margin-left: 40px;">Date: </span>
                  <span class="signature-box"></span>
              </div>
          </div>

          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #6c757d;">
              <p>This form must be submitted at least 7 days before the leave commencement date.</p>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
      </body>
      </html>
    `;

    printWindow.document.write(leaveFormHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExport = async (
    format: "excel" | "pdf",
    type: "employees" | "leave" | "payroll",
  ) => {
    let data: any[] = [];
    let filename = "";
    let title = "";

    switch (type) {
      case "employees":
        data = filteredEmployees.map((emp) => ({
          "Employee ID": emp.employeeId,
          "Full Name": emp.fullName,
          Email: emp.email,
          Department: emp.department,
          Position: emp.position,
          "Employment Type": emp.employmentType,
          Status: emp.employmentStatus,
          "Basic Salary": `KSH ${emp.basicSalary.toLocaleString()}`,
          "Hire Date": emp.hireDate,
        }));
        filename = `employees_${new Date().toISOString().split("T")[0]}`;
        title = "TSOAM - Employee Records";
        break;
      case "leave":
        data = leaveRequests.map((leave) => ({
          "Employee ID": leave.employeeId,
          "Employee Name": leave.employeeName,
          "Leave Type": leave.leaveType,
          "Start Date": leave.startDate,
          "End Date": leave.endDate,
          Days: leave.days,
          Status: leave.status,
          "Applied Date": leave.appliedDate,
        }));
        filename = `leave_requests_${new Date().toISOString().split("T")[0]}`;
        title = "TSOAM - Leave Requests";
        break;
      case "payroll":
        data = payrollRecords.map((payroll) => ({
          "Employee ID": payroll.employeeId,
          "Employee Name": payroll.employeeName,
          Period: payroll.period,
          "Basic Salary": `KSH ${payroll.basicSalary.toLocaleString()}`,
          "Gross Salary": `KSH ${payroll.grossSalary.toLocaleString()}`,
          PAYE: `KSH ${payroll.paye.toLocaleString()}`,
          NSSF: `KSH ${payroll.nssf.toLocaleString()}`,
          "Net Salary": `KSH ${payroll.netSalary.toLocaleString()}`,
        }));
        filename = `payroll_${new Date().toISOString().split("T")[0]}`;
        title = "TSOAM - Payroll Records";
        break;
    }

    try {
      await exportService.export({
        filename,
        title,
        subtitle: `Generated on ${new Date().toLocaleDateString()}`,
        data,
        format: format as "pdf" | "excel" | "csv",
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed: " + error.message);
    }
  };

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(
    (e) => e.employmentStatus === "Active",
  ).length;
  const pendingLeaves = leaveRequests.filter(
    (l) => l.status === "Pending",
  ).length;
  const monthlyPayroll =
    processedPayrollTotal > 0
      ? processedPayrollTotal
      : employees.reduce(
          (total, emp) =>
            total +
            emp.basicSalary +
            Object.values(emp.allowances).reduce((a, b) => a + b, 0),
          0,
        );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Human Resources</h1>
            <p className="text-muted-foreground">
              Comprehensive HR management system for TSOAM
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport("excel", "employees")}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Dialog
              open={showAddEmployeeDialog}
              onOpenChange={setShowAddEmployeeDialog}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">All staff members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Employees
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEmployees}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Leaves
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingLeaves}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Payroll
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSH {monthlyPayroll.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {processedPayrollTotal > 0
                  ? "Processed payroll total"
                  : "Total monthly cost"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="leave">Leave Management</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            {/* Employee Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select
                    value={departmentFilter}
                    onValueChange={setDepartmentFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="Administration">
                        Administration
                      </SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Youth Ministry">
                        Youth Ministry
                      </SelectItem>
                      <SelectItem value="Worship">Worship</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Terminated">Terminated</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Employees Table */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Records</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.employeeId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {employee.fullName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.position}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>
                          {getEmploymentTypeBadge(employee.employmentType)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(employee.employmentStatus)}
                        </TableCell>
                        <TableCell>
                          KSH {employee.basicSalary.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowEmployeeDetailDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generatePayslip(employee)}
                            >
                              <PrinterIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowStatusChangeDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
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

          <TabsContent value="leave" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Leave Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage employee leave requests and approvals
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExport("excel", "leave")}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Dialog
                  open={showLeaveRequestDialog}
                  onOpenChange={setShowLeaveRequestDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Leave Request
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {leave.employeeName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {leave.employeeId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{leave.leaveType}</TableCell>
                        <TableCell>
                          <div>
                            <div>
                              {leave.startDate} to {leave.endDate}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {leave.days} days
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              leave.status === "Approved"
                                ? "default"
                                : leave.status === "Pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {leave.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{leave.appliedDate}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printLeaveForm(leave)}
                            >
                              <PrinterIcon className="h-4 w-4" />
                            </Button>
                            {leave.status === "Pending" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Payroll Management</h3>
                <p className="text-sm text-muted-foreground">
                  Generate and manage employee payslips
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExport("excel", "payroll")}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Payroll
                </Button>
                <Button onClick={() => setShowProcessPayrollDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Process Payroll
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDisbursementReportsDialog(true)}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Disbursement Reports
                  {disbursementReports.length > 0 && (
                    <Badge className="ml-2 bg-green-600">
                      {disbursementReports.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowP9FormDialog(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate P9 Form
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Payslip Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {employees
                    .filter((e) => e.employmentStatus === "Active")
                    .map((employee) => (
                      <Card
                        key={employee.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {employee.fullName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {employee.employeeId}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {employee.department}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => generatePayslip(employee)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <PrinterIcon className="h-4 w-4 mr-1" />
                              Print
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track employee performance and conduct reviews
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Performance management features coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Employee Dialog */}
        <Dialog
          open={showAddEmployeeDialog}
          onOpenChange={setShowAddEmployeeDialog}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={employeeForm.fullName}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          fullName: e.target.value,
                        })
                      }
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={employeeForm.email}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={employeeForm.phone}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">National ID</Label>
                    <Input
                      id="nationalId"
                      value={employeeForm.nationalId}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          nationalId: e.target.value,
                        })
                      }
                      placeholder="Enter national ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={employeeForm.gender}
                      onValueChange={(value) =>
                        setEmployeeForm({ ...employeeForm, gender: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={employeeForm.dateOfBirth}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={employeeForm.address}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter physical address"
                    rows={2}
                  />
                </div>
              </div>

              {/* Employment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Employment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={employeeForm.department}
                      onValueChange={(value) =>
                        setEmployeeForm({ ...employeeForm, department: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administration">
                          Administration
                        </SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Youth Ministry">
                          Youth Ministry
                        </SelectItem>
                        <SelectItem value="Worship">Worship</SelectItem>
                        <SelectItem value="Children Ministry">
                          Children Ministry
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={employeeForm.position}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          position: e.target.value,
                        })
                      }
                      placeholder="Enter job position"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select
                      value={employeeForm.employmentType}
                      onValueChange={(value) =>
                        setEmployeeForm({
                          ...employeeForm,
                          employmentType: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Volunteer">Volunteer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Hire Date</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={employeeForm.hireDate}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          hireDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Salary Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Salary & Benefits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basicSalary">Basic Salary (KSH)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        KSH
                      </span>
                      <Input
                        id="basicSalary"
                        type="number"
                        value={employeeForm.basicSalary}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            basicSalary: e.target.value,
                          })
                        }
                        onFocus={(e) => {
                          if (
                            e.target.value === "0" ||
                            e.target.value === "0.00"
                          ) {
                            setEmployeeForm({
                              ...employeeForm,
                              basicSalary: "",
                            });
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
                    <Label htmlFor="housingAllowance">
                      Housing Allowance (KSH)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        KSH
                      </span>
                      <Input
                        id="housingAllowance"
                        type="number"
                        value={employeeForm.housingAllowance}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            housingAllowance: e.target.value,
                          })
                        }
                        onFocus={(e) => {
                          if (
                            e.target.value === "0" ||
                            e.target.value === "0.00"
                          ) {
                            setEmployeeForm({
                              ...employeeForm,
                              housingAllowance: "",
                            });
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
                    <Label htmlFor="transportAllowance">
                      Transport Allowance (KSH)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        KSH
                      </span>
                      <Input
                        id="transportAllowance"
                        type="number"
                        value={employeeForm.transportAllowance}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            transportAllowance: e.target.value,
                          })
                        }
                        onFocus={(e) => {
                          if (
                            e.target.value === "0" ||
                            e.target.value === "0.00"
                          ) {
                            setEmployeeForm({
                              ...employeeForm,
                              transportAllowance: "",
                            });
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
                    <Label htmlFor="medicalAllowance">
                      Medical Allowance (KSH)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        KSH
                      </span>
                      <Input
                        id="medicalAllowance"
                        type="number"
                        value={employeeForm.medicalAllowance}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            medicalAllowance: e.target.value,
                          })
                        }
                        onFocus={(e) => {
                          if (
                            e.target.value === "0" ||
                            e.target.value === "0.00"
                          ) {
                            setEmployeeForm({
                              ...employeeForm,
                              medicalAllowance: "",
                            });
                          }
                        }}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="font-semibold pl-16 pr-4 py-3 text-right bg-green-50 border-green-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Government Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Government Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kraPin">KRA PIN</Label>
                    <Input
                      id="kraPin"
                      value={employeeForm.kraPin}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          kraPin: e.target.value,
                        })
                      }
                      placeholder="Enter KRA PIN"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nhifNumber">NHIF Number</Label>
                    <Input
                      id="nhifNumber"
                      value={employeeForm.nhifNumber}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          nhifNumber: e.target.value,
                        })
                      }
                      placeholder="Enter NHIF number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nssfNumber">NSSF Number</Label>
                    <Input
                      id="nssfNumber"
                      value={employeeForm.nssfNumber}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          nssfNumber: e.target.value,
                        })
                      }
                      placeholder="Enter NSSF number"
                    />
                  </div>
                </div>

                {/* Document Upload Section */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Employee Documents</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="documents">
                        Upload Documents (CV, ID, Certificates, Licenses)
                      </Label>
                      <Input
                        id="documents"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setEmployeeForm({
                            ...employeeForm,
                            documents: files,
                          });
                        }}
                      />
                      <div className="text-xs text-muted-foreground">
                        Accepted formats: PDF, DOC, DOCX, JPG, PNG. Max size:
                        10MB per file.
                      </div>
                      {employeeForm.documents &&
                        employeeForm.documents.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              Selected files:
                            </div>
                            {employeeForm.documents.map((file, index) => (
                              <div
                                key={index}
                                className="text-xs text-muted-foreground flex items-center gap-2"
                              >
                                <FileText className="h-3 w-3" />
                                {file.name} (
                                {(file.size / 1024 / 1024).toFixed(2)} MB)
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddEmployeeDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddEmployee}>Add Employee</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Leave Request Dialog */}
        <Dialog
          open={showLeaveRequestDialog}
          onOpenChange={setShowLeaveRequestDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Leave Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leaveEmployee">Employee *</Label>
                <Select
                  value={leaveForm.employeeId}
                  onValueChange={(value) =>
                    setLeaveForm({ ...leaveForm, employeeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter((e) => e.employmentStatus === "Active")
                      .map((employee) => (
                        <SelectItem
                          key={employee.employeeId}
                          value={employee.employeeId}
                        >
                          {employee.fullName} - {employee.employeeId}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave Type *</Label>
                <Select
                  value={leaveForm.leaveType}
                  onValueChange={(value) =>
                    setLeaveForm({ ...leaveForm, leaveType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual">Annual Leave</SelectItem>
                    <SelectItem value="Sick">Sick Leave</SelectItem>
                    <SelectItem value="Maternity">Maternity Leave</SelectItem>
                    <SelectItem value="Paternity">Paternity Leave</SelectItem>
                    <SelectItem value="Emergency">Emergency Leave</SelectItem>
                    <SelectItem value="Study">Study Leave</SelectItem>
                    <SelectItem value="Compassionate">
                      Compassionate Leave
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={leaveForm.startDate.toISOString().split("T")[0]}
                    onChange={(e) =>
                      setLeaveForm({
                        ...leaveForm,
                        startDate: new Date(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={leaveForm.endDate.toISOString().split("T")[0]}
                    onChange={(e) =>
                      setLeaveForm({
                        ...leaveForm,
                        endDate: new Date(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveReason">Reason for Leave *</Label>
                <Textarea
                  id="leaveReason"
                  value={leaveForm.reason}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, reason: e.target.value })
                  }
                  placeholder="Explain the reason for leave"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowLeaveRequestDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => printLeaveForm()}>
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print Form
                </Button>
                <Button onClick={handleLeaveRequest}>Submit Request</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Employee Status Change Dialog */}
        <Dialog
          open={showStatusChangeDialog}
          onOpenChange={setShowStatusChangeDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Employee Status</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Employee Details</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Name:</strong> {selectedEmployee.fullName}
                    </div>
                    <div>
                      <strong>Employee ID:</strong>{" "}
                      {selectedEmployee.employeeId}
                    </div>
                    <div>
                      <strong>Current Status:</strong>{" "}
                      {selectedEmployee.employmentStatus}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newStatus">New Status *</Label>
                  <Select
                    value={statusChangeForm.newStatus}
                    onValueChange={(value) =>
                      setStatusChangeForm({
                        ...statusChangeForm,
                        newStatus: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Terminated">Terminated</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(statusChangeForm.newStatus === "Suspended" ||
                  statusChangeForm.newStatus === "Terminated") && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Warning</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      This action will change the employee's status and create a
                      disciplinary record.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="statusReason">Reason *</Label>
                  <Textarea
                    id="statusReason"
                    value={statusChangeForm.reason}
                    onChange={(e) =>
                      setStatusChangeForm({
                        ...statusChangeForm,
                        reason: e.target.value,
                      })
                    }
                    placeholder="Provide detailed reason for status change"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Effective Date</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={statusChangeForm.effectiveDate}
                    onChange={(e) =>
                      setStatusChangeForm({
                        ...statusChangeForm,
                        effectiveDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statusNotes">Additional Notes</Label>
                  <Textarea
                    id="statusNotes"
                    value={statusChangeForm.notes}
                    onChange={(e) =>
                      setStatusChangeForm({
                        ...statusChangeForm,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Any additional information"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowStatusChangeDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStatusChange}
                    variant={
                      statusChangeForm.newStatus === "Terminated"
                        ? "destructive"
                        : "default"
                    }
                  >
                    Update Status
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Employee Detail Dialog */}
        <Dialog
          open={showEmployeeDetailDialog}
          onOpenChange={setShowEmployeeDetailDialog}
        >
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-6">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="employment">Employment</TabsTrigger>
                    <TabsTrigger value="salary">Salary</TabsTrigger>
                    <TabsTrigger value="leave">Leave</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Full Name</Label>
                        <p className="text-sm">{selectedEmployee.fullName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Employee ID
                        </Label>
                        <p className="text-sm">{selectedEmployee.employeeId}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm">{selectedEmployee.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone</Label>
                        <p className="text-sm">{selectedEmployee.phone}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Gender</Label>
                        <p className="text-sm">{selectedEmployee.gender}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Date of Birth
                        </Label>
                        <p className="text-sm">
                          {selectedEmployee.dateOfBirth}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-medium">Address</Label>
                        <p className="text-sm">{selectedEmployee.address}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="employment" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Department
                        </Label>
                        <p className="text-sm">{selectedEmployee.department}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Position</Label>
                        <p className="text-sm">{selectedEmployee.position}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Employment Type
                        </Label>
                        {getEmploymentTypeBadge(
                          selectedEmployee.employmentType,
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        {getStatusBadge(selectedEmployee.employmentStatus)}
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Hire Date</Label>
                        <p className="text-sm">{selectedEmployee.hireDate}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Performance Rating
                        </Label>
                        <p className="text-sm">
                          {selectedEmployee.performanceRating}/5.0
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="salary" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Basic Salary
                        </Label>
                        <p className="text-sm">
                          KSH {selectedEmployee.basicSalary.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Housing Allowance
                        </Label>
                        <p className="text-sm">
                          KSH{" "}
                          {selectedEmployee.allowances.housing.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Transport Allowance
                        </Label>
                        <p className="text-sm">
                          KSH{" "}
                          {selectedEmployee.allowances.transport.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Medical Allowance
                        </Label>
                        <p className="text-sm">
                          KSH{" "}
                          {selectedEmployee.allowances.medical.toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-medium">
                          Total Monthly Package
                        </Label>
                        <p className="text-lg font-semibold text-green-600">
                          KSH{" "}
                          {(
                            selectedEmployee.basicSalary +
                            Object.values(selectedEmployee.allowances).reduce(
                              (a, b) => a + b,
                              0,
                            )
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="leave" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Annual Leave Balance
                        </Label>
                        <p className="text-sm">
                          {selectedEmployee.leaveBalance.annual} days
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Sick Leave Balance
                        </Label>
                        <p className="text-sm">
                          {selectedEmployee.leaveBalance.sick} days
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Maternity Leave
                        </Label>
                        <p className="text-sm">
                          {selectedEmployee.leaveBalance.maternity} days
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Paternity Leave
                        </Label>
                        <p className="text-sm">
                          {selectedEmployee.leaveBalance.paternity} days
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => generatePayslip(selectedEmployee)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Generate Payslip
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Process Payroll Dialog */}
        <Dialog
          open={showProcessPayrollDialog}
          onOpenChange={setShowProcessPayrollDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Monthly Payroll</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Calculator className="h-4 w-4" />
                  <span className="font-medium">Payroll Processing</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  This will process payroll for all active employees for the
                  current month ({new Date().toISOString().slice(0, 7)}).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Employees to be processed:</h4>
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {employees
                    .filter((emp) => emp.employmentStatus === "Active")
                    .map((emp) => (
                      <div
                        key={emp.id}
                        className="flex justify-between items-center py-1 text-sm"
                      >
                        <span>
                          {emp.fullName} ({emp.employeeId})
                        </span>
                        <span className="text-green-600">
                          KSH {emp.basicSalary.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowProcessPayrollDialog(false)}
                  disabled={payrollProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProcessPayroll}
                  disabled={payrollProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {payrollProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Process Payroll
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* P9 Form Generation Dialog */}
        <Dialog open={showP9FormDialog} onOpenChange={setShowP9FormDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate P9 Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">KRA P9 Form Generation</h3>
                <p className="text-sm text-blue-700">
                  Generate official P9 Tax Deduction Card compliant with KRA
                  2024 standards. Available in PDF and Excel formats.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="p9Employee">Select Employee *</Label>
                  <Select
                    value={selectedP9Employee?.id.toString() || ""}
                    onValueChange={(value) => {
                      const employee = employees.find(
                        (e) => e.id.toString() === value,
                      );
                      setSelectedP9Employee(employee || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter((e) => e.employmentStatus === "Active")
                        .map((employee) => (
                          <SelectItem
                            key={employee.id}
                            value={employee.id.toString()}
                          >
                            {employee.fullName} - {employee.employeeId}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="p9Year">Tax Year *</Label>
                  <Select
                    value={p9Year.toString()}
                    onValueChange={(value) => setP9Year(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedP9Employee && (
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium mb-2">Employee Details</h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Name:</strong> {selectedP9Employee.fullName}
                      </p>
                      <p>
                        <strong>Employee ID:</strong>{" "}
                        {selectedP9Employee.employeeId}
                      </p>
                      <p>
                        <strong>KRA PIN:</strong> {selectedP9Employee.kraPin}
                      </p>
                      <p>
                        <strong>Basic Salary:</strong> KSh{" "}
                        {selectedP9Employee.basicSalary.toLocaleString()}
                      </p>
                      <p>
                        <strong>Department:</strong>{" "}
                        {selectedP9Employee.department}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowP9FormDialog(false)}
                >
                  Cancel
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedP9Employee) {
                        generateP9Excel(selectedP9Employee, p9Year);
                        setShowP9FormDialog(false);
                      }
                    }}
                    disabled={!selectedP9Employee}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedP9Employee) {
                        generateP9PDF(selectedP9Employee, p9Year);
                        setShowP9FormDialog(false);
                      }
                    }}
                    disabled={!selectedP9Employee}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Disbursement Reports Dialog */}
        <Dialog
          open={showDisbursementReportsDialog}
          onOpenChange={setShowDisbursementReportsDialog}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Disbursement Reports from Finance
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {disbursementReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No Disbursement Reports</h3>
                  <p className="text-sm">
                    Process payroll to receive disbursement reports from Finance
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {disbursementReports.length} disbursement report(s)
                      received
                    </p>
                  </div>

                  <div className="space-y-3">
                    {disbursementReports.map((report) => (
                      <Card key={report.id} className="border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  Disbursement Report - {report.period}
                                </h4>
                                <Badge
                                  variant={
                                    report.status === "Approved"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={
                                    report.status === "Approved"
                                      ? "bg-green-600"
                                      : ""
                                  }
                                >
                                  {report.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Employees
                                  </p>
                                  <p className="font-medium">
                                    {report.totalEmployees}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Total Amount
                                  </p>
                                  <p className="font-medium text-green-600">
                                    KSh {report.totalNetAmount.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Approved By
                                  </p>
                                  <p className="font-medium">
                                    {report.approvedBy}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Date</p>
                                  <p className="font-medium">
                                    {new Date(
                                      report.disbursementDate,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              {report.notes && (
                                <div className="mt-2">
                                  <p className="text-sm text-muted-foreground">
                                    Notes:
                                  </p>
                                  <p className="text-sm">{report.notes}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setSelectedDisbursementReport(report)
                                }
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateDisbursementPDF(report)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                PDF
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDisbursementReportsDialog(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Disbursement Report Details Dialog */}
        {selectedDisbursementReport && (
          <Dialog
            open={!!selectedDisbursementReport}
            onOpenChange={() => setSelectedDisbursementReport(null)}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Disbursement Report Details -{" "}
                  {selectedDisbursementReport.period}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Employees
                        </p>
                        <p className="text-lg font-semibold">
                          {selectedDisbursementReport.totalEmployees}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Gross Amount
                        </p>
                        <p className="text-lg font-semibold">
                          KSh{" "}
                          {selectedDisbursementReport.totalGrossAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Deductions
                        </p>
                        <p className="text-lg font-semibold text-red-600">
                          KSh{" "}
                          {selectedDisbursementReport.totalDeductions.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Net Amount
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          KSh{" "}
                          {selectedDisbursementReport.totalNetAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Employee Details */}
                {selectedDisbursementReport.employees.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Employee Disbursements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Net Salary</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDisbursementReport.employees.map(
                            (emp, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">
                                      {emp.employeeName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {emp.employeeId}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  KSh {emp.netSalary.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      emp.disbursementStatus === "Success"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {emp.disbursementStatus}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ),
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDisbursementReport(null)}
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}
