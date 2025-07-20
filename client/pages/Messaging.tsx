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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Download,
  MessageSquare,
  Mail,
  Send,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  MessageCircle,
  Phone,
  UserCheck,
  Building,
  Heart,
  Music,
  Baby,
  Shield,
  BookOpen,
  Save,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  type: "SMS" | "Email";
  recipient: string;
  recipientType: "Member" | "Employee" | "Group";
  subject?: string;
  message: string;
  status: "Sent" | "Pending" | "Failed" | "Delivered";
  sentDate: string;
  sentBy: string;
  recipientCount: number;
  deliveryRate?: number;
}

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  type: "Member" | "Employee";
  department?: string;
  serviceGroup?: string;
  isActive: boolean;
}

interface MessageTemplate {
  id: string;
  name: string;
  type: "SMS" | "Email";
  subject?: string;
  content: string;
  category: string;
}

// System contacts - integrating with member and employee databases
const getSystemContacts = (): Contact[] => {
  return [
    // Church Members
    {
      id: "M001",
      name: "John Doe",
      phone: "+254700123456",
      email: "john.doe@tsoam.com",
      type: "Member",
      serviceGroup: "Ushering Team",
      isActive: true,
    },
    {
      id: "M002",
      name: "Mary Wanjiku",
      phone: "+254700234567",
      email: "mary.wanjiku@tsoam.com",
      type: "Member",
      serviceGroup: "Choir",
      isActive: true,
    },
    {
      id: "M003",
      name: "Peter Kamau",
      phone: "+254700345678",
      email: "peter.kamau@tsoam.com",
      type: "Member",
      serviceGroup: "Youth Ministry",
      isActive: true,
    },
    {
      id: "M004",
      name: "Grace Muthoni",
      phone: "+254700456789",
      email: "grace.muthoni@tsoam.com",
      type: "Member",
      serviceGroup: "Women's Ministry",
      isActive: true,
    },
    {
      id: "M005",
      name: "David Kiprotich",
      phone: "+254700567890",
      email: "david.kiprotich@tsoam.com",
      type: "Member",
      serviceGroup: "Men's Ministry",
      isActive: true,
    },
    {
      id: "M006",
      name: "Sarah Njeri",
      phone: "+254700678901",
      email: "sarah.njeri@tsoam.com",
      type: "Member",
      serviceGroup: "Sunday School",
      isActive: true,
    },
    {
      id: "M007",
      name: "Michael Otieno",
      phone: "+254701789012",
      email: "michael.otieno@tsoam.com",
      type: "Member",
      serviceGroup: "Prayer Team",
      isActive: true,
    },
    {
      id: "M008",
      name: "Ruth Wanjala",
      phone: "+254702890123",
      email: "ruth.wanjala@tsoam.com",
      type: "Member",
      serviceGroup: "Children's Ministry",
      isActive: true,
    },
    // Church Staff/Employees
    {
      id: "E001",
      name: "Pastor James Kuria",
      phone: "+254700789012",
      email: "pastor.james@tsoam.com",
      type: "Employee",
      department: "Ministry Leadership",
      isActive: true,
    },
    {
      id: "E002",
      name: "Humphrey Njoroge",
      phone: "+254700890123",
      email: "admin@tsoam.com",
      type: "Employee",
      department: "Administration",
      isActive: true,
    },
    {
      id: "E003",
      name: "Finance Officer",
      phone: "+254700901234",
      email: "finance@tsoam.com",
      type: "Employee",
      department: "Finance",
      isActive: true,
    },
    {
      id: "E004",
      name: "HR Officer",
      phone: "+254701012345",
      email: "hr@tsoam.com",
      type: "Employee",
      department: "Human Resources",
      isActive: true,
    },
    {
      id: "E005",
      name: "Secretary",
      phone: "+254701123456",
      email: "secretary@tsoam.com",
      type: "Employee",
      department: "Administration",
      isActive: true,
    },
  ];
};

// Service groups for filtering
const SERVICE_GROUPS = [
  "Choir",
  "Ushering Team",
  "Youth Ministry",
  "Women's Ministry",
  "Men's Ministry",
  "Sunday School",
  "Prayer Team",
  "Children's Ministry",
  "Evangelism Team",
  "Welfare Committee",
];

const DEPARTMENTS = [
  "Ministry Leadership",
  "Administration",
  "Finance",
  "Human Resources",
  "Security",
];

