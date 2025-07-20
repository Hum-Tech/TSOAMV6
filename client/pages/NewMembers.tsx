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
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Search,
  Download,
  UserPlus,
  Clock,
  CheckCircle,
  Calendar,
  Users,
  ArrowRight,
  AlertCircle,
  FileText,
  Eye,
  Phone,
  Mail,
  MapPin,
  Heart,
  Edit,
} from "lucide-react";
import { exportService } from "@/services/ExportService";
import {
  visitorTrackingService,
  type Visitor as TrackedVisitor,
  type RetentionStats,
  type ConversionFunnel,
} from "@/services/VisitorTrackingService";
import { transferService } from "@/services/TransferService";
import { useAuth } from "@/contexts/AuthContext";

// Types
interface Visitor {
  id: number;
  visitorId: string;
  fullName: string;
  phoneNumber: string;
  purposeOfVisit: string;
  currentChurch: string;
  howHeardAboutUs: string;
  whatLikedMost: string;
  prayerRequests: string[];
  visitDate: string;
  followUpRequired: boolean;
  followUpNotes: string;
}

interface NewMember {
  id: number;
  visitorId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  gender: "Male" | "Female";
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed";
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  visitDate: string;
  daysAsNewMember: number;
  baptized: boolean;
  baptismDate?: string;
  bibleStudyCompleted: boolean;
  bibleStudyCompletionDate?: string;
  employmentStatus: "Employed" | "Jobless" | "Business Class";
  previousChurchName: string;
  reasonForLeavingPreviousChurch:
    | "Suspension"
    | "Termination"
    | "Self-Evolution"
    | "Relocation"
    | "Other";
  reasonDetails: string;
  howHeardAboutUs: string;
  purposeOfVisit: string;
  bornAgain: boolean;
  churchFeedback: string;
  prayerRequests: string;
  serviceGroups: number[];
  eligibleForMembership: boolean;
  isActive: boolean;
}

interface ServiceGroup {
  id: number;
  name: string;
  description: string;
}

const prayerRequestOptions = [
  "Healing",
  "Financial Breakthrough",
  "Job/Employment",
  "Family Unity",
  "Spiritual Growth",
  "Protection",
  "Academic Success",
  "Business Success",
  "Marriage/Relationship",
  "Other",
];

const purposeOfVisitOptions = [
  "Sunday Service",
  "Prayer Meeting",
  "Counseling",
  "Bible Study",
  "Youth Service",
  "Special Event",
  "Other",
];

const howHeardOptions = [
  "Friend",
  "Relative",
  "Word of Mouth",
  "Website",
  "Crusade",
  "Roadshow",
  "Matatu",
  "Social Media",
  "Flyer",
  "Personal Identification",
];

