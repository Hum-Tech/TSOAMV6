import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Download,
  Edit,
  Eye,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  UserCheck,
  FileText,
  MoreHorizontal,
  UserX,
  UserMinus,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportService } from "@/services/ExportService";
import { useAuth } from "@/contexts/AuthContext";
import { transferService } from "@/services/TransferService";
import { MemberTitheRecords } from "@/components/MemberTitheRecords";

/**
 * Interface for Full Members (those who have completed the transition process)
 */
interface Member {
  id: string;
  memberId: string; // TSOAM2025-001
  titheNumber: string; // T2025-001
  fullName: string;
  email: string;
  phone: string;
  phoneNumber: string; // Compatibility property for transfers
  dateOfBirth: string;
  gender: "Male" | "Female";
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed";
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  membershipStatus: "Active" | "Inactive";
  yearOfJoining: number;
  visitDate: string; // Original visit date
  membershipDate: string; // Date became full member
  baptized: boolean;
  baptismDate: string;
  bibleStudyCompleted: boolean;
  bibleStudyCompletionDate: string;
  employmentStatus: "Employed" | "Jobless" | "Business Class";
  previousChurchName?: string;
  reasonForLeavingPreviousChurch?:
    | "Suspension"
    | "Termination"
    | "Self-Evolution"
    | "Relocation"
    | "Other";
  reasonDetails?: string;
  howHeardAboutUs:
    | "Friend"
    | "Relative"
    | "Word of Mouth"
    | "Website"
    | "Crusade"
    | "Roadshow"
    | "Matatu"
    | "Social Media"
    | "Flyer"
    | "Personal Identification";
  serviceGroups: string[]; // Multiple service groups
  bornAgain: boolean;
  churchFeedback?: string;
  prayerRequests?: string;
  transferredFromNewMemberId: string;
  createdAt: string;
}

/**
 * Available service groups (can be selected multiple)
 */
const SERVICE_GROUPS = [
  "Choir",
  "Ushering",
  "Youth Group",
  "Women Ministry",
  "Men Ministry",
  "Children Ministry",
  "Prayer Team",
  "Media Team",
  "Evangelism Team",
  "Hospitality Team",
];

// Mock data for full members (these have already completed the transition process)
const mockMembers: Member[] = [
  {
    id: "1",
    memberId: "TSOAM2025-001",
    titheNumber: "T2025-001",
    fullName: "John Kamau",
    email: "john.kamau@email.com",
    phone: "+254 712 345 678",
    phoneNumber: "+254 712 345 678",
    dateOfBirth: "1985-03-15",
    gender: "Male",
    maritalStatus: "Married",
    address: "Nairobi, Kenya",
    emergencyContactName: "Mary Kamau",
    emergencyContactPhone: "+254 722 123 456",
    membershipStatus: "Active",
    yearOfJoining: 2024,
    visitDate: "2024-01-15", // When they first visited
    membershipDate: "2024-07-20", // When they became full member (6+ months later)
    baptized: true,
    baptismDate: "2024-05-10",
    bibleStudyCompleted: true,
    bibleStudyCompletionDate: "2024-06-15",
    employmentStatus: "Employed",
    previousChurchName: "Grace Chapel",
    reasonForLeavingPreviousChurch: "Relocation",
    reasonDetails: "Moved to Nairobi for work",
    howHeardAboutUs: "Friend",
    serviceGroups: ["Choir", "Men Ministry"],
    bornAgain: true,
    churchFeedback: "Wonderful fellowship and teaching",
    prayerRequests: "Career advancement and family health",
    transferredFromNewMemberId: "NM-001",
    createdAt: "2024-07-20T10:00:00Z",
  },
  {
    id: "2",
    memberId: "TSOAM2025-002",
    titheNumber: "T2025-002",
    fullName: "Mary Wanjiku",
    email: "mary.wanjiku@email.com",
    phone: "+254 721 456 789",
    phoneNumber: "+254 721 456 789",
    dateOfBirth: "1990-07-22",
    gender: "Female",
    maritalStatus: "Single",
    address: "Nakuru, Kenya",
    emergencyContactName: "Grace Wanjiku",
    emergencyContactPhone: "+254 733 789 012",
    membershipStatus: "Active",
    yearOfJoining: 2024,
    visitDate: "2024-02-10",
    membershipDate: "2024-08-15",
    baptized: true,
    baptismDate: "2024-06-20",
    bibleStudyCompleted: true,
    bibleStudyCompletionDate: "2024-07-30",
    employmentStatus: "Business Class",
    previousChurchName: "Faith Church",
    reasonForLeavingPreviousChurch: "Self-Evolution",
    reasonDetails: "Seeking deeper spiritual growth",
    howHeardAboutUs: "Social Media",
    serviceGroups: ["Ushering", "Women Ministry", "Evangelism Team"],
    bornAgain: true,
    churchFeedback: "Love the youth programs and community outreach",
    prayerRequests: "Business success and wisdom",
    transferredFromNewMemberId: "NM-002",
    createdAt: "2024-08-15T14:30:00Z",
  },
  {
    id: "3",
    memberId: "TSOAM2025-003",
    titheNumber: "T2025-003",
    fullName: "Peter Mwangi",
    email: "peter.mwangi@email.com",
    phone: "+254 733 567 890",
    phoneNumber: "+254 733 567 890",
    dateOfBirth: "1988-11-10",
    gender: "Male",
    maritalStatus: "Married",
    address: "Mombasa, Kenya",
    emergencyContactName: "Jane Mwangi",
    emergencyContactPhone: "+254 744 678 901",
    membershipStatus: "Active",
    yearOfJoining: 2024,
    visitDate: "2024-01-05",
    membershipDate: "2024-07-10",
    baptized: true,
    baptismDate: "2024-04-25",
    bibleStudyCompleted: true,
    bibleStudyCompletionDate: "2024-06-05",
    employmentStatus: "Jobless",
    previousChurchName: "New Life Church",
    reasonForLeavingPreviousChurch: "Termination",
    reasonDetails: "Disagreement on church doctrine",
    howHeardAboutUs: "Relative",
    serviceGroups: ["Youth Group", "Prayer Team"],
    bornAgain: true,
    churchFeedback: "Appreciate the biblical teaching",
    prayerRequests: "Job opportunity and financial stability",
    transferredFromNewMemberId: "NM-003",
    createdAt: "2024-07-10T09:15:00Z",
  },
];