// Message templates
const messageTemplates: MessageTemplate[] = [
  {
    id: "T001",
    name: "Sunday Service Reminder",
    type: "SMS",
    content:
      "Reminder: Sunday service starts at 9:00 AM. Join us for worship and fellowship at TSOAM Church. God bless!",
    category: "Service Reminders",
  },
  {
    id: "T002",
    name: "Welcome New Member",
    type: "Email",
    subject: "Welcome to TSOAM Church Family",
    content:
      "Dear [NAME], Welcome to The Seed of Abraham Ministry (TSOAM) Church International! We're excited to have you join our church family. We look forward to growing together in faith and fellowship.",
    category: "Welcome Messages",
  },
  {
    id: "T003",
    name: "Midweek Service",
    type: "SMS",
    content:
      "Join us for midweek service this Wednesday at 6:00 PM. Topic: [TOPIC]. Venue: Main sanctuary. See you there!",
    category: "Service Reminders",
  },
  {
    id: "T004",
    name: "Tithe Reminder",
    type: "SMS",
    content:
      "Dear [NAME], remember that tithing is an act of worship and obedience. Your faithfulness in giving helps support God's work at TSOAM.",
    category: "Stewardship",
  },
  {
    id: "T005",
    name: "Prayer Request",
    type: "SMS",
    content:
      "TSOAM Prayer Chain: Please join us in prayer for [REQUEST]. Let's stand together in faith and intercession.",
    category: "Prayer & Spiritual",
  },
  {
    id: "T006",
    name: "Event Announcement",
    type: "Email",
    subject: "[EVENT] - TSOAM Church",
    content:
      "Dear Church Family, We're excited to announce [EVENT] on [DATE] at [TIME]. Location: [VENUE]. For more information, contact the church office at admin@tsoam.com.",
    category: "Events & Announcements",
  },
];

// Mock message history
const mockMessages: Message[] = [
  {
    id: "MSG-2025-001",
    type: "SMS",
    recipient: "All Members",
    recipientType: "Group",
    message:
      "Reminder: Sunday service starts at 9:00 AM. Join us for worship and fellowship at TSOAM Church. God bless!",
    status: "Delivered",
    sentDate: "2025-01-16 08:00",
    sentBy: "Admin",
    recipientCount: 1247,
    deliveryRate: 98.5,
  },
  {
    id: "MSG-2025-002",
    type: "Email",
    recipient: "All Staff",
    recipientType: "Group",
    subject: "Monthly Staff Meeting - TSOAM",
    message:
      "Dear Team, Please join us for the monthly staff meeting on Friday at 2:00 PM in the conference room. Agenda will cover ministry updates and upcoming events.",
    status: "Sent",
    sentDate: "2025-01-15 14:30",
    sentBy: "HR Officer",
    recipientCount: 20,
    deliveryRate: 100,
  },
  {
    id: "MSG-2025-003",
    type: "SMS",
    recipient: "Youth Ministry",
    recipientType: "Group",
    message:
      "Youth Bible study tonight at 6:00 PM. Topic: Living with Purpose. Main hall. See you there!",
    status: "Delivered",
    sentDate: "2025-01-15 16:00",
    sentBy: "Youth Leader",
    recipientCount: 85,
    deliveryRate: 97.6,
  },
  {
    id: "MSG-2025-004",
    type: "Email",
    recipient: "Mary Wanjiku",
    recipientType: "Member",
    subject: "Welcome to TSOAM Church Family",
    message:
      "Dear Mary, Welcome to The Seed of Abraham Ministry! We're excited to have you join our church family. We look forward to growing together in faith.",
    status: "Delivered",
    sentDate: "2025-01-14 10:00",
    sentBy: "Pastor James",
    recipientCount: 1,
    deliveryRate: 100,
  },
];