export default function NewMembers() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [newMembers, setNewMembers] = useState<NewMember[]>([]);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [loading, setLoading] = useState(false);

  // Search and filter states
  const [visitorsSearchTerm, setVisitorsSearchTerm] = useState("");
  const [newMembersSearchTerm, setNewMembersSearchTerm] = useState("");

  // Dialog states
  const [showVisitorDialog, setShowVisitorDialog] = useState(false);
  const [showNewMemberDialog, setShowNewMemberDialog] = useState(false);
  const [selectedNewMember, setSelectedNewMember] = useState<NewMember | null>(
    null,
  );
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showFullMemberTransferDialog, setShowFullMemberTransferDialog] =
    useState(false);
  const [showEditNewMemberDialog, setShowEditNewMemberDialog] = useState(false);
  const [showViewNewMemberDialog, setShowViewNewMemberDialog] = useState(false);
  const [fullMemberForm, setFullMemberForm] = useState({
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
    baptized: true,
    baptismDate: "",
    bibleStudyCompleted: false,
    bibleStudyCompletionDate: "",
  });

  // Visitor tracking and analytics state
  const [trackedVisitors, setTrackedVisitors] = useState<TrackedVisitor[]>([]);
  const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(
    null,
  );
  const [conversionFunnel, setConversionFunnel] =
    useState<ConversionFunnel | null>(null);

  // Form states
  const [visitorForm, setVisitorForm] = useState({
    fullName: "",
    phoneNumber: "",
    purposeOfVisit: "",
    currentChurch: "",
    howHeardAboutUs: "",
    whatLikedMost: "",
    prayerRequests: [] as string[],
    followUpRequired: false,
    followUpNotes: "",
  });

  const [newMemberForm, setNewMemberForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    employmentStatus: "",
    previousChurchName: "",
    reasonForLeavingPreviousChurch: "",
    reasonDetails: "",
    howHeardAboutUs: "",
    purposeOfVisit: "",
    bornAgain: false,
    churchFeedback: "",
    prayerRequests: "",
    serviceGroups: [] as number[],
    baptized: false,
    baptismDate: "",
    bibleStudyCompleted: false,
    bibleStudyCompletionDate: "",
  });

  const [transferForm, setTransferForm] = useState({
    serviceGroups: [] as string[],
  });
  const [activeTab, setActiveTab] = useState("visitors");
  const [transferredVisitorId, setTransferredVisitorId] = useState<
    string | null
  >(null);

  // Attendance and milestone tracking
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [selectedVisitorForAttendance, setSelectedVisitorForAttendance] =
    useState<TrackedVisitor | null>(null);
  const [selectedMemberForMilestone, setSelectedMemberForMilestone] =
    useState<NewMember | null>(null);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [milestoneType, setMilestoneType] = useState<"baptism" | "bible-study">(
    "baptism",
  );

  useEffect(() => {
    loadData();

    // Check for automatic transfers every 24 hours (only in production)
    const transferInterval = setInterval(
      checkForAutoTransfers,
      24 * 60 * 60 * 1000,
    );

    // Also check once when component mounts (after 10 seconds to let app initialize)
    const initialCheck = setTimeout(() => {
      // Only run auto-transfer in production or when explicitly enabled
      if (window.location.hostname !== "localhost") {
        checkForAutoTransfers();
      }
    }, 10000);

    return () => {
      clearInterval(transferInterval);
      clearTimeout(initialCheck);
    };
  }, []);

  // Initialize visitor tracking service
  useEffect(() => {
    const loadTrackedVisitors = () => {
      const visitors = visitorTrackingService.getVisitors();
      setTrackedVisitors(visitors);

      // Load current period statistics
      const monthlyStats = visitorTrackingService.getRetentionStats("monthly");
      setRetentionStats(monthlyStats);

      const funnelData = visitorTrackingService.getConversionFunnel();
      setConversionFunnel(funnelData);
    };

    loadTrackedVisitors();

    // Subscribe to visitor updates
    visitorTrackingService.subscribe(loadTrackedVisitors);

    return () => {
      visitorTrackingService.unsubscribe(loadTrackedVisitors);
    };
  }, []);

  // Handle visitor transfer to new member registration
  const handleVisitorTransfer = (visitor: TrackedVisitor) => {
    if (!user) {
      alert("User authentication required for transfers.");
      return;
    }

    // Check if visitor is eligible for transfer (3 consecutive Sundays)
    if (visitor.consecutiveSundays < 3) {
      alert(
        `Cannot promote ${visitor.fullName} to New Member.\n\nRequirement: Must attend 3 consecutive Sundays\nCurrent: ${visitor.consecutiveSundays} consecutive Sunday${visitor.consecutiveSundays === 1 ? "" : "s"} attended\n\nPlease wait until they complete the requirement.`,
      );
      return;
    }

    const transferData = visitorTrackingService.transferVisitorToNewMember(
      visitor.visitorId,
    );

    if (transferData) {
      // Use transfer service to efficiently move data between modules
      const transferSuccess = transferService.transferVisitorToNewMember(
        {
          visitorId: visitor.visitorId,
          fullName: visitor.fullName,
          phoneNumber: visitor.phoneNumber,
          email: visitor.email,
          gender: visitor.gender,
          dateOfBirth: visitor.dateOfBirth,
          maritalStatus: visitor.maritalStatus,
          address: visitor.address,
          firstVisitDate: visitor.firstVisitDate,
          bornAgain: visitor.bornAgain,
          howHeardAboutChurch: visitor.howHeardAboutChurch,
        },
        user.name,
      );

      if (transferSuccess) {
        // Refresh new members list to show the transferred member
        loadMockNewMembers();

        // Show success message
        alert(
          `Visitor ${transferData.fullName} (${transferData.visitorId}) has been successfully transferred to the New Members module. You can now view them in the New Members list.`,
        );

        // Switch to new members tab to show the result
        setActiveTab("new-members");
      } else {
        alert("Failed to transfer visitor data. Please try again.");
      }
    } else {
      alert(
        "Failed to transfer visitor. This could be because:\n" +
          "• They have not attended 3 consecutive Sundays\n" +
          "• They have already been transferred\n" +
          "• There was a system error\n\n" +
          "Please check their attendance record and try again.",
      );
    }
  };

  // Automatic transfer function
  const checkForAutoTransfers = async () => {
    // Skip auto-transfer in development environment
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname.includes("dev")
    ) {
      console.log("Auto-transfer skipped in development environment");
      return;
    }

    try {
      const response = await fetch("/api/members/eligible-for-transfer");

      if (!response.ok) {
        console.error("Failed to fetch eligible members:", response.statusText);
        return;
      }

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const eligibleMembers = result.data;
        console.log(
          `Found ${eligibleMembers.length} members eligible for automatic transfer`,
        );

        // Process automatic transfers for eligible members
        for (const member of eligibleMembers) {
          try {
            const transferResponse = await fetch("/api/members/transfer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                newMemberId: member.id,
                serviceGroups: ["Prayer Team"], // Default service group for auto-transfers
              }),
            });

            if (!transferResponse.ok) {
              console.error(
                `Transfer failed for ${member.full_name}:`,
                transferResponse.statusText,
              );
              continue;
            }

            const transferResult = await transferResponse.json();

            if (transferResult.success) {
              console.log(
                `Automatically transferred member: ${member.full_name} (${transferResult.memberId})`,
              );

              // Update local state
              setNewMembers((prev) => prev.filter((m) => m.id !== member.id));

              // Trigger dashboard refresh
              localStorage.setItem("dashboard_refresh", Date.now().toString());
            }
          } catch (transferError) {
            console.error(
              `Failed to auto-transfer member ${member.full_name}:`,
              transferError,
            );
          }
        }

        if (eligibleMembers.length > 0) {
          // Show notification about auto-transfers
          const transferCount = eligibleMembers.length;
          const notification = document.createElement("div");
          notification.className =
            "fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50";
          notification.innerHTML = `
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Automatically transferred ${transferCount} eligible member${transferCount > 1 ? "s" : ""} to full membership!</span>
            </div>
          `;
          document.body.appendChild(notification);

          setTimeout(() => {
            document.body.removeChild(notification);
          }, 5000);
        }
      } else {
        console.log("No eligible members found for auto-transfer");
      }
    } catch (error) {
      console.error("Failed to check for auto-transfers:", error);
      // Don't show error to user for auto-transfer background process
      // This is expected when database is not available
    }
  };

  const loadData = () => {
    // Load service groups
    const mockServiceGroups: ServiceGroup[] = [
      { id: 1, name: "Choir", description: "Church choir and worship team" },
      { id: 2, name: "Ushering", description: "Church ushers and hospitality" },
      { id: 3, name: "Youth", description: "Youth ministry and activities" },
      {
        id: 4,
        name: "Prayer Team",
        description: "Intercessory prayer ministry",
      },
      { id: 5, name: "Media", description: "Audio/visual and media ministry" },
      {
        id: 6,
        name: "Cleaning",
        description: "Church cleaning and maintenance",
      },
      { id: 7, name: "Security", description: "Church security team" },
      {
        id: 8,
        name: "Children Ministry",
        description: "Sunday school and children programs",
      },
    ];
    setServiceGroups(mockServiceGroups);

    // Load visitors
    const mockVisitors: Visitor[] = [
      {
        id: 1,
        visitorId: "V2025-001",
        fullName: "Alice Johnson",
        phoneNumber: "+254712345678",
        purposeOfVisit: "Sunday Service",
        currentChurch: "Methodist Church",
        howHeardAboutUs: "Friend",
        whatLikedMost: "The worship and teaching",
        prayerRequests: ["Healing", "Financial Breakthrough"],
        visitDate: "2025-01-15",
        followUpRequired: true,
        followUpNotes: "Interested in joining choir",
      },
      {
        id: 2,
        visitorId: "V2025-002",
        fullName: "Robert Mwangi",
        phoneNumber: "+254798765432",
        purposeOfVisit: "Prayer Meeting",
        currentChurch: "Catholic Church",
        howHeardAboutUs: "Social Media",
        whatLikedMost: "The prayer atmosphere",
        prayerRequests: ["Spiritual Growth", "Family Unity"],
        visitDate: "2025-01-14",
        followUpRequired: false,
        followUpNotes: "",
      },
    ];
    setVisitors(mockVisitors);

    // Load new members
    const mockNewMembers: NewMember[] = [
      {
        id: 1,
        visitorId: "VISIT-2024-001N",
        fullName: "John Doe",
        phoneNumber: "+254723456789",
        email: "john@example.com",
        dateOfBirth: "1990-05-15",
        gender: "Male",
        maritalStatus: "Married",
        address: "123 Nairobi Street, Nairobi",
        emergencyContactName: "Jane Doe",
        emergencyContactPhone: "+254734567890",
        visitDate: "2024-07-15",
        daysAsNewMember: 183,
        baptized: true,
        baptismDate: "2024-09-01",
        bibleStudyCompleted: true,
        bibleStudyCompletionDate: "2024-10-15",
        employmentStatus: "Employed",
        previousChurchName: "St. Paul's Cathedral",
        reasonForLeavingPreviousChurch: "Relocation",
        reasonDetails: "Moved to a new area",
        howHeardAboutUs: "Friend",
        purposeOfVisit: "Sunday Service",
        bornAgain: true,
        churchFeedback: "Very welcoming community",
        prayerRequests: "Business success",
        serviceGroups: [1, 4],
        eligibleForMembership: true,
        isActive: true,
      },
      {
        id: 2,
        visitorId: "VISIT-2024-002N",
        fullName: "Mary Smith",
        phoneNumber: "+254745678901",
        email: "mary@example.com",
        dateOfBirth: "1988-12-20",
        gender: "Female",
        maritalStatus: "Single",
        address: "456 Mombasa Road, Nairobi",
        emergencyContactName: "Paul Smith",
        emergencyContactPhone: "+254756789012",
        visitDate: "2024-09-01",
        daysAsNewMember: 136,
        baptized: false,
        bibleStudyCompleted: true,
        bibleStudyCompletionDate: "2024-11-30",
        employmentStatus: "Business Class",
        previousChurchName: "PCEA Church",
        reasonForLeavingPreviousChurch: "Self-Evolution",
        reasonDetails: "Seeking spiritual growth",
        howHeardAboutUs: "Website",
        purposeOfVisit: "Bible Study",
        bornAgain: true,
        churchFeedback: "Great teachings",
        prayerRequests: "Academic success",
        serviceGroups: [2, 8],
        eligibleForMembership: false,
        isActive: true,
      },
    ];
    // Merge mock data with transferred members from transfer service
    const transferredMembers = transferService.getNewMembersData();
    const allNewMembers = [...mockNewMembers, ...transferredMembers];
    setNewMembers(allNewMembers);
  };

  const loadMockNewMembers = () => {
    // Reload new members including any transferred members
    const mockNewMembers: NewMember[] = [
      {
        id: 1,
        visitorId: "VISIT-2024-001N",
        fullName: "John Doe",
        phoneNumber: "+254723456789",
        email: "john@example.com",
        dateOfBirth: "1990-05-15",
        gender: "Male",
        maritalStatus: "Married",
        address: "123 Nairobi Street, Nairobi",
        emergencyContactName: "Jane Doe",
        emergencyContactPhone: "+254734567890",
        visitDate: "2024-07-15",
        daysAsNewMember: 183,
        baptized: true,
        baptismDate: "2024-09-01",
        bibleStudyCompleted: true,
        bibleStudyCompletionDate: "2024-10-15",
        employmentStatus: "Employed",
        previousChurchName: "St. Paul's Cathedral",
        reasonForLeavingPreviousChurch: "Relocation",
        reasonDetails: "Moved to a new area",
        howHeardAboutUs: "Friend",
        purposeOfVisit: "Sunday Service",
        bornAgain: true,
        churchFeedback: "Very welcoming community",
        prayerRequests: "Business success",
        serviceGroups: [1, 4],
        eligibleForMembership: true,
        isActive: true,
      },
      {
        id: 2,
        visitorId: "VISIT-2024-002N",
        fullName: "Mary Smith",
        phoneNumber: "+254745678901",
        email: "mary@example.com",
        dateOfBirth: "1988-12-20",
        gender: "Female",
        maritalStatus: "Single",
        address: "456 Mombasa Road, Nairobi",
        emergencyContactName: "Paul Smith",
        emergencyContactPhone: "+254756789012",
        visitDate: "2024-09-01",
        daysAsNewMember: 136,
        baptized: false,
        bibleStudyCompleted: true,
        bibleStudyCompletionDate: "2024-11-30",
        employmentStatus: "Business Class",
        previousChurchName: "PCEA Church",
        reasonForLeavingPreviousChurch: "Self-Evolution",
        reasonDetails: "Seeking spiritual growth",
        howHeardAboutUs: "Website",
        purposeOfVisit: "Bible Study",
        bornAgain: true,
        churchFeedback: "Great teachings",
        prayerRequests: "Academic success",
        serviceGroups: [2, 8],
        eligibleForMembership: false,
        isActive: true,
      },
    ];

    // Merge with transferred members
    const transferredMembers = transferService.getNewMembersData();
    const allNewMembers = [...mockNewMembers, ...transferredMembers];
    setNewMembers(allNewMembers);
  };

  const handleVisitorSubmit = () => {
    if (!visitorForm.fullName || !visitorForm.phoneNumber) {
      alert("Please fill in required fields");
      return;
    }

    const visitorCount = visitors.length + 1;
    const visitorId = `V2025-${visitorCount.toString().padStart(3, "0")}`;

    const newVisitor: Visitor = {
      id: visitorCount,
      visitorId,
      ...visitorForm,
      visitDate: new Date().toISOString().split("T")[0],
    };

    setVisitors([...visitors, newVisitor]);
    setVisitorForm({
      fullName: "",
      phoneNumber: "",
      purposeOfVisit: "",
      currentChurch: "",
      howHeardAboutUs: "",
      whatLikedMost: "",
      prayerRequests: [],
      followUpRequired: false,
      followUpNotes: "",
    });
    setShowVisitorDialog(false);
  };

  const handleNewMemberSubmit = () => {
    if (
      !newMemberForm.fullName ||
      !newMemberForm.phoneNumber ||
      !newMemberForm.gender
    ) {
      alert("Please fill in required fields");
      return;
    }

    const memberCount = newMembers.length + 1;
    // Use transferred visitor ID if available, otherwise generate new one with 'N' suffix
    const visitorId = transferredVisitorId
      ? `${transferredVisitorId}N`
      : `VISIT-2025-${memberCount.toString().padStart(3, "0")}N`;

    const newMember: NewMember = {
      id: memberCount,
      visitorId,
      ...newMemberForm,
      visitDate: new Date().toISOString().split("T")[0],
      daysAsNewMember: 0,
      eligibleForMembership: false,
      isActive: true,
      serviceGroups: newMemberForm.serviceGroups,
      gender: newMemberForm.gender as "Male" | "Female",
      maritalStatus: newMemberForm.maritalStatus as any,
      employmentStatus: newMemberForm.employmentStatus as any,
      reasonForLeavingPreviousChurch:
        newMemberForm.reasonForLeavingPreviousChurch as any,
    };

    setNewMembers([...newMembers, newMember]);
    setNewMemberForm({
      fullName: "",
      phoneNumber: "",
      email: "",
      dateOfBirth: "",
      gender: "",
      maritalStatus: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      employmentStatus: "",
      previousChurchName: "",
      reasonForLeavingPreviousChurch: "",
      reasonDetails: "",
      howHeardAboutUs: "",
      purposeOfVisit: "",
      bornAgain: false,
      churchFeedback: "",
      prayerRequests: "",
      serviceGroups: [],
      baptized: false,
      baptismDate: "",
      bibleStudyCompleted: false,
      bibleStudyCompletionDate: "",
    });
    setShowNewMemberDialog(false);
    setTransferredVisitorId(null); // Clear transferred visitor ID
  };

  const handleNewMemberDialogClose = (open: boolean) => {
    setShowNewMemberDialog(open);
    if (!open) {
      setTransferredVisitorId(null); // Clear transferred visitor ID when dialog closes
    }
  };

  const handleTransferToFullMembership = async () => {
    if (!selectedNewMember) {
      alert("No member selected for transfer");
      return;
    }

    if (!user) {
      alert("User authentication required for transfers.");
      return;
    }

    // Map service group IDs to names for the transfer
    const memberServiceGroupNames = selectedNewMember.serviceGroups
      .map((groupId) => {
        const serviceGroup = serviceGroups.find((sg) => sg.id === groupId);
        return serviceGroup ? serviceGroup.name : "";
      })
      .filter((name) => name !== "");

    // Pre-fill the full member form with new member data
    setFullMemberForm({
      fullName: selectedNewMember.fullName,
      email: selectedNewMember.email || "",
      phone: selectedNewMember.phoneNumber,
      dateOfBirth: selectedNewMember.dateOfBirth || "",
      gender: selectedNewMember.gender,
      maritalStatus: selectedNewMember.maritalStatus || "",
      address: selectedNewMember.address || "",
      emergencyContactName: selectedNewMember.emergencyContactName || "",
      emergencyContactPhone: selectedNewMember.emergencyContactPhone || "",
      employmentStatus: selectedNewMember.employmentStatus || "",
      membershipState: "Active",
      serviceGroups: memberServiceGroupNames, // Use mapped service group names
      bornAgain: selectedNewMember.bornAgain,
      baptized: selectedNewMember.baptized,
      baptismDate: selectedNewMember.baptismDate || "",
      bibleStudyCompleted: selectedNewMember.bibleStudyCompleted,
      bibleStudyCompletionDate:
        selectedNewMember.bibleStudyCompletionDate || "",
    });

    // Close the service groups selection dialog
    setShowTransferDialog(false);

    // Open the full member transfer dialog
    setShowFullMemberTransferDialog(true);
  };

  const handleFullMemberTransferSubmit = () => {
    if (!selectedNewMember || !user) {
      alert("Missing required information for transfer");
      return;
    }

    if (
      !fullMemberForm.fullName ||
      !fullMemberForm.email ||
      !fullMemberForm.phone ||
      !fullMemberForm.gender
    ) {
      alert(
        "Please fill in required fields: Full Name, Email, Phone, and Gender",
      );
      return;
    }

    if (!fullMemberForm.baptized) {
      alert("Baptism is required for full membership.");
      return;
    }

    // Create the full member using proper ID generation
    const existingFullMembers = transferService.getFullMembersData();
    const memberCount = existingFullMembers.length + 1;
    const currentYear = new Date().getFullYear();
    const memberId = `TSOAM${currentYear}-${memberCount.toString().padStart(3, "0")}`;
    const titheNumber = `TS-${currentYear}-${memberCount.toString().padStart(3, "0")}`;

    const newFullMember = {
      id: memberCount.toString(),
      memberId,
      titheNumber,
      fullName: fullMemberForm.fullName,
      email: fullMemberForm.email,
      phone: fullMemberForm.phone,
      dateOfBirth: fullMemberForm.dateOfBirth,
      gender: fullMemberForm.gender as "Male" | "Female",
      maritalStatus: fullMemberForm.maritalStatus as any,
      address: fullMemberForm.address,
      emergencyContactName: fullMemberForm.emergencyContactName,
      emergencyContactPhone: fullMemberForm.emergencyContactPhone,
      membershipStatus: fullMemberForm.membershipState as "Active" | "Inactive",
      yearOfJoining: currentYear,
      visitDate: selectedNewMember.visitDate,
      membershipDate: new Date().toISOString().split("T")[0],
      baptized: fullMemberForm.baptized,
      baptismDate: fullMemberForm.baptismDate,
      bibleStudyCompleted: fullMemberForm.bibleStudyCompleted,
      bibleStudyCompletionDate: fullMemberForm.bibleStudyCompletionDate,
      employmentStatus: fullMemberForm.employmentStatus as any,
      previousChurchName: "",
      reasonForLeavingPreviousChurch: "",
      reasonDetails: "",
      howHeardAboutUs: "New Member Transfer" as any,
      serviceGroups: fullMemberForm.serviceGroups,
      bornAgain: fullMemberForm.bornAgain,
      transferredFromNewMemberId: selectedNewMember.id.toString(),
      createdAt: new Date().toISOString(),
    };

    // Save to full members
    transferService.saveFullMembersData([
      ...existingFullMembers,
      newFullMember,
    ]);

    // Remove from new members list
    const updatedNewMembers = newMembers.filter(
      (member) => member.id !== selectedNewMember.id,
    );
    setNewMembers(updatedNewMembers);

    // Reset states and close dialogs
    setShowFullMemberTransferDialog(false);
    setSelectedNewMember(null);
    setTransferForm({ serviceGroups: [] });

    // Show success message
    alert(
      `Member successfully transferred to Full Membership!\nMember ID: ${memberId}\nTithe Number: ${titheNumber}\n\nThe member now appears in the Member Management directory.`,
    );
  };

  // Record Sunday attendance for a visitor
  const handleRecordAttendance = (visitor: TrackedVisitor) => {
    setSelectedVisitorForAttendance(visitor);
    setShowAttendanceDialog(true);
  };

  const handleAttendanceSubmit = () => {
    if (!selectedVisitorForAttendance) return;

    // Record attendance in visitor tracking service
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay()); // Get last Sunday

    visitorTrackingService.recordAttendance({
      visitorId: selectedVisitorForAttendance.visitorId,
      date: sunday.toISOString().split("T")[0],
      serviceType: "Morning Service",
      isFirstTime: false, // Not first time since they're already tracked
      bornAgain: false, // Born again status doesn't change here
      followUpRequired: false,
      notes: "Manually recorded attendance",
    });

    // Refresh tracked visitors
    const updatedVisitors = visitorTrackingService.getVisitors();
    setTrackedVisitors(updatedVisitors);

    setShowAttendanceDialog(false);
    setSelectedVisitorForAttendance(null);

    alert(
      `Sunday attendance recorded for ${selectedVisitorForAttendance.fullName}`,
    );
  };

  // Record milestones for new members (baptism, bible study completion)
  const handleRecordMilestone = (
    member: NewMember,
    type: "baptism" | "bible-study",
  ) => {
    setSelectedMemberForMilestone(member);
    setMilestoneType(type);
    setShowMilestoneDialog(true);
  };

  const handleMilestoneSubmit = () => {
    if (!selectedMemberForMilestone) return;

    const today = new Date().toISOString().split("T")[0];

    // Update the member in the list
    const updatedMembers = newMembers.map((member) => {
      if (member.id === selectedMemberForMilestone.id) {
        if (milestoneType === "baptism") {
          return {
            ...member,
            baptized: true,
            baptismDate: today,
          };
        } else {
          return {
            ...member,
            bibleStudyCompleted: true,
            bibleStudyCompletionDate: today,
          };
        }
      }
      return member;
    });

    setNewMembers(updatedMembers);
    setShowMilestoneDialog(false);
    setSelectedMemberForMilestone(null);

    const milestoneText =
      milestoneType === "baptism" ? "Baptism" : "Bible Study Completion";
    alert(
      `${milestoneText} recorded for ${selectedMemberForMilestone.fullName} on ${today}`,
    );
  };

  const filteredVisitors = visitors.filter(
    (visitor) =>
      visitor.fullName
        .toLowerCase()
        .includes(visitorsSearchTerm.toLowerCase()) ||
      visitor.visitorId
        .toLowerCase()
        .includes(visitorsSearchTerm.toLowerCase()),
  );

  const filteredNewMembers = newMembers.filter(
    (member) =>
      member.isActive &&
      (member.fullName
        .toLowerCase()
        .includes(newMembersSearchTerm.toLowerCase()) ||
        member.visitorId
          .toLowerCase()
          .includes(newMembersSearchTerm.toLowerCase())),
  );

  const eligibleMembers = filteredNewMembers.filter(
    (member) => member.eligibleForMembership,
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">New Members Management</h1>
            <p className="text-muted-foreground">
              Manage visitors register and new member registration
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Visitors
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visitors.length}</div>
              <p className="text-xs text-muted-foreground">This year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Members</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {newMembers.filter((m) => m.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">In process</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Eligible for Transfer
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eligibleMembers.length}</div>
              <p className="text-xs text-muted-foreground">
                Ready for full membership
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Follow-ups Required
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {visitors.filter((v) => v.followUpRequired).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Visitors to follow up
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="visitors">Visitors Register</TabsTrigger>
            <TabsTrigger value="visitor-tracking">Visitor Tracking</TabsTrigger>
            <TabsTrigger value="retention-analytics">
              Retention Analytics
            </TabsTrigger>
            <TabsTrigger value="new-members">Register New Member</TabsTrigger>
          </TabsList>

          {/* Visitors Register Tab */}
          <TabsContent value="visitors" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search visitors..."
                    value={visitorsSearchTerm}
                    onChange={(e) => setVisitorsSearchTerm(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      await exportService.export({
                        filename: `TSOAM_Visitors_Register_${new Date().toISOString().split("T")[0]}`,
                        title: "TSOAM Visitors Register",
                        subtitle: `Total Visitors: ${filteredVisitors.length}`,
                        data: filteredVisitors.map((v) => ({
                          "Visitor ID": v.visitorId,
                          "Full Name": v.fullName,
                          Phone: v.phoneNumber,
                          Purpose: v.purposeOfVisit,
                          "Current Church": v.currentChurch,
                          "How Heard": v.howHeardAboutUs,
                          "Visit Date": v.visitDate,
                          "Follow Up": v.followUpRequired ? "Yes" : "No",
                        })),
                        format: "excel",
                      });
                    } catch (error) {
                      console.error("Export failed:", error);
                      alert("Export failed: " + error.message);
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await exportService.export({
                        filename: `TSOAM_Visitors_Register_${new Date().toISOString().split("T")[0]}`,
                        title: "TSOAM Visitors Register",
                        subtitle: `Total Visitors: ${filteredVisitors.length}`,
                        data: filteredVisitors.map((v) => ({
                          "Visitor ID": v.visitorId,
                          "Full Name": v.fullName,
                          Phone: v.phoneNumber,
                          Purpose: v.purposeOfVisit,
                          "Current Church": v.currentChurch,
                          "How Heard": v.howHeardAboutUs,
                          "Visit Date": v.visitDate,
                          "Follow Up": v.followUpRequired ? "Yes" : "No",
                        })),
                        format: "pdf",
                      });
                    } catch (error) {
                      console.error("Export failed:", error);
                      alert("Export failed: " + error.message);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Dialog
                  open={showVisitorDialog}
                  onOpenChange={setShowVisitorDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Visitor
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Visitors Register</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Record information for church visitors
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Visit Date</TableHead>
                      <TableHead>Follow Up</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisitors.map((visitor) => (
                      <TableRow key={`visitor-${visitor.id}`}>
                        <TableCell className="font-medium">
                          {visitor.visitorId}
                        </TableCell>
                        <TableCell>{visitor.fullName}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {visitor.phoneNumber}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{visitor.purposeOfVisit}</TableCell>
                        <TableCell>
                          {new Date(visitor.visitDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {visitor.followUpRequired ? (
                            <Badge variant="default">Required</Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visitor Tracking Tab */}
          <TabsContent value="visitor-tracking" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Visitors
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      trackedVisitors.filter(
                        (v) => v.status === "Active Visitor",
                      ).length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently engaged
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ready for Promotion
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {
                      trackedVisitors.filter(
                        (v) =>
                          v.consecutiveSundays >= 3 && !v.promotedToNewMember,
                      ).length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    3+ consecutive Sundays
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Born Again
                  </CardTitle>
                  <Heart className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {trackedVisitors.filter((v) => v.bornAgain).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Salvation decisions
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2 mb-4">
              <Button
                onClick={async () => {
                  try {
                    await exportService.export({
                      filename: `TSOAM_Visitor_Tracking_${new Date().toISOString().split("T")[0]}`,
                      title: "TSOAM Visitor Tracking Report",
                      subtitle: `Total Tracked Visitors: ${trackedVisitors.length}`,
                      data: trackedVisitors.map((v) => ({
                        "Visitor ID": v.visitorId,
                        "Full Name": v.fullName,
                        Phone: v.phoneNumber,
                        Email: v.email || "N/A",
                        "Consecutive Sundays": v.consecutiveSundays,
                        "Total Visits": v.totalVisits,
                        "Born Again": v.bornAgain ? "Yes" : "No",
                        Status: v.status,
                        "Retention Score": `${v.retentionScore}%`,
                        "First Visit": v.firstVisitDate,
                        "Last Visit": v.lastVisitDate,
                      })),
                      format: "excel",
                    });
                  } catch (error) {
                    console.error("Export failed:", error);
                    alert("Export failed: " + error.message);
                  }
                }}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await exportService.export({
                      filename: `TSOAM_Visitor_Tracking_${new Date().toISOString().split("T")[0]}`,
                      title: "TSOAM Visitor Tracking Report",
                      subtitle: `Total Tracked Visitors: ${trackedVisitors.length}`,
                      data: trackedVisitors.map((v) => ({
                        "Visitor ID": v.visitorId,
                        "Full Name": v.fullName,
                        Phone: v.phoneNumber,
                        Email: v.email || "N/A",
                        "Consecutive Sundays": v.consecutiveSundays,
                        "Total Visits": v.totalVisits,
                        "Born Again": v.bornAgain ? "Yes" : "No",
                        Status: v.status,
                        "Retention Score": `${v.retentionScore}%`,
                        "First Visit": v.firstVisitDate,
                        "Last Visit": v.lastVisitDate,
                      })),
                      format: "pdf",
                    });
                  } catch (error) {
                    console.error("Export failed:", error);
                    alert("Export failed: " + error.message);
                  }
                }}
                variant="outline"
                size="sm"
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Visitor Tracking Dashboard</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track visitor attendance and automatic promotion to new member
                  status
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Consecutive Sundays</TableHead>
                      <TableHead>Total Visits</TableHead>
                      <TableHead>Born Again</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Retention Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trackedVisitors.map((visitor) => (
                      <TableRow key={`tracked-${visitor.id}`}>
                        <TableCell className="font-medium">
                          {visitor.visitorId}
                        </TableCell>
                        <TableCell>{visitor.fullName}</TableCell>
                        <TableCell>{visitor.phoneNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {visitor.consecutiveSundays}
                            </span>
                            {visitor.consecutiveSundays >= 3 &&
                              !visitor.promotedToNewMember && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800"
                                >
                                  Ready for Promotion
                                </Badge>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>{visitor.totalVisits}</TableCell>
                        <TableCell>
                          {visitor.bornAgain ? (
                            <Badge
                              variant="secondary"
                              className="bg-red-100 text-red-800"
                            >
                              <Heart className="h-3 w-3 mr-1" />
                              Yes
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              visitor.status === "Active Visitor"
                                ? "default"
                                : visitor.status === "Promoted to New Member"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={
                              visitor.status === "Promoted to New Member"
                                ? "bg-blue-100 text-blue-800"
                                : visitor.status === "Inactive"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : visitor.status === "Lost"
                                    ? "bg-red-100 text-red-800"
                                    : ""
                            }
                          >
                            {visitor.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${visitor.retentionScore}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {visitor.retentionScore}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {visitor.status !== "Promoted to New Member" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleRecordAttendance(visitor)
                                  }
                                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                  title="Record Sunday attendance"
                                >
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Mark Present
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVisitorTransfer(visitor)}
                                  className={
                                    visitor.consecutiveSundays >= 3
                                      ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                      : "bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                                  }
                                  disabled={visitor.consecutiveSundays < 3}
                                  title={
                                    visitor.consecutiveSundays >= 3
                                      ? "Eligible for promotion to New Member"
                                      : `Needs ${3 - visitor.consecutiveSundays} more consecutive Sunday${3 - visitor.consecutiveSundays === 1 ? "" : "s"} to be eligible`
                                  }
                                >
                                  <ArrowRight className="h-4 w-4 mr-1" />
                                  {visitor.consecutiveSundays >= 3
                                    ? "Transfer"
                                    : `${visitor.consecutiveSundays}/3 Sundays`}
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

          {/* Retention Analytics Tab */}
          <TabsContent value="retention-analytics" className="space-y-4">
            {retentionStats && conversionFunnel && (
              <>
                <div className="flex justify-end gap-2 mb-4">
                  <Button
                    onClick={async () => {
                      try {
                        await exportService.export({
                          filename: `TSOAM_Retention_Analytics_${new Date().toISOString().split("T")[0]}`,
                          title: "TSOAM Retention Analytics Report",
                          subtitle: `Period: ${retentionStats.startDate} to ${retentionStats.endDate}`,
                          data: [
                            {
                              Metric: "Total Visitors",
                              Value: retentionStats.totalVisitors,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "New Visitors",
                              Value: retentionStats.newVisitors,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "Return Visitors",
                              Value: retentionStats.returnVisitors,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "Retained Visitors",
                              Value: retentionStats.retainedVisitors,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "Retention Rate",
                              Value: `${retentionStats.retentionRate.toFixed(1)}%`,
                              Target: `${retentionStats.targetRetentionRate}%`,
                              Status:
                                retentionStats.retentionRate >=
                                retentionStats.targetRetentionRate
                                  ? "On Track"
                                  : "Needs Attention",
                            },
                            {
                              Metric: "Born Again Count",
                              Value: retentionStats.bornAgainCount,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "Born Again Rate",
                              Value: `${retentionStats.bornAgainRate.toFixed(1)}%`,
                              Target: `${retentionStats.targetBornAgainRate}%`,
                              Status:
                                retentionStats.bornAgainRate >=
                                retentionStats.targetBornAgainRate
                                  ? "On Track"
                                  : "Needs Attention",
                            },
                            {
                              Metric: "Promoted to New Members",
                              Value: retentionStats.promotedToNewMembers,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "Lost Visitors",
                              Value: retentionStats.lostVisitors,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "Overall Performance",
                              Value: retentionStats.isOnTrack
                                ? "On Track"
                                : "Needs Attention",
                              Target: "On Track",
                              Status: retentionStats.isOnTrack
                                ? "Meeting Targets"
                                : "Below Targets",
                            },
                          ],
                          format: "excel",
                        });
                      } catch (error) {
                        console.error("Export failed:", error);
                        alert("Export failed: " + error.message);
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        await exportService.export({
                          filename: `TSOAM_Retention_Analytics_${new Date().toISOString().split("T")[0]}`,
                          title: "TSOAM Retention Analytics Report",
                          subtitle: `Period: ${retentionStats.startDate} to ${retentionStats.endDate}`,
                          data: [
                            {
                              Metric: "Total Visitors",
                              Value: retentionStats.totalVisitors,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "New Visitors",
                              Value: retentionStats.newVisitors,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "Return Visitors",
                              Value: retentionStats.returnVisitors,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "Retained Visitors",
                              Value: retentionStats.retainedVisitors,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "Retention Rate",
                              Value: `${retentionStats.retentionRate.toFixed(1)}%`,
                              Target: `${retentionStats.targetRetentionRate}%`,
                              Status:
                                retentionStats.retentionRate >=
                                retentionStats.targetRetentionRate
                                  ? "On Track"
                                  : "Needs Attention",
                            },
                            {
                              Metric: "Born Again Count",
                              Value: retentionStats.bornAgainCount,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "Born Again Rate",
                              Value: `${retentionStats.bornAgainRate.toFixed(1)}%`,
                              Target: `${retentionStats.targetBornAgainRate}%`,
                              Status:
                                retentionStats.bornAgainRate >=
                                retentionStats.targetBornAgainRate
                                  ? "On Track"
                                  : "Needs Attention",
                            },
                            {
                              Metric: "Promoted to New Members",
                              Value: retentionStats.promotedToNewMembers,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "Lost Visitors",
                              Value: retentionStats.lostVisitors,
                              Target: "N/A",
                              Status: "N/A",
                            },
                            {
                              Metric: "Overall Performance",
                              Value: retentionStats.isOnTrack
                                ? "On Track"
                                : "Needs Attention",
                              Target: "On Track",
                              Status: retentionStats.isOnTrack
                                ? "Meeting Targets"
                                : "Below Targets",
                            },
                          ],
                          format: "pdf",
                        });
                      } catch (error) {
                        console.error("Export failed:", error);
                        alert("Export failed: " + error.message);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Retention Rate
                      </CardTitle>
                      <div
                        className={`h-4 w-4 rounded-full ${retentionStats.isOnTrack ? "bg-green-500" : "bg-red-500"}`}
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {retentionStats.retentionRate.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Target: {retentionStats.targetRetentionRate}%
                      </p>
                      <Progress
                        value={retentionStats.retentionRate}
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Born Again Rate
                      </CardTitle>
                      <Heart className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {retentionStats.bornAgainRate.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Target: {retentionStats.targetBornAgainRate}%
                      </p>
                      <Progress
                        value={retentionStats.bornAgainRate}
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Promoted to Members
                      </CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {retentionStats.promotedToNewMembers}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Performance Status
                      </CardTitle>
                      {retentionStats.isOnTrack ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${retentionStats.isOnTrack ? "text-green-600" : "text-red-500"}`}
                      >
                        {retentionStats.isOnTrack
                          ? "On Track"
                          : "Needs Attention"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {retentionStats.isOnTrack
                          ? "Meeting targets"
                          : "Below targets"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Statistics</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Visitor retention metrics for{" "}
                        {new Date(
                          retentionStats.startDate,
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(retentionStats.endDate).toLocaleDateString()}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">
                            Total Visitors
                          </div>
                          <div className="text-2xl font-bold">
                            {retentionStats.totalVisitors}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">
                            New Visitors
                          </div>
                          <div className="text-2xl font-bold">
                            {retentionStats.newVisitors}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">
                            Return Visitors
                          </div>
                          <div className="text-2xl font-bold">
                            {retentionStats.returnVisitors}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">
                            Retained (3+ visits)
                          </div>
                          <div className="text-2xl font-bold">
                            {retentionStats.retainedVisitors}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium mb-2">
                          Church Targets Assessment
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">
                              Retention Target (50%)
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {retentionStats.retentionRate.toFixed(1)}%
                              </span>
                              {retentionStats.retentionRate >=
                              retentionStats.targetRetentionRate ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">
                              Born Again Target (50%)
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {retentionStats.bornAgainRate.toFixed(1)}%
                              </span>
                              {retentionStats.bornAgainRate >=
                              retentionStats.targetBornAgainRate ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Conversion Funnel</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Visitor journey through engagement stages
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Total Visitors</span>
                          <span className="font-medium">
                            {conversionFunnel.totalVisitors}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-l-4 border-blue-500 pl-4">
                          <span className="text-sm">First Time Visitors</span>
                          <div className="text-right">
                            <span className="font-medium">
                              {conversionFunnel.firstTimeVisitors}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {(
                                (conversionFunnel.firstTimeVisitors /
                                  conversionFunnel.totalVisitors) *
                                100
                              ).toFixed(1)}
                              %
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-l-4 border-green-500 pl-4">
                          <span className="text-sm">Second Time Visitors</span>
                          <div className="text-right">
                            <span className="font-medium">
                              {conversionFunnel.secondTimeVisitors}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {conversionFunnel.conversionRates.firstToSecond.toFixed(
                                1,
                              )}
                              % conversion
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-l-4 border-yellow-500 pl-4">
                          <span className="text-sm">Third Time Visitors</span>
                          <div className="text-right">
                            <span className="font-medium">
                              {conversionFunnel.thirdTimeVisitors}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {conversionFunnel.conversionRates.secondToThird.toFixed(
                                1,
                              )}
                              % conversion
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-l-4 border-purple-500 pl-4">
                          <span className="text-sm">
                            Retained Visitors (3+)
                          </span>
                          <div className="text-right">
                            <span className="font-medium">
                              {conversionFunnel.retainedVisitors}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {conversionFunnel.conversionRates.thirdToRetained.toFixed(
                                1,
                              )}
                              % retention
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-l-4 border-red-500 pl-4">
                          <span className="text-sm">Born Again Visitors</span>
                          <div className="text-right">
                            <span className="font-medium">
                              {conversionFunnel.bornAgainVisitors}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {conversionFunnel.conversionRates.retainedToBornAgain.toFixed(
                                1,
                              )}
                              % conversion
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium mb-2">
                          Key Insights
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>
                            • For every 10 visitors, church targets to retain 5
                            (50%)
                          </div>
                          <div>
                            • Of retained visitors, church aims for 50% to get
                            born again
                          </div>
                          <div>
                            • Visitors with 3+ consecutive Sundays auto-promote
                            to New Members
                          </div>
                          <div>
                            • Track weekly, monthly, and yearly trends for
                            strategic planning
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* New Members Tab */}
          <TabsContent value="new-members" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search new members..."
                    value={newMembersSearchTerm}
                    onChange={(e) => setNewMembersSearchTerm(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      await exportService.export({
                        filename: `TSOAM_New_Members_${new Date().toISOString().split("T")[0]}`,
                        title: "TSOAM New Members Report",
                        subtitle: `Total New Members: ${filteredNewMembers.length}`,
                        data: filteredNewMembers.map((m) => ({
                          "Visitor ID": m.visitorId,
                          "Full Name": m.fullName,
                          Phone: m.phoneNumber,
                          Email: m.email,
                          Employment: m.employmentStatus,
                          "Days as New Member": m.daysAsNewMember,
                          Baptized: m.baptized ? "Yes" : "No",
                          "Bible Study": m.bibleStudyCompleted ? "Yes" : "No",
                          Eligible: m.eligibleForMembership ? "Yes" : "No",
                        })),
                        format: "excel",
                      });
                    } catch (error) {
                      console.error("Export failed:", error);
                      alert("Export failed: " + error.message);
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await exportService.export({
                        filename: `TSOAM_New_Members_${new Date().toISOString().split("T")[0]}`,
                        title: "TSOAM New Members Report",
                        subtitle: `Total New Members: ${filteredNewMembers.length}`,
                        data: filteredNewMembers.map((m) => ({
                          "Visitor ID": m.visitorId,
                          "Full Name": m.fullName,
                          Phone: m.phoneNumber,
                          Email: m.email,
                          Employment: m.employmentStatus,
                          "Days as New Member": m.daysAsNewMember,
                          Baptized: m.baptized ? "Yes" : "No",
                          "Bible Study": m.bibleStudyCompleted ? "Yes" : "No",
                          Eligible: m.eligibleForMembership ? "Yes" : "No",
                        })),
                        format: "pdf",
                      });
                    } catch (error) {
                      console.error("Export failed:", error);
                      alert("Export failed: " + error.message);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Dialog
                  open={showNewMemberDialog}
                  onOpenChange={handleNewMemberDialogClose}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Register New Member
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>New Members</CardTitle>
                <p className="text-sm text-muted-foreground">
                  People who have decided to join the church and are in the
                  process of becoming full members
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Eligible</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNewMembers.map((member) => {
                      const progressPercentage = Math.min(
                        (member.daysAsNewMember / 180) * 100,
                        100,
                      );
                      const requirementsMet = [
                        member.daysAsNewMember >= 180,
                        member.baptized,
                        member.bibleStudyCompleted,
                      ].filter(Boolean).length;

                      // Calculate eligibility: 6+ months (180 days), baptized, and bible study completed
                      const isEligibleForTransfer =
                        member.daysAsNewMember >= 180 &&
                        member.baptized &&
                        member.bibleStudyCompleted;

                      return (
                        <TableRow
                          key={`newmember-${member.id}-${member.visitorId}-${member.fullName.replace(/\s+/g, "")}`}
                        >
                          <TableCell className="font-medium">
                            {member.visitorId}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {member.fullName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {member.employmentStatus}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {member.phoneNumber}
                              </div>
                              {member.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" />
                                  {member.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{progressPercentage.toFixed(0)}%</span>
                              </div>
                              <Progress
                                value={progressPercentage}
                                className="w-[100px]"
                              />
                              <div className="text-xs text-muted-foreground">
                                {requirementsMet}/3 requirements met
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {member.daysAsNewMember}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {member.daysAsNewMember >= 180
                                  ? "6+ months"
                                  : `${Math.ceil((180 - member.daysAsNewMember) / 30)} months left`}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isEligibleForTransfer ? (
                              <Badge className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ready for Transfer
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                In Progress
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedNewMember(member);
                                  setShowViewNewMemberDialog(true);
                                }}
                                title="View Member Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedNewMember(member);
                                  setShowEditNewMemberDialog(true);
                                }}
                                className="hover:bg-red-50 border-red-200"
                                title="Edit New Member Details"
                              >
                                <Edit
                                  className="h-4 w-4"
                                  style={{ color: "#800020" }}
                                />
                              </Button>

                              {/* Baptism tracking */}
                              {!member.baptized && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleRecordMilestone(member, "baptism")
                                  }
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                  title="Mark as baptized"
                                >
                                  <Heart className="h-4 w-4 mr-1" />
                                  Baptized
                                </Button>
                              )}

                              {/* Bible study tracking */}
                              {!member.bibleStudyCompleted && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleRecordMilestone(member, "bible-study")
                                  }
                                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                                  title="Mark bible study as completed"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Bible Study
                                </Button>
                              )}

                              {isEligibleForTransfer && (
                                <Button
                                  size="sm"
                                  className="bg-red-900 hover:bg-red-800"
                                  onClick={() => {
                                    setSelectedNewMember(member);
                                    // Pre-populate transfer form with member's existing service groups
                                    const memberServiceGroupNames =
                                      member.serviceGroups
                                        .map((groupId) => {
                                          const serviceGroup =
                                            serviceGroups.find(
                                              (sg) => sg.id === groupId,
                                            );
                                          return serviceGroup
                                            ? serviceGroup.name
                                            : "";
                                        })
                                        .filter((name) => name !== "");
                                    setTransferForm({
                                      serviceGroups: memberServiceGroupNames,
                                    });
                                    setShowTransferDialog(true);
                                  }}
                                >
                                  <ArrowRight className="h-4 w-4 mr-1" />
                                  Transfer to Full Member
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Record Visitor Dialog */}
        <Dialog open={showVisitorDialog} onOpenChange={setShowVisitorDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Visitor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visitorName">Full Name *</Label>
                    <Input
                      id="visitorName"
                      value={visitorForm.fullName}
                      onChange={(e) =>
                        setVisitorForm({
                          ...visitorForm,
                          fullName: e.target.value,
                        })
                      }
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visitorPhone">Phone Number *</Label>
                    <Input
                      id="visitorPhone"
                      value={visitorForm.phoneNumber}
                      onChange={(e) =>
                        setVisitorForm({
                          ...visitorForm,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purposeOfVisit">Purpose of Visit</Label>
                    <Select
                      value={visitorForm.purposeOfVisit}
                      onValueChange={(value) =>
                        setVisitorForm({
                          ...visitorForm,
                          purposeOfVisit: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        {purposeOfVisitOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentChurch">Current Church</Label>
                    <Input
                      id="currentChurch"
                      value={visitorForm.currentChurch}
                      onChange={(e) =>
                        setVisitorForm({
                          ...visitorForm,
                          currentChurch: e.target.value,
                        })
                      }
                      placeholder="Enter current church"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="howHeard">How did you hear about us?</Label>
                  <Select
                    value={visitorForm.howHeardAboutUs}
                    onValueChange={(value) =>
                      setVisitorForm({ ...visitorForm, howHeardAboutUs: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {howHeardOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatLiked">
                    What did you like most about our church?
                  </Label>
                  <Textarea
                    id="whatLiked"
                    value={visitorForm.whatLikedMost}
                    onChange={(e) =>
                      setVisitorForm({
                        ...visitorForm,
                        whatLikedMost: e.target.value,
                      })
                    }
                    placeholder="Share your thoughts..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prayer Requests (Select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {prayerRequestOptions.map((request) => (
                      <div
                        key={request}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={request}
                          checked={visitorForm.prayerRequests.includes(request)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setVisitorForm({
                                ...visitorForm,
                                prayerRequests: [
                                  ...visitorForm.prayerRequests,
                                  request,
                                ],
                              });
                            } else {
                              setVisitorForm({
                                ...visitorForm,
                                prayerRequests:
                                  visitorForm.prayerRequests.filter(
                                    (r) => r !== request,
                                  ),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={request} className="text-sm">
                          {request}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="followUp"
                    checked={visitorForm.followUpRequired}
                    onCheckedChange={(checked) =>
                      setVisitorForm({
                        ...visitorForm,
                        followUpRequired: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="followUp">Follow-up required</Label>
                </div>

                {visitorForm.followUpRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="followUpNotes">Follow-up Notes</Label>
                    <Textarea
                      id="followUpNotes"
                      value={visitorForm.followUpNotes}
                      onChange={(e) =>
                        setVisitorForm({
                          ...visitorForm,
                          followUpNotes: e.target.value,
                        })
                      }
                      placeholder="Add follow-up notes..."
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowVisitorDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleVisitorSubmit}>Record Visitor</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Register New Member Dialog */}
        <Dialog
          open={showNewMemberDialog}
          onOpenChange={handleNewMemberDialogClose}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Member</DialogTitle>
              {transferredVisitorId && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800"
                  >
                    Visitor ID: {transferredVisitorId}
                  </Badge>
                  <span>
                    This member is being transferred from the visitors register
                  </span>
                </div>
              )}
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
                      value={newMemberForm.fullName}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          fullName: e.target.value,
                        })
                      }
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={newMemberForm.gender}
                      onValueChange={(value) =>
                        setNewMemberForm({ ...newMemberForm, gender: value })
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={newMemberForm.dateOfBirth}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select
                      value={newMemberForm.maritalStatus}
                      onValueChange={(value) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          maritalStatus: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
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
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={newMemberForm.phoneNumber}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMemberForm.email}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newMemberForm.address}
                    onChange={(e) =>
                      setNewMemberForm({
                        ...newMemberForm,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter physical address"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">
                      Emergency Contact Name
                    </Label>
                    <Input
                      id="emergencyContactName"
                      value={newMemberForm.emergencyContactName}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          emergencyContactName: e.target.value,
                        })
                      }
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">
                      Emergency Contact Phone
                    </Label>
                    <Input
                      id="emergencyContactPhone"
                      value={newMemberForm.emergencyContactPhone}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          emergencyContactPhone: e.target.value,
                        })
                      }
                      placeholder="Enter emergency contact phone"
                    />
                  </div>
                </div>
              </div>

              {/* Church Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Church Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employmentStatus">Employment Status</Label>
                    <Select
                      value={newMemberForm.employmentStatus}
                      onValueChange={(value) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          employmentStatus: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment status" />
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
                  <div className="space-y-2">
                    <Label htmlFor="previousChurch">Previous Church</Label>
                    <Input
                      id="previousChurch"
                      value={newMemberForm.previousChurchName}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          previousChurchName: e.target.value,
                        })
                      }
                      placeholder="Enter previous church name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reasonForLeaving">
                    Reason for Leaving Previous Church
                  </Label>
                  <Select
                    value={newMemberForm.reasonForLeavingPreviousChurch}
                    onValueChange={(value) =>
                      setNewMemberForm({
                        ...newMemberForm,
                        reasonForLeavingPreviousChurch: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Suspension">Suspension</SelectItem>
                      <SelectItem value="Termination">Termination</SelectItem>
                      <SelectItem value="Self-Evolution">
                        Self-Evolution
                      </SelectItem>
                      <SelectItem value="Relocation">Relocation</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newMemberForm.reasonForLeavingPreviousChurch === "Other" && (
                  <div className="space-y-2">
                    <Label htmlFor="reasonDetails">Reason Details</Label>
                    <Textarea
                      id="reasonDetails"
                      value={newMemberForm.reasonDetails}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          reasonDetails: e.target.value,
                        })
                      }
                      placeholder="Provide details..."
                      rows={2}
                    />
                  </div>
                )}
              </div>

              {/* Service Groups */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service Groups</h3>
                <div className="grid grid-cols-2 gap-2">
                  {serviceGroups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={newMemberForm.serviceGroups.includes(group.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewMemberForm({
                              ...newMemberForm,
                              serviceGroups: [
                                ...newMemberForm.serviceGroups,
                                group.id,
                              ],
                            });
                          } else {
                            setNewMemberForm({
                              ...newMemberForm,
                              serviceGroups: newMemberForm.serviceGroups.filter(
                                (id) => id !== group.id,
                              ),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`group-${group.id}`} className="text-sm">
                        {group.name}
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
                      id="bornAgain"
                      checked={newMemberForm.bornAgain}
                      onCheckedChange={(checked) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          bornAgain: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="bornAgain">Born Again</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="baptized"
                      checked={newMemberForm.baptized}
                      onCheckedChange={(checked) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          baptized: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="baptized">Baptized</Label>
                  </div>
                </div>

                {newMemberForm.baptized && (
                  <div className="space-y-2">
                    <Label htmlFor="baptismDate">Baptism Date</Label>
                    <Input
                      id="baptismDate"
                      type="date"
                      value={newMemberForm.baptismDate}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          baptismDate: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bibleStudy"
                    checked={newMemberForm.bibleStudyCompleted}
                    onCheckedChange={(checked) =>
                      setNewMemberForm({
                        ...newMemberForm,
                        bibleStudyCompleted: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="bibleStudy">Bible Study Completed</Label>
                </div>

                {newMemberForm.bibleStudyCompleted && (
                  <div className="space-y-2">
                    <Label htmlFor="bibleStudyDate">
                      Bible Study Completion Date
                    </Label>
                    <Input
                      id="bibleStudyDate"
                      type="date"
                      value={newMemberForm.bibleStudyCompletionDate}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          bibleStudyCompletionDate: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleNewMemberDialogClose(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleNewMemberSubmit}>
                  Register New Member
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transfer to Full Membership Dialog */}
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer to Full Membership</DialogTitle>
            </DialogHeader>
            {selectedNewMember && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Member Details</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Name:</strong> {selectedNewMember.fullName}
                    </div>
                    <div>
                      <strong>Days as New Member:</strong>{" "}
                      {selectedNewMember.daysAsNewMember}
                    </div>
                    <div>
                      <strong>Baptized:</strong>{" "}
                      {selectedNewMember.baptized ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Bible Study:</strong>{" "}
                      {selectedNewMember.bibleStudyCompleted ? "Yes" : "No"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Service Groups</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
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
                    ].map((group) => (
                      <div
                        key={`transfer-select-${group}`}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`transfer-select-${group}`}
                          checked={transferForm.serviceGroups.includes(group)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTransferForm({
                                ...transferForm,
                                serviceGroups: [
                                  ...transferForm.serviceGroups,
                                  group,
                                ],
                              });
                            } else {
                              setTransferForm({
                                ...transferForm,
                                serviceGroups:
                                  transferForm.serviceGroups.filter(
                                    (sg) => sg !== group,
                                  ),
                              });
                            }
                          }}
                        />
                        <Label
                          htmlFor={`transfer-select-${group}`}
                          className="text-sm"
                        >
                          {group}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowTransferDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleTransferToFullMembership}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Transfer to Full Membership
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Full Member Transfer Dialog */}
        <Dialog
          open={showFullMemberTransferDialog}
          onOpenChange={setShowFullMemberTransferDialog}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transfer to Full Member</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Completing the transfer of {selectedNewMember?.fullName} to Full
                Membership. Information has been pre-filled from their new
                member record.
              </p>
            </DialogHeader>
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transferFullName">Full Name *</Label>
                    <Input
                      id="transferFullName"
                      value={fullMemberForm.fullName}
                      onChange={(e) =>
                        setFullMemberForm({
                          ...fullMemberForm,
                          fullName: e.target.value,
                        })
                      }
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferGender">Gender *</Label>
                    <Select
                      value={fullMemberForm.gender}
                      onValueChange={(value) =>
                        setFullMemberForm({ ...fullMemberForm, gender: value })
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
                    <Label htmlFor="transferDateOfBirth">Date of Birth</Label>
                    <Input
                      id="transferDateOfBirth"
                      type="date"
                      value={fullMemberForm.dateOfBirth}
                      onChange={(e) =>
                        setFullMemberForm({
                          ...fullMemberForm,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferMaritalStatus">
                      Marital Status
                    </Label>
                    <Select
                      value={fullMemberForm.maritalStatus}
                      onValueChange={(value) =>
                        setFullMemberForm({
                          ...fullMemberForm,
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
                    <Label htmlFor="transferPhone">Phone Number *</Label>
                    <Input
                      id="transferPhone"
                      value={fullMemberForm.phone}
                      onChange={(e) =>
                        setFullMemberForm({
                          ...fullMemberForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferEmail">Email Address *</Label>
                    <Input
                      id="transferEmail"
                      type="email"
                      value={fullMemberForm.email}
                      onChange={(e) =>
                        setFullMemberForm({
                          ...fullMemberForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transferAddress">Address</Label>
                  <Textarea
                    id="transferAddress"
                    value={fullMemberForm.address}
                    onChange={(e) =>
                      setFullMemberForm({
                        ...fullMemberForm,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter physical address"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transferEmergencyContactName">
                      Emergency Contact Name
                    </Label>
                    <Input
                      id="transferEmergencyContactName"
                      value={fullMemberForm.emergencyContactName}
                      onChange={(e) =>
                        setFullMemberForm({
                          ...fullMemberForm,
                          emergencyContactName: e.target.value,
                        })
                      }
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferEmergencyContactPhone">
                      Emergency Contact Phone
                    </Label>
                    <Input
                      id="transferEmergencyContactPhone"
                      value={fullMemberForm.emergencyContactPhone}
                      onChange={(e) =>
                        setFullMemberForm({
                          ...fullMemberForm,
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
                    <Label htmlFor="transferMembershipNumber">
                      Membership Number
                    </Label>
                    <Input
                      id="transferMembershipNumber"
                      value="Auto-generated"
                      disabled
                      className="bg-gray-50"
                      placeholder="TSOAM2025-XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferTitheNumber">Tithe Number</Label>
                    <Input
                      id="transferTitheNumber"
                      value="Auto-generated"
                      disabled
                      className="bg-gray-50"
                      placeholder="TS-2025-XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferMembershipDate">
                      Membership Date
                    </Label>
                    <Input
                      id="transferMembershipDate"
                      type="date"
                      value={new Date().toISOString().split("T")[0]}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferEmploymentStatus">
                      Employment Status
                    </Label>
                    <Select
                      value={fullMemberForm.employmentStatus}
                      onValueChange={(value) =>
                        setFullMemberForm({
                          ...fullMemberForm,
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
                    <Label htmlFor="transferMembershipState">
                      Membership State
                    </Label>
                    <Select
                      value={fullMemberForm.membershipState}
                      onValueChange={(value) =>
                        setFullMemberForm({
                          ...fullMemberForm,
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

              {/* Spiritual Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Spiritual Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="transferBornAgain"
                      checked={fullMemberForm.bornAgain}
                      onCheckedChange={(checked) =>
                        setFullMemberForm({
                          ...fullMemberForm,
                          bornAgain: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="transferBornAgain">Born Again</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="transferBaptized"
                      checked={fullMemberForm.baptized}
                      onCheckedChange={(checked) =>
                        setFullMemberForm({
                          ...fullMemberForm,
                          baptized: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="transferBaptized">
                      Baptized (Required for Full Membership)
                    </Label>
                  </div>
                </div>

                {fullMemberForm.baptized && (
                  <div className="space-y-2">
                    <Label htmlFor="transferBaptismDate">Baptism Date</Label>
                    <Input
                      id="transferBaptismDate"
                      type="date"
                      value={fullMemberForm.baptismDate}
                      onChange={(e) =>
                        setFullMemberForm({
                          ...fullMemberForm,
                          baptismDate: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transferBibleStudy"
                    checked={fullMemberForm.bibleStudyCompleted}
                    onCheckedChange={(checked) =>
                      setFullMemberForm({
                        ...fullMemberForm,
                        bibleStudyCompleted: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="transferBibleStudy">
                    Bible Study Completed
                  </Label>
                </div>

                {fullMemberForm.bibleStudyCompleted && (
                  <div className="space-y-2">
                    <Label htmlFor="transferBibleStudyDate">
                      Bible Study Completion Date
                    </Label>
                    <Input
                      id="transferBibleStudyDate"
                      type="date"
                      value={fullMemberForm.bibleStudyCompletionDate}
                      onChange={(e) =>
                        setFullMemberForm({
                          ...fullMemberForm,
                          bibleStudyCompletionDate: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Service Groups */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service Groups</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Choir",
                    "Ushering",
                    "Youth",
                    "Prayer Team",
                    "Media",
                    "Cleaning",
                    "Security",
                    "Children Ministry",
                  ].map((group) => (
                    <div
                      key={`fullmember-${group}`}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`fullmember-${group}`}
                        checked={fullMemberForm.serviceGroups.includes(group)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFullMemberForm({
                              ...fullMemberForm,
                              serviceGroups: [
                                ...fullMemberForm.serviceGroups,
                                group,
                              ],
                            });
                          } else {
                            setFullMemberForm({
                              ...fullMemberForm,
                              serviceGroups:
                                fullMemberForm.serviceGroups.filter(
                                  (sg) => sg !== group,
                                ),
                            });
                          }
                        }}
                      />
                      <Label
                        htmlFor={`fullmember-${group}`}
                        className="text-sm"
                      >
                        {group}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFullMemberTransferDialog(false);
                    setSelectedNewMember(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFullMemberTransferSubmit}
                  className="bg-red-900 hover:bg-red-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Complete Transfer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sunday Attendance Recording Dialog */}
        <Dialog
          open={showAttendanceDialog}
          onOpenChange={setShowAttendanceDialog}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Record Sunday Attendance</DialogTitle>
            </DialogHeader>
            {selectedVisitorForAttendance && (
              <div className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">
                    {selectedVisitorForAttendance.fullName}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Visitor ID: {selectedVisitorForAttendance.visitorId}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current consecutive Sundays:{" "}
                    {selectedVisitorForAttendance.consecutiveSundays}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">
                      Recording attendance for this Sunday
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Date: {new Date().toLocaleDateString()}
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAttendanceDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAttendanceSubmit}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Record Attendance
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Milestone Recording Dialog */}
        <Dialog
          open={showMilestoneDialog}
          onOpenChange={setShowMilestoneDialog}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                Record{" "}
                {milestoneType === "baptism"
                  ? "Baptism"
                  : "Bible Study Completion"}
              </DialogTitle>
            </DialogHeader>
            {selectedMemberForMilestone && (
              <div className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">
                    {selectedMemberForMilestone.fullName}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Visitor ID: {selectedMemberForMilestone.visitorId}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Days as New Member:{" "}
                    {selectedMemberForMilestone.daysAsNewMember}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg ${
                    milestoneType === "baptism" ? "bg-blue-50" : "bg-purple-50"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 ${
                      milestoneType === "baptism"
                        ? "text-blue-800"
                        : "text-purple-800"
                    }`}
                  >
                    {milestoneType === "baptism" ? (
                      <Heart className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {milestoneType === "baptism"
                        ? "Recording Baptism"
                        : "Recording Bible Study Completion"}
                    </span>
                  </div>
                  <p
                    className={`text-sm mt-1 ${
                      milestoneType === "baptism"
                        ? "text-blue-700"
                        : "text-purple-700"
                    }`}
                  >
                    Date: {new Date().toLocaleDateString()}
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      milestoneType === "baptism"
                        ? "text-blue-600"
                        : "text-purple-600"
                    }`}
                  >
                    {milestoneType === "baptism"
                      ? "This will mark the member as baptized and set the baptism date."
                      : "This will mark the bible study as completed and set the completion date."}
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowMilestoneDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleMilestoneSubmit}
                    className={
                      milestoneType === "baptism"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-purple-600 hover:bg-purple-700"
                    }
                  >
                    {milestoneType === "baptism" ? (
                      <Heart className="h-4 w-4 mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Record{" "}
                    {milestoneType === "baptism" ? "Baptism" : "Bible Study"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit New Member Dialog - Comprehensive Form */}
        <Dialog
          open={showEditNewMemberDialog}
          onOpenChange={setShowEditNewMemberDialog}
        >
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" style={{ color: "#800020" }} />
                Edit New Member Details - {selectedNewMember?.fullName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Update new member information and tracking details
              </p>
            </DialogHeader>
            {selectedNewMember && (
              <div className="space-y-6">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Personal Info</TabsTrigger>
                    <TabsTrigger value="contact">
                      Contact & Emergency
                    </TabsTrigger>
                    <TabsTrigger value="spiritual">
                      Spiritual Journey
                    </TabsTrigger>
                    <TabsTrigger value="background">Background</TabsTrigger>
                  </TabsList>

                  {/* Personal Information Tab */}
                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-newmember-fullName">
                          Full Name *
                        </Label>
                        <Input
                          id="edit-newmember-fullName"
                          defaultValue={selectedNewMember.fullName}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-newmember-dateOfBirth">
                          Date of Birth
                        </Label>
                        <Input
                          id="edit-newmember-dateOfBirth"
                          type="date"
                          defaultValue={selectedNewMember.dateOfBirth}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-newmember-gender">Gender</Label>
                        <Select defaultValue={selectedNewMember.gender}>
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
                        <Label htmlFor="edit-newmember-maritalStatus">
                          Marital Status
                        </Label>
                        <Select defaultValue={selectedNewMember.maritalStatus}>
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
                        <Label htmlFor="edit-newmember-employmentStatus">
                          Employment Status
                        </Label>
                        <Select
                          defaultValue={selectedNewMember.employmentStatus}
                        >
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
                        <Label htmlFor="edit-newmember-visitDate">
                          Original Visit Date
                        </Label>
                        <Input
                          id="edit-newmember-visitDate"
                          type="date"
                          defaultValue={selectedNewMember.visitDate}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Contact & Emergency Tab */}
                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-newmember-email">
                          Email Address
                        </Label>
                        <Input
                          id="edit-newmember-email"
                          type="email"
                          defaultValue={selectedNewMember.email}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-newmember-phone">
                          Phone Number
                        </Label>
                        <Input
                          id="edit-newmember-phone"
                          defaultValue={selectedNewMember.phoneNumber}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="edit-newmember-address">
                          Home Address
                        </Label>
                        <Textarea
                          id="edit-newmember-address"
                          defaultValue={selectedNewMember.address}
                          placeholder="Enter complete home address"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-newmember-emergencyContactName">
                          Emergency Contact Name
                        </Label>
                        <Input
                          id="edit-newmember-emergencyContactName"
                          defaultValue={selectedNewMember.emergencyContactName}
                          placeholder="Emergency contact full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-newmember-emergencyContactPhone">
                          Emergency Contact Phone
                        </Label>
                        <Input
                          id="edit-newmember-emergencyContactPhone"
                          defaultValue={selectedNewMember.emergencyContactPhone}
                          placeholder="Emergency contact phone number"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Spiritual Journey Tab */}
                  <TabsContent value="spiritual" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-newmember-bornAgain"
                          defaultChecked={selectedNewMember.bornAgain}
                        />
                        <Label htmlFor="edit-newmember-bornAgain">
                          Born Again
                        </Label>
                      </div>
                    </div>

                    {/* Baptism Details */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Baptism Status</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="edit-newmember-baptized"
                            defaultChecked={selectedNewMember.baptized}
                          />
                          <Label htmlFor="edit-newmember-baptized">
                            Baptized
                          </Label>
                        </div>
                        <div>
                          <Label htmlFor="edit-newmember-baptismDate">
                            Baptism Date
                          </Label>
                          <Input
                            id="edit-newmember-baptismDate"
                            type="date"
                            defaultValue={selectedNewMember.baptismDate || ""}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bible Study Details */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">
                        Bible Study Progress
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="edit-newmember-bibleStudyCompleted"
                            defaultChecked={
                              selectedNewMember.bibleStudyCompleted
                            }
                          />
                          <Label htmlFor="edit-newmember-bibleStudyCompleted">
                            Bible Study Completed
                          </Label>
                        </div>
                        <div>
                          <Label htmlFor="edit-newmember-bibleStudyCompletionDate">
                            Completion Date
                          </Label>
                          <Input
                            id="edit-newmember-bibleStudyCompletionDate"
                            type="date"
                            defaultValue={
                              selectedNewMember.bibleStudyCompletionDate || ""
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Service Groups */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Service Groups</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {serviceGroups.map((group) => (
                          <div
                            key={group.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`edit-${group.id}`}
                              defaultChecked={selectedNewMember.serviceGroups.includes(
                                group.id,
                              )}
                            />
                            <Label
                              htmlFor={`edit-${group.id}`}
                              className="text-sm"
                            >
                              {group.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Membership Progress */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">
                        Membership Progress
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress to Full Membership</span>
                          <span>
                            {Math.min(
                              (selectedNewMember.daysAsNewMember / 180) * 100,
                              100,
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                        <Progress
                          value={Math.min(
                            (selectedNewMember.daysAsNewMember / 180) * 100,
                            100,
                          )}
                          className="w-full"
                        />
                        <div className="text-xs text-muted-foreground mt-2">
                          {selectedNewMember.daysAsNewMember} days as new member
                          {selectedNewMember.daysAsNewMember >= 180
                            ? " - Eligible for transfer!"
                            : ` - ${Math.ceil((180 - selectedNewMember.daysAsNewMember) / 30)} months remaining`}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Background Tab */}
                  <TabsContent value="background" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-newmember-howHeardAboutUs">
                          How did you hear about our church?
                        </Label>
                        <Select
                          defaultValue={selectedNewMember.howHeardAboutUs}
                        >
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
                        <Label htmlFor="edit-newmember-previousChurchName">
                          Previous Church Name (if any)
                        </Label>
                        <Input
                          id="edit-newmember-previousChurchName"
                          defaultValue={selectedNewMember.previousChurchName}
                          placeholder="Enter previous church name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-newmember-reasonForLeavingPreviousChurch">
                          Reason for Leaving Previous Church
                        </Label>
                        <Select
                          defaultValue={
                            selectedNewMember.reasonForLeavingPreviousChurch
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
                        <Label htmlFor="edit-newmember-reasonDetails">
                          Additional Details
                        </Label>
                        <Textarea
                          id="edit-newmember-reasonDetails"
                          defaultValue={selectedNewMember.reasonDetails || ""}
                          placeholder="Provide additional details if necessary"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-newmember-churchFeedback">
                          Church Feedback
                        </Label>
                        <Textarea
                          id="edit-newmember-churchFeedback"
                          defaultValue={selectedNewMember.churchFeedback || ""}
                          placeholder="Any feedback about the church"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-newmember-prayerRequests">
                          Prayer Requests
                        </Label>
                        <Textarea
                          id="edit-newmember-prayerRequests"
                          defaultValue={selectedNewMember.prayerRequests || ""}
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
                      alert("New member details updated successfully!");
                      setShowEditNewMemberDialog(false);
                    }}
                    className="text-white hover:opacity-90"
                    style={{ backgroundColor: "#800020" }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update Member Details
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditNewMemberDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View New Member Dialog - Comprehensive Display */}
        <Dialog
          open={showViewNewMemberDialog}
          onOpenChange={setShowViewNewMemberDialog}
        >
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" style={{ color: "#800020" }} />
                New Member Details - {selectedNewMember?.fullName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Complete information and progress tracking
              </p>
            </DialogHeader>
            {selectedNewMember && (
              <div className="space-y-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="contact">Contact Info</TabsTrigger>
                    <TabsTrigger value="spiritual">
                      Spiritual Journey
                    </TabsTrigger>
                    <TabsTrigger value="background">Background</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3
                          className="text-lg font-semibold"
                          style={{ color: "#800020" }}
                        >
                          Basic Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-medium">Visitor ID:</span>
                            <span>{selectedNewMember.visitorId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Full Name:</span>
                            <span>{selectedNewMember.fullName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Gender:</span>
                            <span>{selectedNewMember.gender}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Date of Birth:</span>
                            <span>
                              {selectedNewMember.dateOfBirth || "Not provided"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Marital Status:</span>
                            <span>{selectedNewMember.maritalStatus}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Employment:</span>
                            <span>{selectedNewMember.employmentStatus}</span>
                          </div>
                        </div>
                      </div>

                      {/* Membership Progress */}
                      <div className="space-y-4">
                        <h3
                          className="text-lg font-semibold"
                          style={{ color: "#800020" }}
                        >
                          Membership Progress
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-medium">Visit Date:</span>
                            <span>
                              {new Date(
                                selectedNewMember.visitDate,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">
                              Days as New Member:
                            </span>
                            <span>
                              {selectedNewMember.daysAsNewMember} days
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress to Full Membership</span>
                              <span>
                                {Math.min(
                                  (selectedNewMember.daysAsNewMember / 180) *
                                    100,
                                  100,
                                ).toFixed(0)}
                                %
                              </span>
                            </div>
                            <Progress
                              value={Math.min(
                                (selectedNewMember.daysAsNewMember / 180) * 100,
                                100,
                              )}
                              className="w-full"
                            />
                            <div className="text-xs text-muted-foreground">
                              {selectedNewMember.daysAsNewMember >= 180
                                ? "✅ Eligible for full membership transfer!"
                                : `${Math.ceil((180 - selectedNewMember.daysAsNewMember) / 30)} months remaining`}
                            </div>
                          </div>

                          {/* Requirements Checklist */}
                          <div className="space-y-2">
                            <span className="font-medium">Requirements:</span>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {selectedNewMember.daysAsNewMember >= 180 ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                )}
                                <span className="text-sm">
                                  6+ months membership
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedNewMember.baptized ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                )}
                                <span className="text-sm">Baptized</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedNewMember.bibleStudyCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                )}
                                <span className="text-sm">
                                  Bible Study Completed
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Contact Info Tab */}
                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3
                          className="text-lg font-semibold"
                          style={{ color: "#800020" }}
                        >
                          Contact Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">Phone:</span>
                              <span className="ml-2">
                                {selectedNewMember.phoneNumber}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">Email:</span>
                              <span className="ml-2">
                                {selectedNewMember.email || "Not provided"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <span className="font-medium">Address:</span>
                              <div className="ml-2 text-sm text-muted-foreground">
                                {selectedNewMember.address || "Not provided"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3
                          className="text-lg font-semibold"
                          style={{ color: "#800020" }}
                        >
                          Emergency Contact
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-medium">Name:</span>
                            <span>
                              {selectedNewMember.emergencyContactName ||
                                "Not provided"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Phone:</span>
                            <span>
                              {selectedNewMember.emergencyContactPhone ||
                                "Not provided"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Spiritual Journey Tab */}
                  <TabsContent value="spiritual" className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3
                          className="text-lg font-semibold"
                          style={{ color: "#800020" }}
                        >
                          Spiritual Status
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            {selectedNewMember.bornAgain ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            )}
                            <span>
                              Born Again:{" "}
                              {selectedNewMember.bornAgain ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedNewMember.baptized ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            )}
                            <span>
                              Baptized:{" "}
                              {selectedNewMember.baptized ? "Yes" : "No"}
                            </span>
                          </div>
                          {selectedNewMember.baptized &&
                            selectedNewMember.baptismDate && (
                              <div className="ml-6 text-sm text-muted-foreground">
                                Baptism Date:{" "}
                                {new Date(
                                  selectedNewMember.baptismDate,
                                ).toLocaleDateString()}
                              </div>
                            )}
                          <div className="flex items-center gap-2">
                            {selectedNewMember.bibleStudyCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            )}
                            <span>
                              Bible Study:{" "}
                              {selectedNewMember.bibleStudyCompleted
                                ? "Completed"
                                : "In Progress"}
                            </span>
                          </div>
                          {selectedNewMember.bibleStudyCompleted &&
                            selectedNewMember.bibleStudyCompletionDate && (
                              <div className="ml-6 text-sm text-muted-foreground">
                                Completion Date:{" "}
                                {new Date(
                                  selectedNewMember.bibleStudyCompletionDate,
                                ).toLocaleDateString()}
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3
                          className="text-lg font-semibold"
                          style={{ color: "#800020" }}
                        >
                          Service Groups
                        </h3>
                        <div className="space-y-2">
                          {selectedNewMember.serviceGroups.length > 0 ? (
                            selectedNewMember.serviceGroups.map((groupId) => {
                              const group = serviceGroups.find(
                                (g) => g.id === groupId,
                              );
                              return group ? (
                                <Badge
                                  key={groupId}
                                  variant="outline"
                                  className="mr-2 mb-2"
                                >
                                  {group.name}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-muted-foreground">
                              No service groups assigned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Prayer Requests */}
                    {selectedNewMember.prayerRequests && (
                      <div className="space-y-3">
                        <h3
                          className="text-lg font-semibold"
                          style={{ color: "#800020" }}
                        >
                          Prayer Requests
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm">
                            {selectedNewMember.prayerRequests}
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Background Tab */}
                  <TabsContent value="background" className="space-y-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h3
                            className="text-lg font-semibold"
                            style={{ color: "#800020" }}
                          >
                            Church Background
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">
                                How heard about us:
                              </span>
                              <span>{selectedNewMember.howHeardAboutUs}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">
                                Purpose of visit:
                              </span>
                              <span>{selectedNewMember.purposeOfVisit}</span>
                            </div>
                            {selectedNewMember.previousChurchName && (
                              <div className="flex justify-between">
                                <span className="font-medium">
                                  Previous church:
                                </span>
                                <span>
                                  {selectedNewMember.previousChurchName}
                                </span>
                              </div>
                            )}
                            {selectedNewMember.reasonForLeavingPreviousChurch && (
                              <div className="flex justify-between">
                                <span className="font-medium">
                                  Reason for leaving:
                                </span>
                                <span>
                                  {
                                    selectedNewMember.reasonForLeavingPreviousChurch
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3
                            className="text-lg font-semibold"
                            style={{ color: "#800020" }}
                          >
                            Additional Information
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Status:</span>
                              <Badge
                                className={
                                  selectedNewMember.isActive
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }
                              >
                                {selectedNewMember.isActive
                                  ? "Active"
                                  : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">
                                Eligible for Membership:
                              </span>
                              <Badge
                                className={
                                  selectedNewMember.eligibleForMembership
                                    ? "bg-green-500"
                                    : "bg-yellow-500"
                                }
                              >
                                {selectedNewMember.eligibleForMembership
                                  ? "Yes"
                                  : "Not Yet"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      {selectedNewMember.reasonDetails && (
                        <div className="space-y-3">
                          <h3
                            className="text-lg font-semibold"
                            style={{ color: "#800020" }}
                          >
                            Additional Details
                          </h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm">
                              {selectedNewMember.reasonDetails}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Church Feedback */}
                      {selectedNewMember.churchFeedback && (
                        <div className="space-y-3">
                          <h3
                            className="text-lg font-semibold"
                            style={{ color: "#800020" }}
                          >
                            Church Feedback
                          </h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm">
                              {selectedNewMember.churchFeedback}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      setShowViewNewMemberDialog(false);
                      setShowEditNewMemberDialog(true);
                    }}
                    className="text-white hover:opacity-90"
                    style={{ backgroundColor: "#800020" }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowViewNewMemberDialog(false)}
                  >
                    Close
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