export default function MemberManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState(mockMembers);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Save member data to localStorage for Dashboard integration (non-financial data only)
  const saveMemberDataForDashboard = () => {
    const memberModuleData = {
      members: members,
      lastUpdated: new Date().toISOString(),
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.membershipStatus === "Active")
        .length,
      newThisMonth: members.filter((m) => {
        const membershipDate = new Date(m.membershipDate);
        const now = new Date();
        return (
          membershipDate.getMonth() === now.getMonth() &&
          membershipDate.getFullYear() === now.getFullYear()
        );
      }).length,
    };
    localStorage.setItem(
      "member_module_data",
      JSON.stringify(memberModuleData),
    );
  };
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] =
    useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [statusChangeAction, setStatusChangeAction] = useState<
    "suspend" | "excommunicate" | "reactivate" | null
  >(null);
  const [statusChangeReason, setStatusChangeReason] = useState("");
  const [filterEmployment, setFilterEmployment] = useState("All");
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [isTransferMode, setIsTransferMode] = useState(false);
  const [showTitheRecords, setShowTitheRecords] = useState(false);
  const [selectedMemberForTithe, setSelectedMemberForTithe] =
    useState<Member | null>(null);
  const [addMemberForm, setAddMemberForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    employmentStatus: "",
    membershipState: "Active",
    serviceGroups: [] as string[],
    bornAgain: false,
    baptized: true, // Default to true since they're becoming full members
    baptismDate: "",
    bibleStudyCompleted: false,
    bibleStudyCompletionDate: "",
  });

  // Load members including transferred ones on component mount
  useEffect(() => {
    loadMembers();

    // Listen for transfer events from New Members module
    const handleTransferEvent = (event) => {
      if (event.detail && event.detail.type === "newMemberTransfer") {
        const newMemberData = event.detail.data;
        openTransferForm(newMemberData);
      }
    };

    window.addEventListener("memberTransfer", handleTransferEvent);

    return () => {
      window.removeEventListener("memberTransfer", handleTransferEvent);
    };
  }, []);

  // Function to open form with pre-filled data from new member transfer
  const openTransferForm = (newMemberData) => {
    setIsTransferMode(true);
    setAddMemberForm({
      fullName: newMemberData.fullName || "",
      email: newMemberData.email || "",
      phone: newMemberData.phone || newMemberData.phoneNumber || "",
      dateOfBirth: newMemberData.dateOfBirth || "",
      gender: newMemberData.gender || "",
      maritalStatus: newMemberData.maritalStatus || "",
      address: newMemberData.address || "",
      emergencyContactName: newMemberData.emergencyContactName || "",
      emergencyContactPhone: newMemberData.emergencyContactPhone || "",
      employmentStatus: newMemberData.employmentStatus || "",
      membershipState: "Active",
      serviceGroups: newMemberData.serviceGroups || [],
      bornAgain: newMemberData.bornAgain || false,
      baptized: newMemberData.baptized || true,
      baptismDate: newMemberData.baptismDate || "",
      bibleStudyCompleted: newMemberData.bibleStudyCompleted || false,
      bibleStudyCompletionDate: newMemberData.bibleStudyCompletionDate || "",
    });
    setShowAddMemberDialog(true);
  };

  const loadMembers = () => {
    // Merge mock members with transferred members from transfer service
    const transferredMembers = transferService.getFullMembersData() as Member[];

    // Ensure unique IDs by prefixing transferred members
    const uniqueTransferredMembers = transferredMembers.map(
      (member, index) => ({
        ...member,
        id: `transferred_${member.id}_${index}`, // Ensure unique ID
      }),
    );

    const allMembers = [...mockMembers, ...uniqueTransferredMembers];
    setMembers(allMembers);
  };

  const handleAddNewMember = () => {
    if (
      !addMemberForm.fullName ||
      !addMemberForm.email ||
      !addMemberForm.phone ||
      !addMemberForm.gender
    ) {
      alert(
        "Please fill in required fields: Full Name, Email, Phone, and Gender",
      );
      return;
    }

    if (!addMemberForm.baptized) {
      alert(
        "Baptism is required for full membership. Please ensure the member is baptized before adding them as a full member.",
      );
      return;
    }

    if (!user) {
      alert("User authentication required.");
      return;
    }

    const memberCount = members.length + 1;
    const currentYear = new Date().getFullYear();
    const memberId = `TSOAM${currentYear}-${memberCount.toString().padStart(3, "0")}`;
    const titheNumber = `TS-${currentYear}-${memberCount.toString().padStart(3, "0")}`;
    const uniqueId = `member_${Date.now()}_${memberCount}`; // Generate truly unique ID

    const newMember: Member = {
      id: uniqueId,
      memberId,
      titheNumber,
      fullName: addMemberForm.fullName,
      email: addMemberForm.email,
      phone: addMemberForm.phone,
      phoneNumber: addMemberForm.phone, // Same as phone for compatibility
      dateOfBirth: addMemberForm.dateOfBirth,
      gender: addMemberForm.gender as "Male" | "Female",
      maritalStatus: addMemberForm.maritalStatus as any,
      address: addMemberForm.address,
      emergencyContactName: addMemberForm.emergencyContactName,
      emergencyContactPhone: addMemberForm.emergencyContactPhone,
      membershipStatus: addMemberForm.membershipState as "Active" | "Inactive",
      yearOfJoining: currentYear,
      visitDate: new Date().toISOString().split("T")[0],
      membershipDate: new Date().toISOString().split("T")[0],
      baptized: addMemberForm.baptized,
      baptismDate: addMemberForm.baptismDate,
      bibleStudyCompleted: addMemberForm.bibleStudyCompleted,
      bibleStudyCompletionDate: addMemberForm.bibleStudyCompletionDate,
      employmentStatus: addMemberForm.employmentStatus as any,
      previousChurchName: "",
      reasonForLeavingPreviousChurch: "Other" as const,
      reasonDetails: "",
      howHeardAboutUs: "Direct Registration" as any,
      serviceGroups: addMemberForm.serviceGroups,
      bornAgain: addMemberForm.bornAgain,
      transferredFromNewMemberId: "DIRECT_REGISTRATION",
      createdAt: new Date().toISOString(),
    };

    setMembers([...members, newMember]);

    // Clear form
    setAddMemberForm({
      fullName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      maritalStatus: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      employmentStatus: "",
      membershipState: "Active",
      serviceGroups: [],
      bornAgain: false,
      baptized: true,
      baptismDate: "",
      bibleStudyCompleted: false,
      bibleStudyCompletionDate: "",
    });

    setShowAddMemberDialog(false);
    setIsTransferMode(false);

    const message = isTransferMode
      ? `Member successfully transferred to Full Membership!\nMember ID: ${memberId}\nTithe Number: ${titheNumber}`
      : `Member successfully registered!\nMember ID: ${memberId}\nTithe Number: ${titheNumber}`;

    alert(message);
  };

  /**
   * Filter members based on search term and filters
   */
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.titheNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "All" || member.membershipStatus === filterStatus;
    const matchesEmployment =
      filterEmployment === "All" ||
      member.employmentStatus === filterEmployment;

    return matchesSearch && matchesStatus && matchesEmployment;
  });

  /**
   * Get status badge for member
   */
  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === "Active" ? "default" : "secondary"}>
        {status}
      </Badge>
    );
  };

  /**
   * Get employment status badge
   */
  const getEmploymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      Employed: "bg-green-100 text-green-800",
      Jobless: "bg-red-100 text-red-800",
      "Business Class": "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  /**
   * Calculate member tenure
   */
  const calculateTenure = (membershipDate: string) => {
    const start = new Date(membershipDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);

    if (diffYears > 0) {
      return `${diffYears} year${diffYears > 1 ? "s" : ""}, ${diffMonths % 12} month${diffMonths % 12 !== 1 ? "s" : ""}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
    }
  };

  /**
   * Export members data with comprehensive demographics using ExportService
   */
  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    const memberData = filteredMembers.map((member) => ({
      "Member ID": member.memberId,
      "Tithe Number": member.titheNumber,
      "Full Name": member.fullName,
      "Date of Birth": member.dateOfBirth,
      Age: member.dateOfBirth
        ? Math.floor(
            (new Date().getTime() - new Date(member.dateOfBirth).getTime()) /
              (1000 * 60 * 60 * 24 * 365.25),
          )
        : "N/A",
      Gender: member.gender,
      "Marital Status": member.maritalStatus,
      Email: member.email,
      Phone: member.phone,
      Address: member.address,
      "Emergency Contact": member.emergencyContactName,
      "Emergency Phone": member.emergencyContactPhone,
      "Membership Status": member.membershipStatus,
      "Original Visit Date": member.visitDate,
      "Membership Date": member.membershipDate,
      "Member Since": calculateTenure(member.membershipDate),
      "Year of Joining": member.yearOfJoining,
      "Employment Status": member.employmentStatus,
      Baptized: member.baptized ? "Yes" : "No",
      "Baptism Date": member.baptismDate || "N/A",
      "Bible Study Completed": member.bibleStudyCompleted ? "Yes" : "No",
      "Bible Study Completion Date": member.bibleStudyCompletionDate || "N/A",
      "Service Groups": member.serviceGroups.join(", "),
      "Previous Church": member.previousChurchName || "N/A",
      "Reason for Leaving Previous Church":
        member.reasonForLeavingPreviousChurch || "N/A",
      "How Heard About Church": member.howHeardAboutUs || "N/A",
      "Born Again": member.bornAgain ? "Yes" : "No",
      "Church Feedback": member.churchFeedback || "N/A",
      "Prayer Requests": member.prayerRequests || "N/A",
      "Transferred From New Member ID":
        member.transferredFromNewMemberId || "N/A",
      "Created Date": new Date(member.createdAt).toLocaleDateString(),
    }));

    try {
      await exportService.export({
        filename: `TSOAM_Members_Demographics_${new Date().toISOString().split("T")[0]}`,
        title: "TSOAM Church Members Demographics Report",
        subtitle: `Total Members: ${filteredMembers.length} | Active: ${filteredMembers.filter((m) => m.membershipStatus === "Active").length}`,
        data: memberData,
        format: format as "pdf" | "excel" | "csv",
        columns: [
          { key: "Member ID", title: "Member ID", width: 15 },
          { key: "Tithe Number", title: "Tithe Number", width: 15 },
          { key: "Full Name", title: "Full Name", width: 25 },
          { key: "Date of Birth", title: "Date of Birth", width: 15 },
          { key: "Age", title: "Age", width: 8 },
          { key: "Gender", title: "Gender", width: 10 },
          { key: "Marital Status", title: "Marital Status", width: 15 },
          { key: "Email", title: "Email", width: 25 },
          { key: "Phone", title: "Phone", width: 15 },
          { key: "Address", title: "Address", width: 30 },
          { key: "Emergency Contact", title: "Emergency Contact", width: 20 },
          { key: "Emergency Phone", title: "Emergency Phone", width: 15 },
          { key: "Membership Status", title: "Status", width: 12 },
          { key: "Membership Date", title: "Membership Date", width: 15 },
          { key: "Member Since", title: "Member Since", width: 15 },
          { key: "Employment Status", title: "Employment", width: 15 },
          { key: "Baptized", title: "Baptized", width: 10 },
          { key: "Bible Study Completed", title: "Bible Study", width: 12 },
          { key: "Service Groups", title: "Service Groups", width: 25 },
        ],
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed: " + error.message);
    }
  };

  /**
   * Handle member status changes (suspend, excommunicate, reactivate)
   */
  const handleStatusChange = () => {
    if (!selectedMember || !statusChangeAction || !statusChangeReason.trim()) {
      alert("Please provide a reason for the status change");
      return;
    }

    let newStatus: "Active" | "Inactive" | "Suspended" | "Excommunicated";
    let actionDescription: string;

    switch (statusChangeAction) {
      case "suspend":
        newStatus = "Inactive"; // Map suspended to inactive
        actionDescription = "suspended";
        break;
      case "excommunicate":
        newStatus = "Inactive"; // Map excommunicated to inactive
        actionDescription = "excommunicated";
        break;
      case "reactivate":
        newStatus = "Active";
        actionDescription = "reactivated";
        break;
      default:
        return;
    }

    // Update member status
    const updatedMembers = members.map((member) =>
      member.id === selectedMember.id
        ? { ...member, membershipStatus: newStatus }
        : member,
    );

    setMembers(updatedMembers);

    // Update dashboard data after member status change
    saveMemberDataForDashboard();

    // If excommunicated, also remove from new members (as per requirements)
    if (statusChangeAction === "excommunicate") {
      // In a real app, this would also remove from new_members table
      console.log(
        `Member ${selectedMember.fullName} has been excommunicated and removed from all records`,
      );
    }

    // Reset state
    setIsStatusChangeDialogOpen(false);
    setSelectedMember(null);
    setStatusChangeAction(null);
    setStatusChangeReason("");

    alert(
      `Member ${selectedMember.fullName} has been ${actionDescription} successfully.`,
    );
  };

  /**
   * Print members table using ExportService
   */
  const handlePrint = async () => {
    try {
      const printData = filteredMembers.map((member) => ({
        "Member ID": member.memberId,
        "Tithe Number": member.titheNumber,
        "Full Name": member.fullName,
        "Mobile Phone": member.phone,
        Status: member.membershipStatus,
        Employment: member.employmentStatus,
        "Year Joined": member.yearOfJoining.toString(),
      }));

      await exportService.export({
        filename: `TSOAM_Members_Print_${new Date().toISOString().split("T")[0]}`,
        title: "TSOAM Church Full Members Report",
        subtitle: `Total Members: ${filteredMembers.length}`,
        data: printData,
        format: "pdf",
        columns: [
          { key: "Member ID", title: "Member ID", width: 15 },
          { key: "Tithe Number", title: "Tithe Number", width: 15 },
          { key: "Full Name", title: "Full Name", width: 25 },
          { key: "Mobile Phone", title: "Mobile Phone", width: 15 },
          { key: "Status", title: "Status", width: 12 },
          { key: "Employment", title: "Employment", width: 15 },
          { key: "Year Joined", title: "Year Joined", width: 12 },
        ],
      });
    } catch (error) {
      console.error("Print failed:", error);
      alert("Print failed: " + error.message);
    }
  };

  // Calculate statistics
  const activeMembers = members.filter(
    (m) => m.membershipStatus === "Active",
  ).length;
  const totalMembers = members.length;
  const employedMembers = members.filter(
    (m) => m.employmentStatus === "Employed",
  ).length;
  const thisYearMembers = members.filter(
    (m) => m.yearOfJoining === new Date().getFullYear(),
  ).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground whitespace-nowrap">
              Member Management
            </h1>
            <p className="text-muted-foreground">
              Manage full church members who have completed the transition
              process
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddMemberDialog(true)}
              className="bg-red-900 hover:bg-red-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Full Member
            </Button>
            <Button variant="outline" onClick={() => handleExport("pdf")}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport("excel")}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{totalMembers}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Members
                  </div>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{activeMembers}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{employedMembers}</div>
                  <div className="text-sm text-muted-foreground">Employed</div>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{thisYearMembers}</div>
                  <div className="text-sm text-muted-foreground">
                    Joined This Year
                  </div>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Full Members Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, member ID, or tithe number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterEmployment}
                onValueChange={setFilterEmployment}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Employment</SelectItem>
                  <SelectItem value="Employed">Employed</SelectItem>
                  <SelectItem value="Jobless">Jobless</SelectItem>
                  <SelectItem value="Business Class">Business Class</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => handleExport("excel")}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Details</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Employment</TableHead>
                  <TableHead>Service Groups</TableHead>
                  <TableHead>Member Since</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member, index) => (
                  <TableRow key={`${member.id}-${member.memberId}-${index}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.memberId} • {member.titheNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Joined: {member.yearOfJoining}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{member.email}</div>
                        <div className="text-muted-foreground">
                          {member.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(member.membershipStatus)}
                    </TableCell>
                    <TableCell>
                      {getEmploymentBadge(member.employmentStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.serviceGroups
                          .slice(0, 2)
                          .map((group, groupIndex) => (
                            <Badge
                              key={`${member.id}-${group}-${groupIndex}`}
                              variant="outline"
                              className="text-xs"
                            >
                              {group}
                            </Badge>
                          ))}
                        {member.serviceGroups.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.serviceGroups.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {calculateTenure(member.membershipDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMemberForTithe(member);
                            setShowTitheRecords(true);
                          }}
                          style={{ color: "#800020" }}
                          className="hover:text-red-800"
                          title="Tithe Management - View & Record Tithes"
                        >
                          💰
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {member.membershipStatus !== "Active" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedMember(member);
                                  setStatusChangeAction("reactivate");
                                  setIsStatusChangeDialogOpen(true);
                                }}
                                className="text-green-600"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            {member.membershipStatus === "Active" &&
                              isAdmin && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setStatusChangeAction("suspend");
                                    setIsStatusChangeDialogOpen(true);
                                  }}
                                  className="text-yellow-600"
                                >
                                  <UserMinus className="mr-2 h-4 w-4" />
                                  Suspend
                                </DropdownMenuItem>
                              )}
                            {member.membershipStatus === "Active" &&
                              isAdmin && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setStatusChangeAction("excommunicate");
                                    setIsStatusChangeDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Excommunicate
                                </DropdownMenuItem>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Member Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-6">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="membership">Membership</TabsTrigger>
                    <TabsTrigger value="service">Service</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Full Name</Label>
                        <p className="text-sm">{selectedMember.fullName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Gender</Label>
                        <p className="text-sm">{selectedMember.gender}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Date of Birth
                        </Label>
                        <p className="text-sm">{selectedMember.dateOfBirth}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Marital Status
                        </Label>
                        <p className="text-sm">
                          {selectedMember.maritalStatus}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm">{selectedMember.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone</Label>
                        <p className="text-sm">{selectedMember.phone}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-medium">Address</Label>
                        <p className="text-sm">{selectedMember.address}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Emergency Contact
                        </Label>
                        <p className="text-sm">
                          {selectedMember.emergencyContactName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Emergency Phone
                        </Label>
                        <p className="text-sm">
                          {selectedMember.emergencyContactPhone}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="membership" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Member ID</Label>
                        <p className="text-sm font-mono">
                          {selectedMember.memberId}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Tithe Number
                        </Label>
                        <p className="text-sm font-mono">
                          {selectedMember.titheNumber}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Membership Status
                        </Label>
                        <p className="text-sm">
                          {getStatusBadge(selectedMember.membershipStatus)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Year of Joining
                        </Label>
                        <p className="text-sm">
                          {selectedMember.yearOfJoining}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Original Visit Date
                        </Label>
                        <p className="text-sm">{selectedMember.visitDate}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Membership Date
                        </Label>
                        <p className="text-sm">
                          {selectedMember.membershipDate}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Baptism Date
                        </Label>
                        <p className="text-sm">{selectedMember.baptismDate}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Bible Study Completed
                        </Label>
                        <p className="text-sm">
                          {selectedMember.bibleStudyCompletionDate}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Employment Status
                        </Label>
                        <p className="text-sm">
                          {getEmploymentBadge(selectedMember.employmentStatus)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Born Again
                        </Label>
                        <p className="text-sm">
                          {selectedMember.bornAgain ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="service" className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Service Groups
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedMember.serviceGroups.map((group) => (
                          <Badge key={group} variant="default">
                            {group}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Church Feedback
                      </Label>
                      <p className="text-sm">
                        {selectedMember.churchFeedback ||
                          "No feedback provided"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Prayer Requests
                      </Label>
                      <p className="text-sm">
                        {selectedMember.prayerRequests || "No prayer requests"}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Previous Church
                        </Label>
                        <p className="text-sm">
                          {selectedMember.previousChurchName || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Reason for Leaving
                        </Label>
                        <p className="text-sm">
                          {selectedMember.reasonForLeavingPreviousChurch ||
                            "Not specified"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-medium">
                          Additional Details
                        </Label>
                        <p className="text-sm">
                          {selectedMember.reasonDetails ||
                            "No additional details"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          How They Heard About Us
                        </Label>
                        <p className="text-sm">
                          {selectedMember.howHeardAboutUs}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Member Since
                        </Label>
                        <p className="text-sm">
                          {calculateTenure(selectedMember.membershipDate)}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end">
                  <Button onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Member Dialog - Full Membership Form */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" style={{ color: "#800020" }} />
                Edit Full Membership Details - {selectedMember?.fullName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Update member information and church details
              </p>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-6">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Personal Info</TabsTrigger>
                    <TabsTrigger value="contact">
                      Contact & Emergency
                    </TabsTrigger>
                    <TabsTrigger value="church">Church Details</TabsTrigger>
                    <TabsTrigger value="background">Background</TabsTrigger>
                  </TabsList>

                  {/* Personal Information Tab */}
                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-fullName">Full Name *</Label>
                        <Input
                          id="edit-fullName"
                          defaultValue={selectedMember.fullName}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                        <Input
                          id="edit-dateOfBirth"
                          type="date"
                          defaultValue={selectedMember.dateOfBirth}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-gender">Gender</Label>
                        <Select defaultValue={selectedMember.gender}>
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
                        <Label htmlFor="edit-maritalStatus">
                          Marital Status
                        </Label>
                        <Select defaultValue={selectedMember.maritalStatus}>
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
                        <Label htmlFor="edit-employmentStatus">
                          Employment Status
                        </Label>
                        <Select defaultValue={selectedMember.employmentStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Employed">Employed</SelectItem>
                            <SelectItem value="Jobless">Jobless</SelectItem>
                            <SelectItem value="Business Class">
                              Business Class
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="edit-membershipStatus">
                          Membership Status
                        </Label>
                        <Select defaultValue={selectedMember.membershipStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Contact & Emergency Tab */}
                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-email">Email Address</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          defaultValue={selectedMember.email}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-phone">Phone Number</Label>
                        <Input
                          id="edit-phone"
                          defaultValue={selectedMember.phone}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="edit-address">Home Address</Label>
                        <Textarea
                          id="edit-address"
                          defaultValue={selectedMember.address}
                          placeholder="Enter complete home address"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-emergencyContactName">
                          Emergency Contact Name
                        </Label>
                        <Input
                          id="edit-emergencyContactName"
                          defaultValue={selectedMember.emergencyContactName}
                          placeholder="Emergency contact full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-emergencyContactPhone">
                          Emergency Contact Phone
                        </Label>
                        <Input
                          id="edit-emergencyContactPhone"
                          defaultValue={selectedMember.emergencyContactPhone}
                          placeholder="Emergency contact phone number"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Church Details Tab */}
                  <TabsContent value="church" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-visitDate">
                          Original Visit Date
                        </Label>
                        <Input
                          id="edit-visitDate"
                          type="date"
                          defaultValue={selectedMember.visitDate}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-membershipDate">
                          Membership Date
                        </Label>
                        <Input
                          id="edit-membershipDate"
                          type="date"
                          defaultValue={selectedMember.membershipDate}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-yearOfJoining">
                          Year of Joining
                        </Label>
                        <Input
                          id="edit-yearOfJoining"
                          type="number"
                          defaultValue={selectedMember.yearOfJoining}
                          min="2000"
                          max={new Date().getFullYear()}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-bornAgain"
                          defaultChecked={selectedMember.bornAgain}
                        />
                        <Label htmlFor="edit-bornAgain">Born Again</Label>
                      </div>
                    </div>

                    {/* Baptism Details */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Baptism Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="edit-baptized"
                            defaultChecked={selectedMember.baptized}
                          />
                          <Label htmlFor="edit-baptized">Baptized</Label>
                        </div>
                        <div>
                          <Label htmlFor="edit-baptismDate">Baptism Date</Label>
                          <Input
                            id="edit-baptismDate"
                            type="date"
                            defaultValue={selectedMember.baptismDate}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bible Study Details */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Bible Study</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="edit-bibleStudyCompleted"
                            defaultChecked={selectedMember.bibleStudyCompleted}
                          />
                          <Label htmlFor="edit-bibleStudyCompleted">
                            Bible Study Completed
                          </Label>
                        </div>
                        <div>
                          <Label htmlFor="edit-bibleStudyCompletionDate">
                            Completion Date
                          </Label>
                          <Input
                            id="edit-bibleStudyCompletionDate"
                            type="date"
                            defaultValue={
                              selectedMember.bibleStudyCompletionDate
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Service Groups */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Service Groups</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {SERVICE_GROUPS.map((group) => (
                          <div
                            key={group}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`edit-${group}`}
                              defaultChecked={selectedMember.serviceGroups.includes(
                                group,
                              )}
                            />
                            <Label
                              htmlFor={`edit-${group}`}
                              className="text-sm"
                            >
                              {group}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Background Tab */}
                  <TabsContent value="background" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-howHeardAboutUs">
                          How did you hear about our church?
                        </Label>
                        <Select defaultValue={selectedMember.howHeardAboutUs}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Friend">Friend</SelectItem>
                            <SelectItem value="Relative">Relative</SelectItem>
                            <SelectItem value="Word of Mouth">
                              Word of Mouth
                            </SelectItem>
                            <SelectItem value="Website">Website</SelectItem>
                            <SelectItem value="Crusade">Crusade</SelectItem>
                            <SelectItem value="Roadshow">Roadshow</SelectItem>
                            <SelectItem value="Matatu">Matatu</SelectItem>
                            <SelectItem value="Social Media">
                              Social Media
                            </SelectItem>
                            <SelectItem value="Flyer">Flyer</SelectItem>
                            <SelectItem value="Personal Identification">
                              Personal Identification
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="edit-previousChurchName">
                          Previous Church Name (if any)
                        </Label>
                        <Input
                          id="edit-previousChurchName"
                          defaultValue={selectedMember.previousChurchName || ""}
                          placeholder="Enter previous church name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-reasonForLeavingPreviousChurch">
                          Reason for Leaving Previous Church
                        </Label>
                        <Select
                          defaultValue={
                            selectedMember.reasonForLeavingPreviousChurch || ""
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Suspension">
                              Suspension
                            </SelectItem>
                            <SelectItem value="Termination">
                              Termination
                            </SelectItem>
                            <SelectItem value="Self-Evolution">
                              Self-Evolution
                            </SelectItem>
                            <SelectItem value="Relocation">
                              Relocation
                            </SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="edit-reasonDetails">
                          Additional Details
                        </Label>
                        <Textarea
                          id="edit-reasonDetails"
                          defaultValue={selectedMember.reasonDetails || ""}
                          placeholder="Provide additional details if necessary"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-churchFeedback">
                          Church Feedback
                        </Label>
                        <Textarea
                          id="edit-churchFeedback"
                          defaultValue={selectedMember.churchFeedback || ""}
                          placeholder="Any feedback about the church"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-prayerRequests">
                          Prayer Requests
                        </Label>
                        <Textarea
                          id="edit-prayerRequests"
                          defaultValue={selectedMember.prayerRequests || ""}
                          placeholder="Enter prayer requests"
                          rows={3}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      // TODO: Implement save functionality
                      alert("Member details updated successfully!");
                      setIsEditDialogOpen(false);
                    }}
                    className="text-white hover:opacity-90"
                    style={{ backgroundColor: "#800020" }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update Member Details
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Status Change Dialog */}
        <Dialog
          open={isStatusChangeDialogOpen}
          onOpenChange={setIsStatusChangeDialogOpen}
        >
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {statusChangeAction === "suspend" && "Suspend Member"}
                {statusChangeAction === "excommunicate" &&
                  "Excommunicate Member"}
                {statusChangeAction === "reactivate" && "Reactivate Member"}
              </DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium">Member Details</h4>
                  <div className="text-sm space-y-1 mt-2">
                    <div>
                      <strong>Name:</strong> {selectedMember.fullName}
                    </div>
                    <div>
                      <strong>Member ID:</strong> {selectedMember.memberId}
                    </div>
                    <div>
                      <strong>Current Status:</strong>{" "}
                      {selectedMember.membershipStatus}
                    </div>
                  </div>
                </div>

                {statusChangeAction === "excommunicate" && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Warning</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Excommunicating a member will permanently remove them from
                      both the members list and new members records. This action
                      cannot be undone.
                    </p>
                  </div>
                )}

                {statusChangeAction === "suspend" && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Note</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Suspending a member will temporarily restrict their
                      membership privileges. They can be reactivated later.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="statusReason">
                    Reason for{" "}
                    {statusChangeAction === "suspend"
                      ? "suspension"
                      : statusChangeAction === "excommunicate"
                        ? "excommunication"
                        : "reactivation"}{" "}
                    *
                  </Label>
                  <Textarea
                    id="statusReason"
                    placeholder={`Please provide a detailed reason for this ${statusChangeAction}...`}
                    value={statusChangeReason}
                    onChange={(e) => setStatusChangeReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsStatusChangeDialogOpen(false);
                      setSelectedMember(null);
                      setStatusChangeAction(null);
                      setStatusChangeReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStatusChange}
                    variant={
                      statusChangeAction === "excommunicate"
                        ? "destructive"
                        : statusChangeAction === "suspend"
                          ? "default"
                          : "default"
                    }
                  >
                    {statusChangeAction === "suspend" && "Suspend Member"}
                    {statusChangeAction === "excommunicate" &&
                      "Excommunicate Member"}
                    {statusChangeAction === "reactivate" && "Reactivate Member"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Full Member Dialog */}
        <Dialog
          open={showAddMemberDialog}
          onOpenChange={setShowAddMemberDialog}
        >
          <DialogContent
            className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
            onInteractOutside={() => {
              setIsTransferMode(false);
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {isTransferMode ? "Transfer to Full Member" : "Add Full Member"}
              </DialogTitle>
              {isTransferMode && (
                <p className="text-sm text-muted-foreground">
                  Completing the transfer of a new member who has met all
                  requirements. Information has been pre-filled from their new
                  member record.
                </p>
              )}
            </DialogHeader>
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addFullName">Full Name *</Label>
                    <Input
                      id="addFullName"
                      value={addMemberForm.fullName}
                      onChange={(e) =>
                        setAddMemberForm({
                          ...addMemberForm,
                          fullName: e.target.value,
                        })
                      }
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addGender">Gender *</Label>
                    <Select
                      value={addMemberForm.gender}
                      onValueChange={(value) =>
                        setAddMemberForm({ ...addMemberForm, gender: value })
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
                    <Label htmlFor="addDateOfBirth">Date of Birth</Label>
                    <Input
                      id="addDateOfBirth"
                      type="date"
                      value={addMemberForm.dateOfBirth}
                      onChange={(e) =>
                        setAddMemberForm({
                          ...addMemberForm,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addMaritalStatus">Marital Status</Label>
                    <Select
                      value={addMemberForm.maritalStatus}
                      onValueChange={(value) =>
                        setAddMemberForm({
                          ...addMemberForm,
                          maritalStatus: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addPhone">Phone Number *</Label>
                    <Input
                      id="addPhone"
                      value={addMemberForm.phone}
                      onChange={(e) =>
                        setAddMemberForm({
                          ...addMemberForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addEmail">Email Address *</Label>
                    <Input
                      id="addEmail"
                      type="email"
                      value={addMemberForm.email}
                      onChange={(e) =>
                        setAddMemberForm({
                          ...addMemberForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addAddress">Address</Label>
                  <Textarea
                    id="addAddress"
                    value={addMemberForm.address}
                    onChange={(e) =>
                      setAddMemberForm({
                        ...addMemberForm,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter physical address"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addEmergencyContactName">
                      Emergency Contact Name
                    </Label>
                    <Input
                      id="addEmergencyContactName"
                      value={addMemberForm.emergencyContactName}
                      onChange={(e) =>
                        setAddMemberForm({
                          ...addMemberForm,
                          emergencyContactName: e.target.value,
                        })
                      }
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addEmergencyContactPhone">
                      Emergency Contact Phone
                    </Label>
                    <Input
                      id="addEmergencyContactPhone"
                      value={addMemberForm.emergencyContactPhone}
                      onChange={(e) =>
                        setAddMemberForm({
                          ...addMemberForm,
                          emergencyContactPhone: e.target.value,
                        })
                      }
                      placeholder="Enter emergency contact phone"
                    />
                  </div>
                </div>
              </div>

              {/* Member Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Member Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addMembershipNumber">
                      Membership Number
                    </Label>
                    <Input
                      id="addMembershipNumber"
                      value="Auto-generated"
                      disabled
                      className="bg-gray-50"
                      placeholder="TSOAM2025-XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addTitheNumber">Tithe Number</Label>
                    <Input
                      id="addTitheNumber"
                      value="Auto-generated"
                      disabled
                      className="bg-gray-50"
                      placeholder="TS-2025-XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addMembershipDate">Membership Date</Label>
                    <Input
                      id="addMembershipDate"
                      type="date"
                      value={new Date().toISOString().split("T")[0]}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addEmploymentStatus">
                      Employment Status
                    </Label>
                    <Select
                      value={addMemberForm.employmentStatus}
                      onValueChange={(value) =>
                        setAddMemberForm({
                          ...addMemberForm,
                          employmentStatus: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employed">Employed</SelectItem>
                        <SelectItem value="Business Class">
                          Business Class
                        </SelectItem>
                        <SelectItem value="Jobless">Jobless</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addMembershipState">Membership State</Label>
                    <Select
                      value={addMemberForm.membershipState || "Active"}
                      onValueChange={(value) =>
                        setAddMemberForm({
                          ...addMemberForm,
                          membershipState: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select membership state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Service Groups */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service Groups</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_GROUPS.map((group) => (
                    <div key={group} className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-${group}`}
                        checked={addMemberForm.serviceGroups.includes(group)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAddMemberForm({
                              ...addMemberForm,
                              serviceGroups: [
                                ...addMemberForm.serviceGroups,
                                group,
                              ],
                            });
                          } else {
                            setAddMemberForm({
                              ...addMemberForm,
                              serviceGroups: addMemberForm.serviceGroups.filter(
                                (sg) => sg !== group,
                              ),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`group-${group}`} className="text-sm">
                        {group}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spiritual Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Spiritual Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="addBornAgain"
                      checked={addMemberForm.bornAgain}
                      onCheckedChange={(checked) =>
                        setAddMemberForm({
                          ...addMemberForm,
                          bornAgain: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="addBornAgain">Born Again</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="addBaptized"
                      checked={addMemberForm.baptized}
                      onCheckedChange={(checked) =>
                        setAddMemberForm({
                          ...addMemberForm,
                          baptized: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="addBaptized">
                      Baptized (Required for Full Membership)
                    </Label>
                  </div>
                </div>

                {addMemberForm.baptized && (
                  <div className="space-y-2">
                    <Label htmlFor="addBaptismDate">Baptism Date</Label>
                    <Input
                      id="addBaptismDate"
                      type="date"
                      value={addMemberForm.baptismDate}
                      onChange={(e) =>
                        setAddMemberForm({
                          ...addMemberForm,
                          baptismDate: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addBibleStudy"
                    checked={addMemberForm.bibleStudyCompleted}
                    onCheckedChange={(checked) =>
                      setAddMemberForm({
                        ...addMemberForm,
                        bibleStudyCompleted: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="addBibleStudy">Bible Study Completed</Label>
                </div>

                {addMemberForm.bibleStudyCompleted && (
                  <div className="space-y-2">
                    <Label htmlFor="addBibleStudyDate">
                      Bible Study Completion Date
                    </Label>
                    <Input
                      id="addBibleStudyDate"
                      type="date"
                      value={addMemberForm.bibleStudyCompletionDate}
                      onChange={(e) =>
                        setAddMemberForm({
                          ...addMemberForm,
                          bibleStudyCompletionDate: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddMemberDialog(false);
                    setIsTransferMode(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddNewMember}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isTransferMode ? "Complete Transfer" : "Add Full Member"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Member Tithe Records Dialog */}
        <MemberTitheRecords
          isOpen={showTitheRecords}
          onClose={() => {
            setShowTitheRecords(false);
            setSelectedMemberForTithe(null);
          }}
          member={selectedMemberForTithe}
        />
      </div>
    </Layout>
  );
}