export default function Messaging() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts] = useState<Contact[]>(getSystemContacts());
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [templates] = useState<MessageTemplate[]>(messageTemplates);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Dialog states
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);

  // Message composition
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<"SMS" | "Email">("SMS");
  const [recipientFilter, setRecipientFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [messageContent, setMessageContent] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Filters
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [contactFilter, setContactFilter] = useState("all");
  const [serviceGroupFilter, setServiceGroupFilter] = useState("all");

  // Calculate stats
  const totalMessages = messages.length;
  const sentToday = messages.filter((m) =>
    m.sentDate.includes(new Date().toISOString().split("T")[0]),
  ).length;
  const avgDeliveryRate =
    messages.reduce((acc, msg) => acc + (msg.deliveryRate || 0), 0) /
    messages.length;
  const totalContacts = contacts.filter((c) => c.isActive).length;

  // Filter contacts based on current filters
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      contactFilter === "all" || contact.type.toLowerCase() === contactFilter;
    const matchesGroup =
      serviceGroupFilter === "all" ||
      contact.serviceGroup === serviceGroupFilter ||
      contact.department === serviceGroupFilter;

    const hasValidContact =
      messageType === "SMS" ? contact.phone : contact.email;

    return (
      matchesSearch &&
      matchesType &&
      matchesGroup &&
      hasValidContact &&
      contact.isActive
    );
  });

  // Filter messages
  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || message.type === filterType;
    const matchesStatus =
      filterStatus === "All" || message.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSelectAllContacts = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleContactSelect = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId]);
    } else {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setMessageContent(template.content);
      if (template.subject) {
        setSubject(template.subject);
      }
      if (template.type !== messageType) {
        setMessageType(template.type);
      }
    }
  };

  const sendMessage = async () => {
    if (!messageContent || selectedContacts.length === 0) {
      alert("Please select recipients and enter a message");
      return;
    }

    // Create new message
    const newMessage: Message = {
      id: `MSG-2025-${(messages.length + 1).toString().padStart(3, "0")}`,
      type: messageType,
      recipient:
        selectedContacts.length === 1
          ? contacts.find((c) => c.id === selectedContacts[0])?.name ||
            "Unknown"
          : `${selectedContacts.length} recipients`,
      recipientType: selectedContacts.length === 1 ? "Member" : "Group",
      subject: messageType === "Email" ? subject : undefined,
      message: messageContent,
      status: "Sent",
      sentDate: new Date().toISOString().replace("T", " ").substring(0, 16),
      sentBy: user?.name || "Admin",
      recipientCount: selectedContacts.length,
      deliveryRate: 100,
    };

    try {
      // Save message to backend
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newMessage,
          sender_id: user?.id,
          recipient_ids: selectedContacts,
          message_content: messageContent,
          message_type: messageType,
        }),
      });

      if (response.ok) {
        // Add to local state
        setMessages((prev) => [newMessage, ...prev]);

        // Log the activity
        await fetch("/api/system-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Message Sent",
            module: "Messaging",
            details: `${messageType} sent to ${selectedContacts.length} recipient(s): "${messageContent.substring(0, 50)}..."`,
            severity: "Info",
          }),
        });

        alert(
          `${messageType} sent successfully to ${selectedContacts.length} recipient(s)!`,
        );
      } else {
        alert("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Still add to local state as fallback
      setMessages((prev) => [newMessage, ...prev]);
      alert("Message sent (offline mode)");
    }

    // Reset form
    setSelectedContacts([]);
    setMessageContent("");
    setSubject("");
    setIsComposeOpen(false);
  };

  // Delete selected messages (privileged users only)
  const handleDeleteMessages = async () => {
    if (!user || !["Admin", "HR Officer"].includes(user.role)) {
      alert("You don't have permission to delete messages");
      return;
    }

    if (selectedMessages.length === 0) {
      alert("Please select messages to delete");
      return;
    }

    try {
      // Delete from backend
      const response = await fetch("/api/messages/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_ids: selectedMessages }),
      });

      if (response.ok) {
        // Remove from local state
        setMessages((prev) =>
          prev.filter((msg) => !selectedMessages.includes(msg.id)),
        );
        setSelectedMessages([]);
        setShowDeleteDialog(false);

        // Log the activity
        await fetch("/api/system-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Messages Deleted",
            module: "Messaging",
            details: `${selectedMessages.length} message(s) deleted by ${user.name}`,
            severity: "Warning",
          }),
        });

        alert(`${selectedMessages.length} message(s) deleted successfully`);
      } else {
        alert("Failed to delete messages. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete messages:", error);
      alert("Failed to delete messages. Please try again.");
    }
  };

  const exportContacts = () => {
    const exportData = filteredContacts.map((contact) => ({
      Name: contact.name,
      Phone: contact.phone || "N/A",
      Email: contact.email || "N/A",
      Type: contact.type,
      "Service Group/Department":
        contact.serviceGroup || contact.department || "N/A",
      Status: contact.isActive ? "Active" : "Inactive",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    XLSX.writeFile(
      workbook,
      `TSOAM_Contacts_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const exportMessageHistory = () => {
    const exportData = filteredMessages.map((msg) => ({
      "Message ID": msg.id,
      Type: msg.type,
      Recipient: msg.recipient,
      "Subject/Message": msg.subject || msg.message.substring(0, 50) + "...",
      "Recipients Count": msg.recipientCount,
      Status: msg.status,
      "Delivery Rate": msg.deliveryRate ? `${msg.deliveryRate}%` : "N/A",
      "Sent Date": msg.sentDate,
      "Sent By": msg.sentBy,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Messages");
    XLSX.writeFile(
      workbook,
      `TSOAM_Messages_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const getServiceGroupIcon = (group: string) => {
    switch (group) {
      case "Choir":
        return <Music className="h-4 w-4" />;
      case "Ushering Team":
        return <UserCheck className="h-4 w-4" />;
      case "Youth Ministry":
        return <Users className="h-4 w-4" />;
      case "Women's Ministry":
        return <Heart className="h-4 w-4" />;
      case "Children's Ministry":
        return <Baby className="h-4 w-4" />;
      case "Prayer Team":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Church Messaging</h1>
            <p className="text-muted-foreground">
              Send SMS and emails to church members and staff
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isContactsOpen} onOpenChange={setIsContactsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  View Contacts ({totalContacts})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Church Contacts Directory</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Contact Filters */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={contactFilter}
                      onValueChange={setContactFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Contacts</SelectItem>
                        <SelectItem value="member">Members Only</SelectItem>
                        <SelectItem value="employee">Staff Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={serviceGroupFilter}
                      onValueChange={setServiceGroupFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Groups</SelectItem>
                        {SERVICE_GROUPS.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={exportContacts} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Contacts
                    </Button>
                  </div>

                  {/* Contacts Table */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Group/Department</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {contact.serviceGroup &&
                                  getServiceGroupIcon(contact.serviceGroup)}
                                {contact.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {contact.phone || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  contact.type === "Employee"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {contact.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {contact.serviceGroup ||
                                contact.department ||
                                "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Showing {filteredContacts.length} of {totalContacts}{" "}
                    contacts
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Compose Message
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Compose New Message</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Message Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Message Type</Label>
                      <Select
                        value={messageType}
                        onValueChange={(value: "SMS" | "Email") =>
                          setMessageType(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SMS">SMS</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Use Template</Label>
                      <Select
                        value={selectedTemplate}
                        onValueChange={handleTemplateSelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose template (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates
                            .filter((t) => t.type === messageType)
                            .map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Recipients Selection */}
                  <div>
                    <Label>Select Recipients</Label>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="selectAll"
                            checked={
                              selectedContacts.length ===
                                filteredContacts.length &&
                              filteredContacts.length > 0
                            }
                            onCheckedChange={handleSelectAllContacts}
                          />
                          <Label htmlFor="selectAll">
                            Select All ({filteredContacts.length})
                          </Label>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={contactFilter}
                            onValueChange={setContactFilter}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="member">Members</SelectItem>
                              <SelectItem value="employee">Staff</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={serviceGroupFilter}
                            onValueChange={setServiceGroupFilter}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Filter group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Groups</SelectItem>
                              {SERVICE_GROUPS.map((group) => (
                                <SelectItem key={group} value={group}>
                                  {group}
                                </SelectItem>
                              ))}
                              {DEPARTMENTS.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {filteredContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center space-x-2 p-2 border rounded"
                          >
                            <Checkbox
                              id={contact.id}
                              checked={selectedContacts.includes(contact.id)}
                              onCheckedChange={(checked) =>
                                handleContactSelect(contact.id, !!checked)
                              }
                            />
                            <Label
                              htmlFor={contact.id}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                {contact.serviceGroup &&
                                  getServiceGroupIcon(contact.serviceGroup)}
                                <div>
                                  <div className="font-medium">
                                    {contact.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {messageType === "SMS"
                                      ? contact.phone
                                      : contact.email}{" "}
                                    • {contact.type}
                                  </div>
                                </div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedContacts.length} recipient(s) selected
                    </p>
                  </div>

                  {/* Message Content */}
                  {messageType === "Email" && (
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter email subject"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="message">
                      Message Content
                      {messageType === "SMS" && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({messageContent.length}/160 characters)
                        </span>
                      )}
                    </Label>
                    <Textarea
                      id="message"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder={
                        messageType === "SMS"
                          ? "Enter SMS message (max 160 characters)"
                          : "Enter email content"
                      }
                      rows={messageType === "SMS" ? 4 : 8}
                      maxLength={messageType === "SMS" ? 160 : undefined}
                    />
                  </div>

                  {/* Sender Information */}
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium">Sender Information:</p>
                    <p className="text-sm text-muted-foreground">
                      {messageType === "SMS"
                        ? "SMS will be sent from: TSOAM Church (+254 700 123456)"
                        : "Email will be sent from: admin@tsoam.com"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={sendMessage}
                      disabled={
                        !messageContent || selectedContacts.length === 0
                      }
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send {messageType} to {selectedContacts.length}{" "}
                      recipient(s)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsComposeOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{totalMessages}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Messages
                  </div>
                </div>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{sentToday}</div>
                  <div className="text-sm text-muted-foreground">
                    Sent Today
                  </div>
                </div>
                <Send className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {avgDeliveryRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Delivery Rate
                  </div>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{totalContacts}</div>
                  <div className="text-sm text-muted-foreground">
                    Active Contacts
                  </div>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="messages">Message History</TabsTrigger>
            <TabsTrigger value="templates">Message Templates</TabsTrigger>
            <TabsTrigger value="settings">SMS/Email Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Message History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Types</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Status</SelectItem>
                      <SelectItem value="Sent">Sent</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  {user &&
                    ["Admin", "HR Officer"].includes(user.role) &&
                    selectedMessages.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        Delete ({selectedMessages.length})
                      </Button>
                    )}
                  <Button variant="outline" onClick={exportMessageHistory}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      {user && ["Admin", "HR Officer"].includes(user.role) && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedMessages.length ===
                                filteredMessages.length &&
                              filteredMessages.length > 0
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMessages(
                                  filteredMessages.map((m) => m.id),
                                );
                              } else {
                                setSelectedMessages([]);
                              }
                            }}
                          />
                        </TableHead>
                      )}
                      <TableHead>Type</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject/Message</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivery Rate</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Sent By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMessages.map((message) => (
                      <TableRow key={message.id}>
                        {user &&
                          ["Admin", "HR Officer"].includes(user.role) && (
                            <TableCell>
                              <Checkbox
                                checked={selectedMessages.includes(message.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedMessages((prev) => [
                                      ...prev,
                                      message.id,
                                    ]);
                                  } else {
                                    setSelectedMessages((prev) =>
                                      prev.filter((id) => id !== message.id),
                                    );
                                  }
                                }}
                              />
                            </TableCell>
                          )}
                        <TableCell>
                          <Badge
                            variant={
                              message.type === "SMS" ? "default" : "secondary"
                            }
                          >
                            {message.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {message.recipient}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div>
                            {message.subject && (
                              <div className="font-medium text-sm">
                                {message.subject}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground truncate">
                              {message.message.substring(0, 60)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{message.recipientCount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              message.status === "Delivered"
                                ? "default"
                                : message.status === "Sent"
                                  ? "secondary"
                                  : message.status === "Failed"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {message.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {message.deliveryRate
                            ? `${message.deliveryRate}%`
                            : "N/A"}
                        </TableCell>
                        <TableCell>{message.sentDate}</TableCell>
                        <TableCell>{message.sentBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Message Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {templates.map((template) => (
                    <Card key={template.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant={
                                  template.type === "SMS"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {template.type}
                              </Badge>
                              <span className="font-medium">
                                {template.name}
                              </span>
                              <Badge variant="outline">
                                {template.category}
                              </Badge>
                            </div>
                            {template.subject && (
                              <div className="text-sm font-medium mb-1">
                                Subject: {template.subject}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground">
                              {template.content}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleTemplateSelect(template.id);
                              setIsComposeOpen(true);
                            }}
                          >
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    SMS Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>SMS Gateway Provider</Label>
                    <Select defaultValue="safaricom">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="safaricom">
                          Safaricom (Recommended)
                        </SelectItem>
                        <SelectItem value="africastalking">
                          Africa's Talking
                        </SelectItem>
                        <SelectItem value="textmagic">TextMagic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sender ID</Label>
                    <Input
                      defaultValue="TSOAM"
                      placeholder="Church name or shortcode"
                    />
                  </div>
                  <div>
                    <Label>Default SMS Template Footer</Label>
                    <Textarea
                      defaultValue="- TSOAM Church International"
                      placeholder="Footer text to append to SMS"
                      rows={2}
                    />
                  </div>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save SMS Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>SMTP Server</Label>
                    <Input defaultValue="smtp.gmail.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Port</Label>
                      <Input defaultValue="587" />
                    </div>
                    <div>
                      <Label>Security</Label>
                      <Select defaultValue="tls">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>From Email</Label>
                    <Input defaultValue="admin@tsoam.com" />
                  </div>
                  <div>
                    <Label>From Name</Label>
                    <Input defaultValue="TSOAM Church International" />
                  </div>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Email Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Messages Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Delete Messages
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-sm text-red-700">
                  Are you sure you want to delete {selectedMessages.length}{" "}
                  selected message(s)? This action cannot be undone and will
                  permanently remove the message history.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteMessages}>
                  Delete Messages
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
