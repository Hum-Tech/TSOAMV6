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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Download,
  Users,
  Calendar,
  Eye,
  Phone,
  Mail,
  MapPin,
  Heart,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { exportService } from "@/services/ExportService";
import {
  visitorTrackingService,
  type Visitor as TrackedVisitor,
  type RetentionStats,
  type ConversionFunnel,
} from "@/services/VisitorTrackingService";

// Enhanced Visitor interface for directory tracking
interface VisitorRecord {
  id: number;
  visitorId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  purposeOfVisit: string;
  currentChurch: string;
  howHeardAboutUs: string;
  whatLikedMost: string;
  prayerRequests: string[];
  visitDate: string;
  followUpRequired: boolean;
  followUpNotes: string;
  status: "Active Visitor" | "Promoted to New Member" | "Inactive" | "Lost";
  retentionScore: number;
  totalVisits: number;
  lastVisitDate: string;
  transferredToNewMember?: boolean;
  transferDate?: string;
  notes?: string;
}

export default function VisitorsDirectory() {
  const [visitorsData, setVisitorsData] = useState<VisitorRecord[]>([]);
  const [trackedVisitors, setTrackedVisitors] = useState<TrackedVisitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecord | null>(
    null,
  );
  const [showVisitorDetails, setShowVisitorDetails] = useState(false);
  const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(
    null,
  );
  const [conversionFunnel, setConversionFunnel] =
    useState<ConversionFunnel | null>(null);
  const [activeTab, setActiveTab] = useState("directory");

  useEffect(() => {
    loadVisitorsData();
    loadAnalytics();
  }, []);

  const loadVisitorsData = () => {
    // Load tracked visitors from visitor tracking service
    const tracked = visitorTrackingService.getVisitors();
    setTrackedVisitors(tracked);

    // Create comprehensive visitor records including historical data
    const mockVisitorRecords: VisitorRecord[] = [
      {
        id: 1,
        visitorId: "V2024-001",
        fullName: "Alice Johnson",
        phoneNumber: "+254712345678",
        email: "alice.johnson@gmail.com",
        purposeOfVisit: "Sunday Service",
        currentChurch: "Methodist Church",
        howHeardAboutUs: "Friend",
        whatLikedMost: "The worship and teaching",
        prayerRequests: ["Healing", "Financial Breakthrough"],
        visitDate: "2024-03-15",
        followUpRequired: true,
        followUpNotes: "Interested in joining choir",
        status: "Promoted to New Member",
        retentionScore: 85,
        totalVisits: 12,
        lastVisitDate: "2024-12-22",
        transferredToNewMember: true,
        transferDate: "2024-09-15",
        notes:
          "Successfully transferred to new member after 6 months. Active in choir.",
      },
      {
        id: 2,
        visitorId: "V2024-015",
        fullName: "Robert Mwangi",
        phoneNumber: "+254798765432",
        email: "robert.mwangi@yahoo.com",
        purposeOfVisit: "Prayer Meeting",
        currentChurch: "Catholic Church",
        howHeardAboutUs: "Social Media",
        whatLikedMost: "The prayer atmosphere",
        prayerRequests: ["Spiritual Growth", "Family Unity"],
        visitDate: "2024-07-10",
        followUpRequired: false,
        followUpNotes: "",
        status: "Active Visitor",
        retentionScore: 65,
        totalVisits: 8,
        lastVisitDate: "2025-01-10",
        notes: "Regular attendee of prayer meetings. Considering membership.",
      },
      {
        id: 3,
        visitorId: "V2024-032",
        fullName: "Grace Wanjiku",
        phoneNumber: "+254723456789",
        purposeOfVisit: "Youth Service",
        currentChurch: "PCEA Church",
        howHeardAboutUs: "Crusade",
        whatLikedMost: "Youth ministry activities",
        prayerRequests: ["Academic Success", "Career Guidance"],
        visitDate: "2024-11-05",
        followUpRequired: true,
        followUpNotes: "Interested in youth leadership",
        status: "Lost",
        retentionScore: 25,
        totalVisits: 3,
        lastVisitDate: "2024-11-26",
        notes: "Stopped attending after 3 visits. Follow-up unsuccessful.",
      },
      {
        id: 4,
        visitorId: "V2025-003",
        fullName: "David Kimani",
        phoneNumber: "+254756789012",
        email: "david.kimani@outlook.com",
        purposeOfVisit: "Sunday Service",
        currentChurch: "None",
        howHeardAboutUs: "Website",
        whatLikedMost: "The sermons and fellowship",
        prayerRequests: ["Job Search", "Direction"],
        visitDate: "2025-01-05",
        followUpRequired: true,
        followUpNotes: "New believer, needs discipleship",
        status: "Active Visitor",
        retentionScore: 80,
        totalVisits: 4,
        lastVisitDate: "2025-01-12",
        notes: "Very engaged new visitor. Strong potential for membership.",
      },
      {
        id: 5,
        visitorId: "V2024-067",
        fullName: "Sarah Njeri",
        phoneNumber: "+254734567890",
        purposeOfVisit: "Special Event",
        currentChurch: "SDA Church",
        howHeardAboutUs: "Relative",
        whatLikedMost: "Community outreach programs",
        prayerRequests: ["Marriage", "Business Success"],
        visitDate: "2024-08-20",
        followUpRequired: false,
        followUpNotes: "",
        status: "Inactive",
        retentionScore: 40,
        totalVisits: 6,
        lastVisitDate: "2024-10-15",
        notes:
          "Attended regularly for 2 months then became inactive. Relocated.",
      },
    ];

    // Create a Map to track existing visitor IDs to prevent duplicates
    const existingVisitorIds = new Set(
      mockVisitorRecords.map((v) => v.visitorId),
    );

    // Filter out tracked visitors that already exist in mock data
    const uniqueTrackedVisitors = tracked.filter(
      (tv) => !existingVisitorIds.has(tv.visitorId),
    );

    // Merge tracked visitors with mock data, ensuring no duplicates
    const allVisitors = [
      ...mockVisitorRecords,
      ...uniqueTrackedVisitors.map((tv, index) => ({
        id: parseInt(tv.visitorId.replace("V", "").replace("-", "")) + 1000, // Offset to avoid ID conflicts
        visitorId: tv.visitorId,
        fullName: tv.fullName,
        phoneNumber: tv.phoneNumber,
        email: tv.email,
        purposeOfVisit: "Sunday Service",
        currentChurch: (tv as any).previousChurch || "Unknown",
        howHeardAboutUs: tv.howHeardAboutChurch || "Unknown",
        whatLikedMost: "",
        prayerRequests: [],
        visitDate: tv.firstVisitDate,
        followUpRequired: false,
        followUpNotes: "",
        status: tv.status,
        retentionScore: tv.retentionScore,
        totalVisits: (tv as any).visitCount || 1,
        lastVisitDate: tv.lastVisitDate,
        notes: `Tracked visitor from visitor tracking service`,
      })),
    ];

    setVisitorsData(allVisitors);
  };

  const loadAnalytics = () => {
    const monthlyStats = visitorTrackingService.getRetentionStats("monthly");
    setRetentionStats(monthlyStats);

    const funnelData = visitorTrackingService.getConversionFunnel();
    setConversionFunnel(funnelData);
  };

  const filteredVisitors = visitorsData.filter((visitor) => {
    const matchesSearch =
      visitor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.visitorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.phoneNumber.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || visitor.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const exportData = filteredVisitors.map((visitor) => ({
      "Visitor ID": visitor.visitorId,
      "Full Name": visitor.fullName,
      "Phone Number": visitor.phoneNumber,
      Email: visitor.email || "N/A",
      Status: visitor.status,
      "First Visit": visitor.visitDate,
      "Last Visit": visitor.lastVisitDate,
      "Total Visits": visitor.totalVisits,
      "Retention Score": `${visitor.retentionScore}%`,
      "Purpose of Visit": visitor.purposeOfVisit,
      "How Heard About Us": visitor.howHeardAboutUs,
      "Prayer Requests": visitor.prayerRequests.join(", "),
      "Transfer Status": visitor.transferredToNewMember
        ? "Transferred"
        : "Not Transferred",
      "Transfer Date": visitor.transferDate || "N/A",
      Notes: visitor.notes || "N/A",
    }));

    exportService.exportToExcel({
      format: "excel",
      filename: "visitors_directory.xlsx",
      title: "Visitors Directory",
      data: exportData,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active Visitor":
        return (
          <Badge className="bg-green-100 text-green-800">Active Visitor</Badge>
        );
      case "Promoted to New Member":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            Promoted to New Member
          </Badge>
        );
      case "Inactive":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Inactive</Badge>
        );
      case "Lost":
        return <Badge className="bg-red-100 text-red-800">Lost</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRetentionIcon = (score: number) => {
    if (score >= 70) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 50) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Visitors Directory
            </h1>
            <p className="text-muted-foreground">
              Historical tracking and analytics of all church visitors
            </p>
          </div>
          <Button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Directory
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="directory">Visitors Directory</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Visitors
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {visitorsData.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time visitors
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Visitors
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      visitorsData.filter((v) => v.status === "Active Visitor")
                        .length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Promoted Members
                  </CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      visitorsData.filter(
                        (v) => v.status === "Promoted to New Member",
                      ).length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successfully converted
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Retention
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(
                      visitorsData.reduce(
                        (sum, v) => sum + v.retentionScore,
                        0,
                      ) / visitorsData.length || 0,
                    )}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Overall retention score
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Search & Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, visitor ID, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="Active Visitor">Active Visitors</option>
                    <option value="Promoted to New Member">
                      Promoted Members
                    </option>
                    <option value="Inactive">Inactive</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Visitors Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Visitors Directory ({filteredVisitors.length} records)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Retention</TableHead>
                      <TableHead>Visits</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisitors.map((visitor, index) => (
                      <TableRow
                        key={`${visitor.visitorId}-${visitor.id}-${index}`}
                      >
                        <TableCell className="font-medium">
                          {visitor.visitorId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {visitor.fullName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              First Visit:{" "}
                              {new Date(visitor.visitDate).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {visitor.phoneNumber}
                            </div>
                            {visitor.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {visitor.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(visitor.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRetentionIcon(visitor.retentionScore)}
                            <span className="text-sm font-medium">
                              {visitor.retentionScore}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-medium">
                              {visitor.totalVisits}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              visits
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(visitor.lastVisitDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedVisitor(visitor);
                              setShowVisitorDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {retentionStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Retention Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Visitors</span>
                        <span className="font-bold">
                          {retentionStats.totalVisitors}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Retained Visitors</span>
                        <span className="font-bold">
                          {retentionStats.retainedVisitors}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lost Visitors</span>
                        <span className="font-bold">
                          {retentionStats.lostVisitors}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Retention Rate</span>
                        <span className="font-bold">
                          {retentionStats.retentionRate}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {conversionFunnel && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Conversion Funnel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Total Visitors</span>
                          <span className="font-bold">
                            {conversionFunnel.totalVisitors}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>First Time Visitors</span>
                          <span className="font-bold">
                            {conversionFunnel.firstTimeVisitors}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Return Visitors</span>
                          <span className="font-bold">
                            {conversionFunnel.secondTimeVisitors}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Promoted to Members</span>
                          <span className="font-bold">
                            {conversionFunnel.bornAgainVisitors}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Visitor Details Dialog */}
        <Dialog open={showVisitorDetails} onOpenChange={setShowVisitorDetails}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Visitor Details</DialogTitle>
            </DialogHeader>
            {selectedVisitor && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Visitor ID</Label>
                    <p className="text-sm">{selectedVisitor.visitorId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedVisitor.status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    <p className="text-sm">{selectedVisitor.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <p className="text-sm">{selectedVisitor.phoneNumber}</p>
                  </div>
                  {selectedVisitor.email && (
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm">{selectedVisitor.email}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">
                      Retention Score
                    </Label>
                    <p className="text-sm">{selectedVisitor.retentionScore}%</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Visits</Label>
                    <p className="text-sm">{selectedVisitor.totalVisits}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">First Visit</Label>
                    <p className="text-sm">
                      {new Date(selectedVisitor.visitDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Visit</Label>
                    <p className="text-sm">
                      {new Date(
                        selectedVisitor.lastVisitDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Purpose of Visit
                    </Label>
                    <p className="text-sm">{selectedVisitor.purposeOfVisit}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      How Heard About Us
                    </Label>
                    <p className="text-sm">{selectedVisitor.howHeardAboutUs}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Current Church
                    </Label>
                    <p className="text-sm">{selectedVisitor.currentChurch}</p>
                  </div>
                </div>

                {selectedVisitor.prayerRequests.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">
                      Prayer Requests
                    </Label>
                    <p className="text-sm">
                      {selectedVisitor.prayerRequests.join(", ")}
                    </p>
                  </div>
                )}

                {selectedVisitor.whatLikedMost && (
                  <div>
                    <Label className="text-sm font-medium">
                      What They Liked Most
                    </Label>
                    <p className="text-sm">{selectedVisitor.whatLikedMost}</p>
                  </div>
                )}

                {selectedVisitor.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm">{selectedVisitor.notes}</p>
                  </div>
                )}

                {selectedVisitor.transferredToNewMember && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Successfully Promoted to New Member
                      </span>
                    </div>
                    {selectedVisitor.transferDate && (
                      <p className="text-sm text-blue-700 mt-1">
                        Transfer Date:{" "}
                        {new Date(
                          selectedVisitor.transferDate,
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {selectedVisitor.followUpRequired && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Follow-up Required
                      </span>
                    </div>
                    {selectedVisitor.followUpNotes && (
                      <p className="text-sm text-yellow-700 mt-1">
                        {selectedVisitor.followUpNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
