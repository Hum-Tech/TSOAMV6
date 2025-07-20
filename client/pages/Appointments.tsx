import { useState } from "react";
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
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Edit,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportService } from "@/services/ExportService";

const priorities = ["Urgent", "High", "Medium", "Low"];
const statuses = [
  "Scheduled",
  "Confirmed",
  "Completed",
  "Cancelled",
  "Rescheduled",
];
const appointmentTypes = [
  "Finance Meeting",
  "HR Discussion",
  "Pastoral Counseling",
  "Administrative Meeting",
  "Planning Session",
  "Performance Review",
  "Budget Planning",
  "Event Planning",
];

// Mock appointments data
const mockAppointments = [
  {
    id: "APT-2025-001",
    title: "Budget Planning Meeting",
    description: "Quarterly budget review and planning",
    date: "2025-01-20",
    time: "10:00",
    duration: 60,
    priority: "High",
    status: "Scheduled",
    type: "Finance Meeting",
    attendees: ["John Kamau", "Mary Wanjiku"],
    organizer: "Finance Officer",
    location: "Conference Room A",
  },
  {
    id: "APT-2025-002",
    title: "HR Performance Review",
    description: "Monthly staff performance evaluation",
    date: "2025-01-22",
    time: "14:00",
    duration: 90,
    priority: "Medium",
    status: "Confirmed",
    type: "HR Discussion",
    attendees: ["Peter Mwangi"],
    organizer: "HR Officer",
    location: "HR Office",
  },
  {
    id: "APT-2025-003",
    title: "Event Planning Session",
    description: "Planning for Easter celebration event",
    date: "2025-01-25",
    time: "16:00",
    duration: 120,
    priority: "Urgent",
    status: "Scheduled",
    type: "Event Planning",
    attendees: ["Sarah Wanjiku", "James Kimani", "Grace Muthoni"],
    organizer: "Admin",
    location: "Main Hall",
  },
];

export default function Appointments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [appointments] = useState(mockAppointments);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const filteredAppointments = appointments.filter(
    (appointment) =>
      (filterStatus === "all" || appointment.status === filterStatus) &&
      (filterPriority === "all" || appointment.priority === filterPriority) &&
      (appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        appointment.id.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "High":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "Medium":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "Low":
        return <Clock className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Scheduled: "secondary",
      Confirmed: "default",
      Completed: "default",
      Cancelled: "destructive",
      Rescheduled: "secondary",
    };

    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  const todayAppointments = appointments.filter(
    (apt) => apt.date === new Date().toISOString().split("T")[0],
  );

  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.date) > new Date(),
  );

  // Export functions using ExportService
  const exportToExcel = async () => {
    try {
      await exportService.export({
        filename: `TSOAM_Appointments_${new Date().toISOString().split("T")[0]}`,
        title: "TSOAM Church Appointments Report",
        subtitle: `Total Appointments: ${filteredAppointments.length}`,
        data: filteredAppointments,
        format: "excel",
        columns: [
          { key: "id", title: "Appointment ID", width: 15 },
          { key: "title", title: "Title", width: 25 },
          { key: "description", title: "Description", width: 30 },
          { key: "date", title: "Date", width: 12 },
          { key: "time", title: "Time", width: 10 },
          { key: "duration", title: "Duration (min)", width: 12 },
          { key: "status", title: "Status", width: 12 },
          { key: "priority", title: "Priority", width: 10 },
          {
            key: "attendees",
            title: "Participants",
            width: 25,
            format: (val) =>
              Array.isArray(val) && val.length > 0
                ? val.join(", ")
                : "No participants",
          },
          { key: "location", title: "Location", width: 20 },
          {
            key: "notes",
            title: "Notes",
            width: 30,
            format: (val) => val || "N/A",
          },
        ],
      });
    } catch (error) {
      console.error("Export to Excel failed:", error);
      alert("Export failed: " + error.message);
    }
  };

  const exportToPDF = async () => {
    try {
      await exportService.export({
        filename: `TSOAM_Appointments_${new Date().toISOString().split("T")[0]}`,
        title: "TSOAM Church Appointments Report",
        subtitle: `Total Appointments: ${filteredAppointments.length}`,
        data: filteredAppointments,
        format: "pdf",
        orientation: "landscape",
        columns: [
          { key: "id", title: "ID", width: 20 },
          { key: "title", title: "Title", width: 40 },
          { key: "date", title: "Date", width: 25 },
          { key: "time", title: "Time", width: 20 },
          { key: "status", title: "Status", width: 25 },
          { key: "priority", title: "Priority", width: 20 },
          {
            key: "attendees",
            title: "Participants",
            width: 35,
            format: (val) =>
              Array.isArray(val) && val.length > 0
                ? val.slice(0, 2).join(", ") + (val.length > 2 ? "..." : "")
                : "No participants",
          },
          { key: "location", title: "Location", width: 25 },
        ],
      });
    } catch (error) {
      console.error("Export to PDF failed:", error);
      alert("Export failed: " + error.message);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
            <p className="text-muted-foreground">
              Schedule and manage appointments with priority tracking
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Appointment Title</Label>
                  <Input id="title" placeholder="Enter appointment title" />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Appointment description..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Appointment Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {appointmentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" type="time" />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input id="duration" type="number" placeholder="60" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Meeting location" />
                </div>

                <div>
                  <Label htmlFor="attendees">Attendees (comma separated)</Label>
                  <Input id="attendees" placeholder="John Doe, Jane Smith" />
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setIsAddDialogOpen(false)}>
                    Schedule Appointment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {todayAppointments.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Today</div>
                </div>
                <CalendarIcon className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {upcomingAppointments.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Upcoming</div>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {
                      appointments.filter((apt) => apt.status === "Completed")
                        .length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {
                      appointments.filter((apt) => apt.priority === "Urgent")
                        .length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Urgent</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Appointments</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search appointments..."
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
                      <SelectItem value="all">All Status</SelectItem>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterPriority}
                    onValueChange={setFilterPriority}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={exportToPDF}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportToExcel}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Organizer</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">
                          {appointment.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {appointment.title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.type}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {appointment.date}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{appointment.duration} min</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(appointment.priority)}
                            {appointment.priority}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(appointment.status)}
                        </TableCell>
                        <TableCell>{appointment.organizer}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <X className="h-4 w-4" />
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

          <TabsContent value="today">
            <Card>
              <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No appointments today
                    </h3>
                    <p className="text-muted-foreground">
                      You have no scheduled appointments for today.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">
                              {appointment.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {appointment.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span>📍 {appointment.location}</span>
                              <span>⏰ {appointment.time}</span>
                              <span>👥 {appointment.attendees.join(", ")}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(appointment.priority)}
                            {getStatusBadge(appointment.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{appointment.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {appointment.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>📅 {appointment.date}</span>
                            <span>⏰ {appointment.time}</span>
                            <span>📍 {appointment.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(appointment.priority)}
                          {getStatusBadge(appointment.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Report Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Report</SelectItem>
                        <SelectItem value="weekly">Weekly Report</SelectItem>
                        <SelectItem value="monthly">Monthly Report</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" placeholder="From" />
                      <Input type="date" placeholder="To" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={exportToPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button variant="outline" onClick={exportToExcel}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Appointment Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Appointment analytics chart will be displayed here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
