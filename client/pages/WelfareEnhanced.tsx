import React, { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Heart,
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  Eye,
  Edit,
  Check,
  X,
  Clock,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Upload,
  Printer,
  Save,
  Send,
  File,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { financialTransactionService } from "@/services/FinancialTransactionService";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

interface WelfareApplication {
  id: string;
  // Personal Information
  applicantName: string;
  idNumber: string;
  dateOfBirth: string;
  gender: "Male" | "Female";
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed";
  phoneNumber: string;
  alternativePhone?: string;
  email?: string;
  physicalAddress: string;
  postalAddress?: string;
  nationality: string;

  // Church Affiliation
  membershipStatus: "Member" | "Regular Attendee" | "Visitor";
  membershipNumber?: string;
  homeChurch?: string;
  currentChurch: string;
  yearsInChurch: number;
  spiritualLeader?: string;

  // Emergency Contact
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;

  // Financial Information
  employmentStatus:
    | "Employed"
    | "Self-employed"
    | "Unemployed"
    | "Student"
    | "Retired";
  occupation?: string;
  employer?: string;
  monthlyIncome: number;
  otherIncomeSource?: string;
  otherIncomeAmount?: number;

  // Family Information
  spouseName?: string;
  spouseOccupation?: string;
  spouseIncome?: number;
  numberOfChildren: number;
  childrenAges?: string;
  numberOfDependents: number;

  // Assistance Requested
  assistanceType: "Food" | "Financial" | "Event Support";
  financialSubcategory?:
    | "School Fees"
    | "House Rent"
    | "Business"
    | "Medical"
    | "Clothes";
  eventSubcategory?: "Wedding" | "Dowry" | "Funeral" | "Other";
  assistanceDescription: string;
  amountRequested?: number;
  urgencyLevel: "Low" | "Medium" | "High" | "Critical";

  // Current Situation
  currentSituation: string;
  previousAssistanceReceived: boolean;
  previousAssistanceDetails?: string;

  // Supporting Documents
  documentsUploaded: string[];

  // Declaration
  declarationSigned: boolean;
  declarationDate: string;

  // Church Use Only
  applicationDate: string;
  receivedBy?: string;
  reviewedBy?: string;
  reviewDate?: string;
  approvalStatus:
    | "Pending"
    | "Under Review"
    | "Approved"
    | "Rejected"
    | "Completed";
  amountApproved?: number;
  approvalConditions?: string;
  disbursementDate?: string;
  disbursementMethod?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  internalNotes?: string;

  // System fields
  createdBy: string;
  lastUpdated: string;
}

const churchDetails = {
  name: "THE SEED OF ABRAHAM MINISTRY",
  address: "P.O. Box 12345, Nairobi, Kenya",
  phone: "+254 700 123 456",
  email: "info@tsoam.org",
  website: "www.tsoam.org",
  logo: "https://cdn.builder.io/api/v1/image/assets%2F0627183da1a04fa4b6c5a1ab36b4780e%2F24ea526264444b8ca043118a01335902",
};

export default function WelfareEnhanced() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [applications, setApplications] = useState<WelfareApplication[]>([]);
  const [selectedApplication, setSelectedApplication] =
    useState<WelfareApplication | null>(null);
  const [showNewApplication, setShowNewApplication] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("applications");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Approval/Rejection Dialog States
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [applicationToProcess, setApplicationToProcess] =
    useState<WelfareApplication | null>(null);
  const [approvalAmount, setApprovalAmount] = useState("");
  const [approvalConditions, setApprovalConditions] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const [newApplication, setNewApplication] = useState<
    Partial<WelfareApplication>
  >({
    // Default values
    gender: "Male",
    maritalStatus: "Single",
    nationality: "Kenyan",
    membershipStatus: "Member",
    currentChurch: "TSOAM",
    yearsInChurch: 1,
    employmentStatus: "Unemployed",
    monthlyIncome: 0,
    numberOfChildren: 0,
    numberOfDependents: 0,
    assistanceType: "Financial",
    urgencyLevel: "Medium",
    currentSituation: "",
    previousAssistanceReceived: false,
    declarationSigned: false,
    documentsUploaded: [],
    approvalStatus: "Pending",
    followUpRequired: false,
  });

  useEffect(() => {
    initializeMockData();
    // Log system activity
    logSystemActivity(
      "Welfare: Module Access",
      "User accessed welfare assistance module",
    );
  }, []);

  const logSystemActivity = (action: string, details: string) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      user: user?.name || "System",
      action,
      details,
      module: "Welfare",
    };
    console.log("System Log:", logEntry);
    // In a real system, this would post to /api/system-logs
  };

  const initializeMockData = () => {
    const mockApplications: WelfareApplication[] = [
      {
        id: "TWF001",
        applicantName: "Mary Wanjiku Kamau",
        idNumber: "12345678",
        dateOfBirth: "1985-03-15",
        gender: "Female",
        maritalStatus: "Married",
        phoneNumber: "+254700123456",
        alternativePhone: "+254710123456",
        email: "mary.wanjiku@email.com",
        physicalAddress: "Kiambu Road, Nairobi",
        postalAddress: "P.O. Box 1234, Nairobi",
        nationality: "Kenyan",
        membershipStatus: "Member",
        membershipNumber: "TSOAM2020001",
        currentChurch: "TSOAM",
        yearsInChurch: 4,
        spiritualLeader: "Pastor James",
        emergencyContactName: "John Kamau",
        emergencyContactRelationship: "Husband",
        emergencyContactPhone: "+254700654321",
        employmentStatus: "Unemployed",
        occupation: "Former Teacher",
        monthlyIncome: 0,
        spouseName: "John Kamau",
        spouseOccupation: "Casual Laborer",
        spouseIncome: 15000,
        numberOfChildren: 3,
        childrenAges: "8, 12, 15",
        numberOfDependents: 5,
        assistanceType: "Financial",
        financialSubcategory: "Medical",
        assistanceDescription:
          "Emergency medical treatment for youngest child with pneumonia",
        amountRequested: 50000,
        urgencyLevel: "Critical",
        currentSituation:
          "My child has been diagnosed with pneumonia and requires immediate medical attention. The hospital bills are beyond our financial capacity.",
        previousAssistanceReceived: false,
        documentsUploaded: [
          "medical_report.pdf",
          "id_copy.pdf",
          "birth_certificate.pdf",
        ],
        declarationSigned: true,
        declarationDate: "2024-01-15",
        applicationDate: "2024-01-15",
        receivedBy: "Grace Mwangi",
        reviewedBy: "Pastor James",
        reviewDate: "2024-01-16",
        approvalStatus: "Approved",
        amountApproved: 45000,
        approvalConditions:
          "Medical receipts must be provided for reimbursement",
        disbursementDate: "2024-01-17",
        disbursementMethod: "M-Pesa",
        followUpRequired: true,
        followUpDate: "2024-01-31",
        internalNotes:
          "Family known to church leadership. Genuine case requiring immediate assistance.",
        createdBy: "mary.wanjiku@email.com",
        lastUpdated: "2024-01-17",
      },
      {
        id: "TWF002",
        applicantName: "Peter Mwangi Njoroge",
        idNumber: "87654321",
        dateOfBirth: "1990-07-22",
        gender: "Male",
        maritalStatus: "Single",
        phoneNumber: "+254700987654",
        email: "peter.mwangi@email.com",
        physicalAddress: "Kiambu, Kenya",
        nationality: "Kenyan",
        membershipStatus: "Regular Attendee",
        currentChurch: "TSOAM",
        yearsInChurch: 2,
        emergencyContactName: "Grace Njoroge",
        emergencyContactRelationship: "Mother",
        emergencyContactPhone: "+254700456789",
        employmentStatus: "Unemployed",
        occupation: "Former Security Guard",
        monthlyIncome: 0,
        numberOfChildren: 0,
        numberOfDependents: 2,
        assistanceType: "Financial",
        financialSubcategory: "House Rent",
        assistanceDescription:
          "Unable to pay rent due to job loss, facing eviction",
        amountRequested: 30000,
        urgencyLevel: "High",
        currentSituation:
          "Lost my job two months ago and unable to pay rent. Landlord has issued an eviction notice.",
        previousAssistanceReceived: true,
        previousAssistanceDetails: "Received food assistance in December 2023",
        documentsUploaded: ["eviction_notice.pdf", "id_copy.pdf"],
        declarationSigned: true,
        declarationDate: "2024-01-20",
        applicationDate: "2024-01-20",
        receivedBy: "Samuel Kiprotich",
        approvalStatus: "Under Review",
        followUpRequired: false,
        createdBy: "peter.mwangi@email.com",
        lastUpdated: "2024-01-20",
      },
    ];

    setApplications(mockApplications);
  };

  const generateApplicationPDF = (application: WelfareApplication) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Header with church logo and details
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(churchDetails.name, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(churchDetails.address, pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 5;
    doc.text(
      `Tel: ${churchDetails.phone} | Email: ${churchDetails.email}`,
      pageWidth / 2,
      yPosition,
      { align: "center" },
    );
    yPosition += 15;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TSOAM WELFARE FORM (TWF)", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 15;

    // Application details header
    doc.setFontSize(12);
    doc.text(`Application ID: ${application.id}`, margin, yPosition);
    doc.text(
      `Date: ${application.applicationDate}`,
      pageWidth - margin - 50,
      yPosition,
    );
    yPosition += 15;

    // Personal Information Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PERSONAL INFORMATION", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const personalInfo = [
      ["Full Name:", application.applicantName],
      ["ID Number:", application.idNumber],
      ["Date of Birth:", application.dateOfBirth],
      ["Gender:", application.gender],
      ["Marital Status:", application.maritalStatus],
      ["Phone Number:", application.phoneNumber],
      ["Alternative Phone:", application.alternativePhone || "N/A"],
      ["Email:", application.email || "N/A"],
      ["Physical Address:", application.physicalAddress],
      ["Nationality:", application.nationality],
    ];

    personalInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 50, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Church Affiliation Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CHURCH AFFILIATION", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const churchInfo = [
      ["Membership Status:", application.membershipStatus],
      ["Membership Number:", application.membershipNumber || "N/A"],
      ["Current Church:", application.currentChurch],
      ["Years in Church:", application.yearsInChurch.toString()],
      ["Spiritual Leader:", application.spiritualLeader || "N/A"],
    ];

    churchInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 50, yPosition);
      yPosition += 6;
    });

    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition += 10;

    // Financial Information Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("FINANCIAL INFORMATION", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const financialInfo = [
      ["Employment Status:", application.employmentStatus],
      ["Occupation:", application.occupation || "N/A"],
      ["Monthly Income:", `KSh ${application.monthlyIncome.toLocaleString()}`],
      ["Spouse Name:", application.spouseName || "N/A"],
      [
        "Spouse Income:",
        `KSh ${application.spouseIncome?.toLocaleString() || "0"}`,
      ],
      ["Number of Children:", application.numberOfChildren.toString()],
      ["Number of Dependents:", application.numberOfDependents.toString()],
    ];

    financialInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 50, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Assistance Requested Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ASSISTANCE REQUESTED", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const assistanceInfo = [
      ["Type:", application.assistanceType],
      [
        "Subcategory:",
        application.financialSubcategory ||
          application.eventSubcategory ||
          "N/A",
      ],
      [
        "Amount Requested:",
        `KSh ${application.amountRequested?.toLocaleString() || "N/A"}`,
      ],
      ["Urgency Level:", application.urgencyLevel],
    ];

    assistanceInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 50, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Description Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTION OF ASSISTANCE", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const descriptionLines = doc.splitTextToSize(
      application.assistanceDescription,
      pageWidth - 2 * margin,
    );
    doc.text(descriptionLines, margin, yPosition);
    yPosition += descriptionLines.length * 5 + 10;

    // Current Situation Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CURRENT SITUATION", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const situationLines = doc.splitTextToSize(
      application.currentSituation,
      pageWidth - 2 * margin,
    );
    doc.text(situationLines, margin, yPosition);
    yPosition += situationLines.length * 5 + 15;

    // Check if we need a new page for approval section
    if (yPosition > 200) {
      doc.addPage();
      yPosition = margin;
    }

    // Church Use Only Section (if reviewed)
    if (application.reviewedBy) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("CHURCH USE ONLY - REVIEW INFORMATION", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const reviewInfo = [
        ["Received By:", application.receivedBy || ""],
        ["Reviewed By:", application.reviewedBy || ""],
        ["Review Date:", application.reviewDate || ""],
        ["Approval Status:", application.approvalStatus],
        [
          "Amount Approved:",
          `KSh ${application.amountApproved?.toLocaleString() || "0"}`,
        ],
        ["Disbursement Date:", application.disbursementDate || "Pending"],
        ["Disbursement Method:", application.disbursementMethod || "N/A"],
      ];

      reviewInfo.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(value, margin + 50, yPosition);
        yPosition += 6;
      });

      if (application.approvalConditions) {
        yPosition += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Approval Conditions:", margin, yPosition);
        yPosition += 6;
        doc.setFont("helvetica", "normal");
        const conditionsLines = doc.splitTextToSize(
          application.approvalConditions,
          pageWidth - 2 * margin,
        );
        doc.text(conditionsLines, margin, yPosition);
        yPosition += conditionsLines.length * 5;
      }

      if (application.internalNotes) {
        yPosition += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Internal Notes:", margin, yPosition);
        yPosition += 6;
        doc.setFont("helvetica", "normal");
        const notesLines = doc.splitTextToSize(
          application.internalNotes,
          pageWidth - 2 * margin,
        );
        doc.text(notesLines, margin, yPosition);
        yPosition += notesLines.length * 5;
      }
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      "This document is an official record of the welfare assistance application.",
      pageWidth / 2,
      footerY,
      { align: "center" },
    );
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} by ${user?.name || "System"}`,
      pageWidth / 2,
      footerY + 5,
      { align: "center" },
    );

    // Save the PDF
    doc.save(`TSOAM_Welfare_Form_${application.id}.pdf`);

    // Log the activity
    logSystemActivity(
      "Welfare: PDF Generated",
      `PDF generated for application ${application.id}`,
    );
  };

  const exportApplicationsToExcel = () => {
    const exportData = applications.map((app) => ({
      "Application ID": app.id,
      "Applicant Name": app.applicantName,
      "ID Number": app.idNumber,
      "Phone Number": app.phoneNumber,
      Email: app.email || "",
      "Assistance Type": app.assistanceType,
      Subcategory: app.financialSubcategory || app.eventSubcategory || "",
      "Amount Requested": app.amountRequested || 0,
      "Urgency Level": app.urgencyLevel,
      "Employment Status": app.employmentStatus,
      "Monthly Income": app.monthlyIncome,
      "Number of Dependents": app.numberOfDependents,
      Status: app.approvalStatus,
      "Application Date": app.applicationDate,
      "Reviewed By": app.reviewedBy || "",
      "Amount Approved": app.amountApproved || 0,
      "Disbursement Date": app.disbursementDate || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Welfare Applications");

    // Add church header
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [churchDetails.name],
        ["WELFARE ASSISTANCE APPLICATIONS REPORT"],
        [`Generated on: ${new Date().toLocaleDateString()}`],
        [],
      ],
      { origin: "A1" },
    );

    XLSX.writeFile(
      wb,
      `TSOAM_Welfare_Applications_${new Date().toISOString().split("T")[0]}.xlsx`,
    );

    // Log the activity
    logSystemActivity(
      "Welfare: Excel Export",
      "Welfare applications exported to Excel",
    );
  };

  const handleMonthlyReport = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthNames = [
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

    // Filter applications for current month
    const monthlyApplications = applications.filter((app) => {
      const appDate = new Date(app.applicationDate);
      return (
        appDate.getMonth() === currentMonth &&
        appDate.getFullYear() === currentYear
      );
    });

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("THE SEED OF ABRAHAM MINISTRY", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.text("WELFARE ASSISTANCE MONTHLY REPORT", 105, 35, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`${monthNames[currentMonth]} ${currentYear}`, 105, 50, {
      align: "center",
    });

    // Summary Statistics
    const totalApplications = monthlyApplications.length;
    const approvedApplications = monthlyApplications.filter(
      (app) => app.approvalStatus === "Approved",
    ).length;
    const pendingApplications = monthlyApplications.filter(
      (app) => app.approvalStatus === "Pending",
    ).length;
    const totalAmountRequested = monthlyApplications.reduce(
      (sum, app) => sum + (app.amountRequested || 0),
      0,
    );
    const totalAmountApproved = monthlyApplications.reduce(
      (sum, app) => sum + (app.amountApproved || 0),
      0,
    );

    doc.setFontSize(12);
    doc.text("MONTHLY SUMMARY:", 20, 70);
    doc.text(`Total Applications: ${totalApplications}`, 20, 85);
    doc.text(`Approved: ${approvedApplications}`, 20, 100);
    doc.text(`Pending: ${pendingApplications}`, 20, 115);
    doc.text(
      `Total Amount Requested: KSH ${totalAmountRequested.toLocaleString()}`,
      20,
      130,
    );
    doc.text(
      `Total Amount Approved: KSH ${totalAmountApproved.toLocaleString()}`,
      20,
      145,
    );

    // Applications Table
    if (monthlyApplications.length > 0) {
      const tableData = monthlyApplications.map((app) => [
        app.id,
        app.applicantName,
        app.assistanceType,
        `KSH ${(app.amountRequested || 0).toLocaleString()}`,
        app.approvalStatus,
        new Date(app.applicationDate).toLocaleDateString(),
      ]);

      (doc as any).autoTable({
        startY: 160,
        head: [
          [
            "Application ID",
            "Applicant Name",
            "Assistance Type",
            "Amount Requested",
            "Status",
            "Date",
          ],
        ],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [128, 0, 32] },
      });
    } else {
      doc.text("No applications submitted this month.", 20, 170);
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(10);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString()}`,
      20,
      doc.internal.pageSize.height - 20,
    );
    doc.text(
      `Page 1 of ${pageCount}`,
      doc.internal.pageSize.width - 40,
      doc.internal.pageSize.height - 20,
    );

    // Save the PDF
    doc.save(
      `TSOAM_Monthly_Welfare_Report_${monthNames[currentMonth]}_${currentYear}.pdf`,
    );

    logSystemActivity(
      "Welfare: Monthly Report Generated",
      `Monthly report generated for ${monthNames[currentMonth]} ${currentYear}`,
    );
  };

  const handleSummaryReport = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("THE SEED OF ABRAHAM MINISTRY", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.text("WELFARE ASSISTANCE SUMMARY REPORT", 105, 35, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 105, 50, {
      align: "center",
    });

    // Overall Statistics
    const totalApplications = applications.length;
    const approvedApplications = applications.filter(
      (app) => app.approvalStatus === "Approved",
    ).length;
    const rejectedApplications = applications.filter(
      (app) => app.approvalStatus === "Rejected",
    ).length;
    const pendingApplications = applications.filter(
      (app) => app.approvalStatus === "Pending",
    ).length;
    const totalAmountRequested = applications.reduce(
      (sum, app) => sum + (app.amountRequested || 0),
      0,
    );
    const totalAmountApproved = applications.reduce(
      (sum, app) => sum + (app.amountApproved || 0),
      0,
    );

    // Assistance type breakdown
    const assistanceTypes = applications.reduce(
      (acc, app) => {
        acc[app.assistanceType] = (acc[app.assistanceType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("OVERALL STATISTICS:", 20, 70);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Applications: ${totalApplications}`, 20, 85);
    doc.text(
      `Approved: ${approvedApplications} (${totalApplications > 0 ? Math.round((approvedApplications / totalApplications) * 100) : 0}%)`,
      20,
      100,
    );
    doc.text(
      `Rejected: ${rejectedApplications} (${totalApplications > 0 ? Math.round((rejectedApplications / totalApplications) * 100) : 0}%)`,
      20,
      115,
    );
    doc.text(
      `Pending: ${pendingApplications} (${totalApplications > 0 ? Math.round((pendingApplications / totalApplications) * 100) : 0}%)`,
      20,
      130,
    );
    doc.text(
      `Total Amount Requested: KSH ${totalAmountRequested.toLocaleString()}`,
      20,
      145,
    );
    doc.text(
      `Total Amount Approved: KSH ${totalAmountApproved.toLocaleString()}`,
      20,
      160,
    );

    // Assistance Types Breakdown
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ASSISTANCE TYPES BREAKDOWN:", 20, 185);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    let yPosition = 200;
    Object.entries(assistanceTypes).forEach(([type, count]) => {
      doc.text(`${type}: ${count} applications`, 20, yPosition);
      yPosition += 15;
    });

    // Recent Applications Table
    const recentApplications = applications.slice(-10); // Last 10 applications
    if (recentApplications.length > 0) {
      const tableData = recentApplications.map((app) => [
        app.id,
        app.applicantName,
        app.assistanceType,
        `KSH ${(app.amountRequested || 0).toLocaleString()}`,
        app.approvalStatus,
        new Date(app.applicationDate).toLocaleDateString(),
      ]);

      (doc as any).autoTable({
        startY: yPosition + 20,
        head: [
          [
            "Application ID",
            "Applicant Name",
            "Assistance Type",
            "Amount",
            "Status",
            "Date",
          ],
        ],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [128, 0, 32] },
        title: "RECENT APPLICATIONS",
      });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(10);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString()}`,
      20,
      doc.internal.pageSize.height - 20,
    );
    doc.text(
      `Page 1 of ${pageCount}`,
      doc.internal.pageSize.width - 40,
      doc.internal.pageSize.height - 20,
    );

    // Save the PDF
    doc.save(
      `TSOAM_Welfare_Summary_Report_${new Date().toISOString().split("T")[0]}.pdf`,
    );

    logSystemActivity(
      "Welfare: Summary Report Generated",
      "Summary report generated and downloaded",
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...fileArray]);

      // Update documents in the application
      const fileNames = fileArray.map((file) => file.name);
      setNewApplication({
        ...newApplication,
        documentsUploaded: [
          ...(newApplication.documentsUploaded || []),
          ...fileNames,
        ],
      });

      // Log the activity
      logSystemActivity(
        "Welfare: Documents Uploaded",
        `${fileArray.length} documents uploaded for new application`,
      );
    }
  };

  const removeUploadedFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);

    const updatedFileNames = updatedFiles.map((file) => file.name);
    setNewApplication({
      ...newApplication,
      documentsUploaded: updatedFileNames,
    });
  };

  const handleSubmitApplication = () => {
    if (
      !newApplication.applicantName ||
      !newApplication.idNumber ||
      !newApplication.phoneNumber
    ) {
      alert(
        "Please fill in all required fields (Name, ID Number, Phone Number)",
      );
      return;
    }

    if (!newApplication.declarationSigned) {
      alert("Please sign the declaration to submit the application");
      return;
    }

    const applicationData: WelfareApplication = {
      ...newApplication,
      id: `TWF${String(applications.length + 1).padStart(3, "0")}`,
      applicationDate: new Date().toISOString().split("T")[0],
      declarationDate: new Date().toISOString().split("T")[0],
      approvalStatus: "Pending",
      createdBy: user?.email || "",
      lastUpdated: new Date().toISOString(),
      followUpRequired: false,
    } as WelfareApplication;

    setApplications([...applications, applicationData]);
    setShowNewApplication(false);

    // Reset form
    setNewApplication({
      gender: "Male",
      maritalStatus: "Single",
      nationality: "Kenyan",
      membershipStatus: "Member",
      currentChurch: "TSOAM",
      yearsInChurch: 1,
      employmentStatus: "Unemployed",
      monthlyIncome: 0,
      numberOfChildren: 0,
      numberOfDependents: 0,
      assistanceType: "Financial",
      urgencyLevel: "Medium",
      currentSituation: "",
      previousAssistanceReceived: false,
      declarationSigned: false,
      documentsUploaded: [],
      approvalStatus: "Pending",
      followUpRequired: false,
    });
    setUploadedFiles([]);

    // Log the activity
    logSystemActivity(
      "Welfare: Application Submitted",
      `New welfare application ${applicationData.id} submitted by ${applicationData.applicantName}`,
    );

    alert("Welfare application submitted successfully!");
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phoneNumber.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || app.approvalStatus === statusFilter;
    const matchesUrgency =
      urgencyFilter === "all" || app.urgencyLevel === urgencyFilter;

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      Pending: "secondary" as const,
      "Under Review": "default" as const,
      Approved: "default" as const,
      Rejected: "destructive" as const,
      Completed: "default" as const,
    };
    return variants[status as keyof typeof variants] || "secondary";
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants = {
      Low: "secondary" as const,
      Medium: "default" as const,
      High: "destructive" as const,
      Critical: "destructive" as const,
    };
    return variants[urgency as keyof typeof variants] || "secondary";
  };

  // Handle welfare application approval
  const handleApproveApplication = (
    applicationId: string,
    amountApproved?: number,
    conditions?: string,
  ) => {
    const application = applications.find((app) => app.id === applicationId);
    if (!application) {
      alert("Application not found!");
      return;
    }

    // Update application status to "Approved" (sent to finance)
    const updatedApplications = applications.map((app) =>
      app.id === applicationId
        ? {
            ...app,
            approvalStatus: "Approved" as const,
            amountApproved: amountApproved || app.amountRequested || 0,
            approvalConditions: conditions,
            reviewedBy: "Welfare Committee",
            reviewDate: new Date().toISOString().split("T")[0],
            lastUpdated: new Date().toISOString(),
          }
        : app,
    );
    setApplications(updatedApplications);

    // Only create financial transaction after approval
    try {
      financialTransactionService.addTransaction({
        date: new Date().toISOString().split("T")[0],
        type: "Expense",
        category: "Welfare",
        subcategory: application.assistanceType,
        description: `Welfare assistance to ${application.applicantName}: ${application.currentSituation?.substring(0, 100)}${application.currentSituation && application.currentSituation.length > 100 ? "..." : ""}`,
        amount: amountApproved || application.amountRequested || 0,
        currency: "KSH",
        paymentMethod: "M-Pesa", // Changed to M-Pesa for direct disbursement
        reference: `WEL-${applicationId}`,
        module: "Welfare",
        moduleReference: applicationId, // This is the welfare application ID for tracing back
        status: "Pending", // Still needs finance approval
        createdBy: "Welfare Department",
        requestedBy: "Welfare Committee",
        requiresApproval: true,
        notes: `Approved welfare application for ${application.applicantName} (ID: ${application.idNumber})${conditions ? ` - Conditions: ${conditions}` : ""}`,
      });

      // Update welfare module data for dashboard sync
      const welfareModuleData = {
        totalRequests: updatedApplications.length,
        approvedRequests: updatedApplications.filter(
          (app) => app.approvalStatus === "Approved",
        ).length,
        pendingRequests: updatedApplications.filter(
          (app) =>
            app.approvalStatus === "Pending" ||
            app.approvalStatus === "Under Review",
        ).length,
        completedRequests: updatedApplications.filter(
          (app) => app.approvalStatus === "Completed",
        ).length,
        rejectedRequests: updatedApplications.filter(
          (app) => app.approvalStatus === "Rejected",
        ).length,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(
        "welfare_module_data",
        JSON.stringify(welfareModuleData),
      );

      // Trigger dashboard refresh
      localStorage.setItem("dashboard_refresh", Date.now().toString());

      alert(
        `✅ Application Approved!\n\n` +
          `💰 Amount: KSh ${(amountApproved || application.amountRequested || 0).toLocaleString()}\n` +
          `👤 Beneficiary: ${application.applicantName}\n` +
          `📋 This has been sent to Finance for final approval and disbursement.`,
      );
    } catch (error) {
      console.error("Error creating financial transaction:", error);
      alert(
        "Application approved but failed to create financial transaction. Please contact system administrator.",
      );
    }
  };

  // Handle welfare application rejection
  const handleRejectApplication = (applicationId: string, reason: string) => {
    const application = applications.find((app) => app.id === applicationId);
    if (!application) {
      alert("Application not found!");
      return;
    }

    // Update application status (no financial transaction created)
    const updatedApplications = applications.map((app) =>
      app.id === applicationId
        ? {
            ...app,
            approvalStatus: "Rejected" as const,
            approvalConditions: `Rejection reason: ${reason}`,
            lastUpdated: new Date().toISOString(),
          }
        : app,
    );
    setApplications(updatedApplications);

    // Update welfare module data for dashboard sync
    const welfareModuleData = {
      totalRequests: updatedApplications.length,
      approvedRequests: updatedApplications.filter(
        (app) => app.approvalStatus === "Approved",
      ).length,
      pendingRequests: updatedApplications.filter(
        (app) =>
          app.approvalStatus === "Pending" ||
          app.approvalStatus === "Under Review",
      ).length,
      completedRequests: updatedApplications.filter(
        (app) => app.approvalStatus === "Completed",
      ).length,
      rejectedRequests: updatedApplications.filter(
        (app) => app.approvalStatus === "Rejected",
      ).length,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(
      "welfare_module_data",
      JSON.stringify(welfareModuleData),
    );

    // Trigger dashboard refresh
    localStorage.setItem("dashboard_refresh", Date.now().toString());

    alert(
      `❌ Application Rejected\n\n` +
        `👤 Applicant: ${application.applicantName}\n` +
        `📝 Reason: ${reason}\n` +
        `💡 No financial transaction was created.`,
    );
  };

  // Open approval dialog
  const openApprovalDialog = (application: WelfareApplication) => {
    setApplicationToProcess(application);
    setApprovalAmount(application.amountRequested?.toString() || "");
    setApprovalConditions("");
    setShowApprovalDialog(true);
  };

  // Open rejection dialog
  const openRejectionDialog = (application: WelfareApplication) => {
    setApplicationToProcess(application);
    setRejectionReason("");
    setShowRejectionDialog(true);
  };

  // Process approval from dialog
  const processApproval = () => {
    if (!applicationToProcess || !approvalAmount) return;

    handleApproveApplication(
      applicationToProcess.id,
      Number(approvalAmount),
      approvalConditions || undefined,
    );

    // Reset and close dialog
    setShowApprovalDialog(false);
    setApplicationToProcess(null);
    setApprovalAmount("");
    setApprovalConditions("");
  };

  // Process rejection from dialog
  const processRejection = () => {
    if (!applicationToProcess || !rejectionReason.trim()) return;

    handleRejectApplication(applicationToProcess.id, rejectionReason);

    // Reset and close dialog
    setShowRejectionDialog(false);
    setApplicationToProcess(null);
    setRejectionReason("");
  };

  // Function to mark welfare application as completed (called when finance approves)
  const markApplicationCompleted = (
    welfareApplicationId: string,
    disbursementDetails?: any,
  ) => {
    console.log(
      "🎉 Finance approved welfare transaction, marking application as completed:",
      welfareApplicationId,
    );

    // Use functional update to ensure we have the latest state
    setApplications((currentApplications) => {
      console.log("Current applications count:", currentApplications.length);

      const applicationToComplete = currentApplications.find(
        (app) => app.id === welfareApplicationId,
      );
      if (!applicationToComplete) {
        console.warn("❌ Welfare application not found:", welfareApplicationId);
        return currentApplications; // Return current state unchanged
      }

      const updatedApplications = currentApplications.map((app) =>
        app.id === welfareApplicationId
          ? {
              ...app,
              approvalStatus: "Completed" as const,
              disbursementDate: new Date().toISOString().split("T")[0],
              disbursementMethod: disbursementDetails?.method || "M-Pesa",
              lastUpdated: new Date().toISOString(),
            }
          : app,
      );

      console.log("✅ Updated applications:", {
        total: updatedApplications.length,
        completed: updatedApplications.filter(
          (app) => app.approvalStatus === "Completed",
        ).length,
        applicationId: welfareApplicationId,
      });

      return updatedApplications;
    });

    // Show notification that application was completed by finance
    if (disbursementDetails) {
      setTimeout(() => {
        alert(
          `🎉 Finance Approval Received!\n\n` +
            `💰 Amount: KSh ${disbursementDetails.amount?.toLocaleString()}\n` +
            `✅ Status: Completed & Ready for Disbursement\n` +
            `📅 Approved: ${new Date().toLocaleDateString()}`,
        );
      }, 500);
    }
  };

  // Update welfare module data for dashboard sync whenever applications change
  useEffect(() => {
    const welfareModuleData = {
      totalRequests: applications.length,
      approvedRequests: applications.filter(
        (app) => app.approvalStatus === "Approved",
      ).length,
      pendingRequests: applications.filter(
        (app) =>
          app.approvalStatus === "Pending" ||
          app.approvalStatus === "Under Review",
      ).length,
      completedRequests: applications.filter(
        (app) => app.approvalStatus === "Completed",
      ).length,
      rejectedRequests: applications.filter(
        (app) => app.approvalStatus === "Rejected",
      ).length,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(
      "welfare_module_data",
      JSON.stringify(welfareModuleData),
    );

    // Trigger dashboard refresh
    localStorage.setItem("dashboard_refresh", Date.now().toString());
  }, [applications]);

  // Listen for welfare completion and rejection events from Finance module
  useEffect(() => {
    const handleWelfareEvents = (event: StorageEvent) => {
      // Handle completion events
      if (event.key === "welfare_completion_event" && event.newValue) {
        try {
          const completionData = JSON.parse(event.newValue);
          console.log("🎉 Received welfare completion event:", completionData);
          markApplicationCompleted(
            completionData.welfareApplicationId,
            completionData.disbursementDetails,
          );

          // Clear the event after processing
          localStorage.removeItem("welfare_completion_event");
        } catch (error) {
          console.error("Error processing welfare completion event:", error);
        }
      }

      // Handle rejection events
      if (event.key === "welfare_rejection_event" && event.newValue) {
        try {
          const rejectionData = JSON.parse(event.newValue);
          console.log(
            "❌ Received welfare rejection from Finance:",
            rejectionData,
          );

          // Find and update the rejected application
          setApplications((currentApplications) => {
            return currentApplications.map((app) =>
              app.id === rejectionData.welfareApplicationId
                ? {
                    ...app,
                    approvalStatus: "Rejected" as const,
                    approvalConditions: `Finance Rejection: ${rejectionData.rejectionReason}`,
                    lastUpdated: new Date().toISOString(),
                  }
                : app,
            );
          });

          // Show rejection notification
          setTimeout(() => {
            alert(
              `❌ Welfare Application Rejected by Finance!\n\n` +
                `📋 Application ID: ${rejectionData.welfareApplicationId}\n` +
                `💰 Amount: KSh ${rejectionData.amount?.toLocaleString()}\n` +
                `👤 Rejected by: ${rejectionData.rejectedBy}\n` +
                `📝 Reason: ${rejectionData.rejectionReason}\n` +
                `📅 Date: ${new Date(rejectionData.rejectedDate).toLocaleDateString()}\n\n` +
                `⚠️ The application status has been updated to rejected.`,
            );
          }, 500);

          // Clear the event after processing
          localStorage.removeItem("welfare_rejection_event");
        } catch (error) {
          console.error("Error processing welfare rejection event:", error);
        }
      }
    };

    // Listen for localStorage changes
    window.addEventListener("storage", handleWelfareEvents);

    // Also check for events when the component mounts (in case we missed them)
    const checkForPendingEvents = () => {
      // Check for pending completions
      const pendingCompletion = localStorage.getItem(
        "welfare_completion_event",
      );
      if (pendingCompletion) {
        try {
          const completionData = JSON.parse(pendingCompletion);
          console.log(
            "🎉 Processing pending welfare completion:",
            completionData,
          );
          markApplicationCompleted(
            completionData.welfareApplicationId,
            completionData.disbursementDetails,
          );
          localStorage.removeItem("welfare_completion_event");
        } catch (error) {
          console.error("Error processing pending completion:", error);
        }
      }

      // Check for pending rejections
      const pendingRejection = localStorage.getItem("welfare_rejection_event");
      if (pendingRejection) {
        try {
          const rejectionData = JSON.parse(pendingRejection);
          console.log(
            "❌ Processing pending welfare rejection:",
            rejectionData,
          );

          // Update the rejected application
          setApplications((currentApplications) => {
            return currentApplications.map((app) =>
              app.id === rejectionData.welfareApplicationId
                ? {
                    ...app,
                    approvalStatus: "Rejected" as const,
                    approvalConditions: `Finance Rejection: ${rejectionData.rejectionReason}`,
                    lastUpdated: new Date().toISOString(),
                  }
                : app,
            );
          });

          setTimeout(() => {
            alert(
              `❌ Welfare Application Rejected by Finance!\n\n` +
                `📋 Application ID: ${rejectionData.welfareApplicationId}\n` +
                `💰 Amount: KSh ${rejectionData.amount?.toLocaleString()}\n` +
                `👤 Rejected by: ${rejectionData.rejectedBy}\n` +
                `📝 Reason: ${rejectionData.rejectionReason}\n` +
                `📅 Date: ${new Date(rejectionData.rejectedDate).toLocaleDateString()}\n\n` +
                `⚠️ The application status has been updated to rejected.`,
            );
          }, 500);

          localStorage.removeItem("welfare_rejection_event");
        } catch (error) {
          console.error("Error processing pending rejection:", error);
        }
      }
    };

    // Check immediately and then periodically
    checkForPendingEvents();
    const interval = setInterval(checkForPendingEvents, 1000);

    return () => {
      window.removeEventListener("storage", handleWelfareEvents);
      clearInterval(interval);
    };
  }, [applications]);

  return (
    <Layout>
      <PageHeader
        title="Welfare Assistance Management"
        description="Manage welfare applications and assistance programs based on TSOAM Welfare Form (TWF)"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={exportApplicationsToExcel}
              variant="outline"
              className="hidden sm:flex"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => setShowNewApplication(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Applications
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
              <p className="text-xs text-muted-foreground">
                +
                {
                  applications.filter(
                    (app) =>
                      new Date(app.applicationDate) >
                      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  ).length
                }{" "}
                this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  applications.filter(
                    (app) =>
                      app.approvalStatus === "Pending" ||
                      app.approvalStatus === "Under Review",
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Amount Approved
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSh{" "}
                {applications
                  .filter((app) => app.amountApproved)
                  .reduce((sum, app) => sum + (app.amountApproved || 0), 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Critical Cases
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  applications.filter((app) => app.urgencyLevel === "Critical")
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={urgencyFilter}
                    onValueChange={setUrgencyFilter}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Urgency</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Applications Table */}
            <Card>
              <CardHeader>
                <CardTitle>Welfare Applications (TWF)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Application ID</TableHead>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Assistance Type</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell className="font-medium">
                            {application.id}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {application.applicantName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {application.phoneNumber}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{application.assistanceType}</p>
                              {(application.financialSubcategory ||
                                application.eventSubcategory) && (
                                <p className="text-sm text-muted-foreground">
                                  {application.financialSubcategory ||
                                    application.eventSubcategory}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getUrgencyBadge(
                                application.urgencyLevel,
                              )}
                            >
                              {application.urgencyLevel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            KSh{" "}
                            {application.amountRequested?.toLocaleString() ||
                              "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadge(
                                application.approvalStatus,
                              )}
                            >
                              {application.approvalStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>{application.applicationDate}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setShowViewDialog(true);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  generateApplicationPDF(application)
                                }
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              {/* Action buttons based on application status */}
                              {application.approvalStatus === "Pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() =>
                                      openApprovalDialog(application)
                                    }
                                    title="Approve & Send to Finance"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      openRejectionDialog(application)
                                    }
                                    title="Reject Application"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}

                              {application.approvalStatus ===
                                "Under Review" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() =>
                                      openApprovalDialog(application)
                                    }
                                    title="Approve & Send to Finance"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      openRejectionDialog(application)
                                    }
                                    title="Reject Application"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}

                              {application.approvalStatus === "Approved" && (
                                <div className="flex flex-col gap-1">
                                  <Badge
                                    variant="outline"
                                    className="text-blue-600"
                                  >
                                    ✓ Welfare Approved
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-orange-600 text-xs"
                                  >
                                    Awaiting Finance
                                  </Badge>
                                </div>
                              )}

                              {application.approvalStatus === "Completed" && (
                                <div className="flex flex-col gap-1">
                                  <Badge
                                    variant="default"
                                    className="bg-green-600"
                                  >
                                    ✓ Completed
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 text-xs"
                                  >
                                    Finance Approved
                                  </Badge>
                                  {application.disbursementDate && (
                                    <span className="text-xs text-muted-foreground">
                                      Disbursed:{" "}
                                      {new Date(
                                        application.disbursementDate,
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              )}

                              {application.approvalStatus === "Rejected" && (
                                <Badge variant="destructive">✗ Rejected</Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={exportApplicationsToExcel}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Applications
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleMonthlyReport}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Monthly Report
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleSummaryReport}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Summary Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* New Application Dialog */}
        <Dialog open={showNewApplication} onOpenChange={setShowNewApplication}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                TSOAM Welfare Form (TWF) - New Application
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="applicantName">Full Name *</Label>
                    <Input
                      id="applicantName"
                      value={newApplication.applicantName || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          applicantName: e.target.value,
                        })
                      }
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="idNumber">ID Number *</Label>
                    <Input
                      id="idNumber"
                      value={newApplication.idNumber || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          idNumber: e.target.value,
                        })
                      }
                      placeholder="Enter ID number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={newApplication.dateOfBirth || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={newApplication.gender}
                      onValueChange={(value) =>
                        setNewApplication({
                          ...newApplication,
                          gender: value as any,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select
                      value={newApplication.maritalStatus}
                      onValueChange={(value) =>
                        setNewApplication({
                          ...newApplication,
                          maritalStatus: value as any,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={newApplication.nationality || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          nationality: e.target.value,
                        })
                      }
                      placeholder="Enter nationality"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={newApplication.phoneNumber || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder="+254 700 123 456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="alternativePhone">Alternative Phone</Label>
                    <Input
                      id="alternativePhone"
                      value={newApplication.alternativePhone || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          alternativePhone: e.target.value,
                        })
                      }
                      placeholder="+254 710 123 456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newApplication.email || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          email: e.target.value,
                        })
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="physicalAddress">Physical Address *</Label>
                    <Textarea
                      id="physicalAddress"
                      value={newApplication.physicalAddress || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          physicalAddress: e.target.value,
                        })
                      }
                      placeholder="Enter physical address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalAddress">Postal Address</Label>
                    <Textarea
                      id="postalAddress"
                      value={newApplication.postalAddress || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          postalAddress: e.target.value,
                        })
                      }
                      placeholder="P.O. Box 1234, City"
                    />
                  </div>
                </div>
              </div>

              {/* Church Affiliation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Church Affiliation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="membershipStatus">Membership Status</Label>
                    <Select
                      value={newApplication.membershipStatus}
                      onValueChange={(value) =>
                        setNewApplication({
                          ...newApplication,
                          membershipStatus: value as any,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Member">Member</SelectItem>
                        <SelectItem value="Regular Attendee">
                          Regular Attendee
                        </SelectItem>
                        <SelectItem value="Visitor">Visitor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="membershipNumber">Membership Number</Label>
                    <Input
                      id="membershipNumber"
                      value={newApplication.membershipNumber || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          membershipNumber: e.target.value,
                        })
                      }
                      placeholder="TSOAM2024001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentChurch">Current Church</Label>
                    <Input
                      id="currentChurch"
                      value={newApplication.currentChurch || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          currentChurch: e.target.value,
                        })
                      }
                      placeholder="TSOAM"
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearsInChurch">Years in Church</Label>
                    <Input
                      id="yearsInChurch"
                      type="number"
                      value={newApplication.yearsInChurch || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          yearsInChurch: Number(e.target.value),
                        })
                      }
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="spiritualLeader">Spiritual Leader</Label>
                    <Input
                      id="spiritualLeader"
                      value={newApplication.spiritualLeader || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          spiritualLeader: e.target.value,
                        })
                      }
                      placeholder="Pastor Name"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Contact Name *</Label>
                    <Input
                      id="emergencyContactName"
                      value={newApplication.emergencyContactName || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          emergencyContactName: e.target.value,
                        })
                      }
                      placeholder="Contact person name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelationship">
                      Relationship *
                    </Label>
                    <Input
                      id="emergencyContactRelationship"
                      value={newApplication.emergencyContactRelationship || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          emergencyContactRelationship: e.target.value,
                        })
                      }
                      placeholder="Spouse, Parent, Sibling"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone">
                      Contact Phone *
                    </Label>
                    <Input
                      id="emergencyContactPhone"
                      value={newApplication.emergencyContactPhone || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          emergencyContactPhone: e.target.value,
                        })
                      }
                      placeholder="+254 700 123 456"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Financial Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="employmentStatus">
                      Employment Status *
                    </Label>
                    <Select
                      value={newApplication.employmentStatus}
                      onValueChange={(value) =>
                        setNewApplication({
                          ...newApplication,
                          employmentStatus: value as any,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employed">Employed</SelectItem>
                        <SelectItem value="Self-employed">
                          Self-employed
                        </SelectItem>
                        <SelectItem value="Unemployed">Unemployed</SelectItem>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={newApplication.occupation || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          occupation: e.target.value,
                        })
                      }
                      placeholder="Job title or profession"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employer">Employer</Label>
                    <Input
                      id="employer"
                      value={newApplication.employer || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          employer: e.target.value,
                        })
                      }
                      placeholder="Employer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyIncome">Monthly Income (KSh)</Label>
                    <Input
                      id="monthlyIncome"
                      type="number"
                      value={newApplication.monthlyIncome || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          monthlyIncome: Number(e.target.value),
                        })
                      }
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00"
                        ) {
                          setNewApplication({
                            ...newApplication,
                            monthlyIncome: "" as any,
                          });
                        }
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="otherIncomeSource">
                      Other Income Source
                    </Label>
                    <Input
                      id="otherIncomeSource"
                      value={newApplication.otherIncomeSource || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          otherIncomeSource: e.target.value,
                        })
                      }
                      placeholder="Additional income source"
                    />
                  </div>
                  <div>
                    <Label htmlFor="otherIncomeAmount">
                      Other Income Amount (KSh)
                    </Label>
                    <Input
                      id="otherIncomeAmount"
                      type="number"
                      value={newApplication.otherIncomeAmount || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          otherIncomeAmount: Number(e.target.value),
                        })
                      }
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00"
                        ) {
                          setNewApplication({
                            ...newApplication,
                            otherIncomeAmount: "" as any,
                          });
                        }
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Family Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Family Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="spouseName">Spouse Name</Label>
                    <Input
                      id="spouseName"
                      value={newApplication.spouseName || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          spouseName: e.target.value,
                        })
                      }
                      placeholder="Spouse full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="spouseOccupation">Spouse Occupation</Label>
                    <Input
                      id="spouseOccupation"
                      value={newApplication.spouseOccupation || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          spouseOccupation: e.target.value,
                        })
                      }
                      placeholder="Spouse job"
                    />
                  </div>
                  <div>
                    <Label htmlFor="spouseIncome">Spouse Income (KSh)</Label>
                    <Input
                      id="spouseIncome"
                      type="number"
                      value={newApplication.spouseIncome || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          spouseIncome: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberOfChildren">Number of Children</Label>
                    <Input
                      id="numberOfChildren"
                      type="number"
                      value={newApplication.numberOfChildren || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          numberOfChildren: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="childrenAges">Children Ages</Label>
                    <Input
                      id="childrenAges"
                      value={newApplication.childrenAges || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          childrenAges: e.target.value,
                        })
                      }
                      placeholder="e.g., 5, 8, 12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberOfDependents">
                      Number of Dependents
                    </Label>
                    <Input
                      id="numberOfDependents"
                      type="number"
                      value={newApplication.numberOfDependents || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          numberOfDependents: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Assistance Requested */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Assistance Requested
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="assistanceType">Type of Assistance *</Label>
                    <Select
                      value={newApplication.assistanceType}
                      onValueChange={(value) =>
                        setNewApplication({
                          ...newApplication,
                          assistanceType: value as any,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food">Food</SelectItem>
                        <SelectItem value="Financial">Financial</SelectItem>
                        <SelectItem value="Event Support">
                          Event Support
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newApplication.assistanceType === "Financial" && (
                    <div>
                      <Label htmlFor="financialSubcategory">
                        Financial Category
                      </Label>
                      <Select
                        value={newApplication.financialSubcategory}
                        onValueChange={(value) =>
                          setNewApplication({
                            ...newApplication,
                            financialSubcategory: value as any,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="School Fees">
                            School Fees
                          </SelectItem>
                          <SelectItem value="House Rent">House Rent</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Medical">Medical</SelectItem>
                          <SelectItem value="Clothes">Clothes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {newApplication.assistanceType === "Event Support" && (
                    <div>
                      <Label htmlFor="eventSubcategory">Event Category</Label>
                      <Select
                        value={newApplication.eventSubcategory}
                        onValueChange={(value) =>
                          setNewApplication({
                            ...newApplication,
                            eventSubcategory: value as any,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Wedding">Wedding</SelectItem>
                          <SelectItem value="Dowry">Dowry</SelectItem>
                          <SelectItem value="Funeral">Funeral</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="urgencyLevel">Urgency Level *</Label>
                    <Select
                      value={newApplication.urgencyLevel}
                      onValueChange={(value) =>
                        setNewApplication({
                          ...newApplication,
                          urgencyLevel: value as any,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amountRequested">
                      Amount Requested (KSh)
                    </Label>
                    <Input
                      id="amountRequested"
                      type="number"
                      value={newApplication.amountRequested || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          amountRequested: Number(e.target.value),
                        })
                      }
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00"
                        ) {
                          setNewApplication({
                            ...newApplication,
                            amountRequested: "" as any,
                          });
                        }
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="assistanceDescription">
                    Description of Assistance Needed *
                  </Label>
                  <Textarea
                    id="assistanceDescription"
                    value={newApplication.assistanceDescription || ""}
                    onChange={(e) =>
                      setNewApplication({
                        ...newApplication,
                        assistanceDescription: e.target.value,
                      })
                    }
                    placeholder="Please provide detailed description of assistance needed"
                    rows={3}
                  />
                </div>
              </div>

              {/* Current Situation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Current Situation
                </h3>
                <div>
                  <Label htmlFor="currentSituation">
                    Describe Your Current Situation *
                  </Label>
                  <Textarea
                    id="currentSituation"
                    value={newApplication.currentSituation || ""}
                    onChange={(e) =>
                      setNewApplication({
                        ...newApplication,
                        currentSituation: e.target.value,
                      })
                    }
                    placeholder="Please describe your current situation and challenges in detail"
                    rows={4}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="previousAssistanceReceived"
                    checked={newApplication.previousAssistanceReceived}
                    onCheckedChange={(checked) =>
                      setNewApplication({
                        ...newApplication,
                        previousAssistanceReceived: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="previousAssistanceReceived">
                    I have received assistance from TSOAM before
                  </Label>
                </div>
                {newApplication.previousAssistanceReceived && (
                  <div>
                    <Label htmlFor="previousAssistanceDetails">
                      Previous Assistance Details
                    </Label>
                    <Textarea
                      id="previousAssistanceDetails"
                      value={newApplication.previousAssistanceDetails || ""}
                      onChange={(e) =>
                        setNewApplication({
                          ...newApplication,
                          previousAssistanceDetails: e.target.value,
                        })
                      }
                      placeholder="Please describe previous assistance received"
                      rows={2}
                    />
                  </div>
                )}
              </div>

              {/* Supporting Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Supporting Documents
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Upload Supporting Documents</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Choose Files
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Accepted formats: PDF, JPG, PNG, DOCX (Max 5MB each)
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Files:</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          >
                            <div className="flex items-center gap-2">
                              <File className="h-4 w-4" />
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeUploadedFile(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Declaration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Declaration
                </h3>
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    I declare that the information provided in this application
                    is true and accurate to the best of my knowledge. I
                    understand that providing false information may result in
                    the rejection of my application. I consent to TSOAM
                    verifying the information provided and conducting any
                    necessary follow-up investigations.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="declarationSigned"
                      checked={newApplication.declarationSigned}
                      onCheckedChange={(checked) =>
                        setNewApplication({
                          ...newApplication,
                          declarationSigned: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="declarationSigned" className="font-medium">
                      I agree to the declaration above and certify that all
                      information is accurate *
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowNewApplication(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitApplication}
                  disabled={!newApplication.declarationSigned}
                >
                  Submit Application
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Application Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Application Details - {selectedApplication?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedApplication.applicantName}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedApplication.assistanceType} Request
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={getStatusBadge(
                        selectedApplication.approvalStatus,
                      )}
                    >
                      {selectedApplication.approvalStatus}
                    </Badge>
                    <Badge
                      variant={getUrgencyBadge(
                        selectedApplication.urgencyLevel,
                      )}
                    >
                      {selectedApplication.urgencyLevel}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>ID Number:</strong>{" "}
                        {selectedApplication.idNumber}
                      </p>
                      <p>
                        <strong>Date of Birth:</strong>{" "}
                        {selectedApplication.dateOfBirth}
                      </p>
                      <p>
                        <strong>Gender:</strong> {selectedApplication.gender}
                      </p>
                      <p>
                        <strong>Phone:</strong>{" "}
                        {selectedApplication.phoneNumber}
                      </p>
                      <p>
                        <strong>Email:</strong>{" "}
                        {selectedApplication.email || "N/A"}
                      </p>
                      <p>
                        <strong>Address:</strong>{" "}
                        {selectedApplication.physicalAddress}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Request Details</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Assistance Type:</strong>{" "}
                        {selectedApplication.assistanceType}
                      </p>
                      <p>
                        <strong>Subcategory:</strong>{" "}
                        {selectedApplication.financialSubcategory ||
                          selectedApplication.eventSubcategory ||
                          "N/A"}
                      </p>
                      <p>
                        <strong>Amount Requested:</strong> KSh{" "}
                        {selectedApplication.amountRequested?.toLocaleString() ||
                          "N/A"}
                      </p>
                      <p>
                        <strong>Employment:</strong>{" "}
                        {selectedApplication.employmentStatus}
                      </p>
                      <p>
                        <strong>Monthly Income:</strong> KSh{" "}
                        {selectedApplication.monthlyIncome.toLocaleString()}
                      </p>
                      <p>
                        <strong>Dependents:</strong>{" "}
                        {selectedApplication.numberOfDependents}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">
                    Description of Assistance
                  </h4>
                  <p className="text-sm">
                    {selectedApplication.assistanceDescription}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Current Situation</h4>
                  <p className="text-sm">
                    {selectedApplication.currentSituation}
                  </p>
                </div>

                {selectedApplication.documentsUploaded &&
                  selectedApplication.documentsUploaded.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">
                        Supporting Documents
                      </h4>
                      <div className="space-y-1">
                        {selectedApplication.documentsUploaded.map(
                          (doc, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm"
                            >
                              <File className="h-4 w-4" />
                              {doc}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {selectedApplication.reviewedBy && (
                  <div>
                    <h4 className="font-semibold mb-2">Review Information</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Reviewed By:</strong>{" "}
                        {selectedApplication.reviewedBy}
                      </p>
                      <p>
                        <strong>Review Date:</strong>{" "}
                        {selectedApplication.reviewDate}
                      </p>
                      <p>
                        <strong>Amount Approved:</strong> KSh{" "}
                        {selectedApplication.amountApproved?.toLocaleString() ||
                          "0"}
                      </p>
                      <p>
                        <strong>Disbursement Date:</strong>{" "}
                        {selectedApplication.disbursementDate || "Pending"}
                      </p>
                      {selectedApplication.approvalConditions && (
                        <p>
                          <strong>Conditions:</strong>{" "}
                          {selectedApplication.approvalConditions}
                        </p>
                      )}
                      {selectedApplication.internalNotes && (
                        <p>
                          <strong>Notes:</strong>{" "}
                          {selectedApplication.internalNotes}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => generateApplicationPDF(selectedApplication)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowViewDialog(false)}
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-green-600">
                Approve Welfare Application
              </DialogTitle>
            </DialogHeader>
            {applicationToProcess && (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">
                    Applicant: {applicationToProcess.applicantName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ID: {applicationToProcess.idNumber}
                  </p>
                </div>

                <div>
                  <Label htmlFor="requested-amount">Requested Amount</Label>
                  <p className="text-lg font-bold text-blue-600">
                    KSh {applicationToProcess.amountRequested?.toLocaleString()}
                  </p>
                </div>

                <div>
                  <Label htmlFor="approval-amount">Approved Amount *</Label>
                  <Input
                    id="approval-amount"
                    type="number"
                    value={approvalAmount}
                    onChange={(e) => setApprovalAmount(e.target.value)}
                    placeholder="Enter approved amount"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="approval-conditions">
                    Conditions/Notes (Optional)
                  </Label>
                  <Textarea
                    id="approval-conditions"
                    value={approvalConditions}
                    onChange={(e) => setApprovalConditions(e.target.value)}
                    placeholder="Any conditions or special instructions..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowApprovalDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={processApproval}
                    disabled={!approvalAmount || isNaN(Number(approvalAmount))}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve & Send to Finance
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog
          open={showRejectionDialog}
          onOpenChange={setShowRejectionDialog}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">
                Reject Welfare Application
              </DialogTitle>
            </DialogHeader>
            {applicationToProcess && (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">
                    Applicant: {applicationToProcess.applicantName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ID: {applicationToProcess.idNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Requested: KSh{" "}
                    {applicationToProcess.amountRequested?.toLocaleString()}
                  </p>
                </div>

                <div>
                  <Label htmlFor="rejection-reason">
                    Reason for Rejection *
                  </Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejecting this application..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectionDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={processRejection}
                    disabled={!rejectionReason.trim()}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
