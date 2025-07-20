import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Save,
  Edit,
  Key,
  Bell,
  Activity,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  role: string;
  joinDate?: string;
  lastLogin?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || "",
    name: user?.name || "",
    email: user?.email || "",
    phone: (user as any)?.phone || "+254700000000",
    department: user?.department || "Administration",
    position: "System Administrator",
    role: user?.role || "Admin",
    joinDate: "2023-01-15",
    lastLogin: new Date().toISOString(),
    address: "123 Church Street, Nairobi, Kenya",
    emergencyContact: "Jane Doe",
    emergencyPhone: "+254700000001",
  });

  const [activityLogs] = useState([
    {
      id: 1,
      action: "Logged in",
      timestamp: "2025-01-15 14:30:00",
      details: "Successful login from 192.168.1.100",
      type: "login",
    },
    {
      id: 2,
      action: "Created backup",
      timestamp: "2025-01-15 14:25:00",
      details: "Manual system backup initiated",
      type: "system",
    },
    {
      id: 3,
      action: "Updated member record",
      timestamp: "2025-01-15 14:20:00",
      details: "Modified John Doe's membership information",
      type: "data",
    },
    {
      id: 4,
      action: "Approved transaction",
      timestamp: "2025-01-15 14:15:00",
      details: "Approved offering transaction #T12345",
      type: "finance",
    },
    {
      id: 5,
      action: "Generated report",
      timestamp: "2025-01-15 14:10:00",
      details: "Monthly financial report exported",
      type: "report",
    },
  ]);

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    systemAlerts: true,
    weeklyReports: true,
    language: "English",
    timezone: "Africa/Nairobi",
    dateFormat: "DD/MM/YYYY",
    theme: "System",
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "login":
        return <User className="h-4 w-4" />;
      case "system":
        return <Shield className="h-4 w-4" />;
      case "data":
        return <Edit className="h-4 w-4" />;
      case "finance":
        return <Activity className="h-4 w-4" />;
      case "report":
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "login":
        return "text-green-600 bg-green-50";
      case "system":
        return "text-blue-600 bg-blue-50";
      case "data":
        return "text-yellow-600 bg-yellow-50";
      case "finance":
        return "text-purple-600 bg-purple-50";
      case "report":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="My Profile"
          description="Manage your personal information, preferences, and account settings"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-red-800 text-white text-2xl">
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{profile.name}</CardTitle>
              <Badge variant="outline" className="w-fit mx-auto">
                {profile.role}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.department}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Joined {formatDateTime(profile.joinDate || "")}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Last login {formatDateTime(profile.lastLogin || "")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList>
                <TabsTrigger value="profile">Profile Information</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="activity">Activity Log</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Personal Information</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {isEditing ? "Cancel" : "Edit"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profile.name}
                          disabled={!isEditing}
                          onChange={(e) =>
                            setProfile({ ...profile, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled={!isEditing}
                          onChange={(e) =>
                            setProfile({ ...profile, email: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profile.phone}
                          disabled={!isEditing}
                          onChange={(e) =>
                            setProfile({ ...profile, phone: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="position">Position</Label>
                        <Input
                          id="position"
                          value={profile.position}
                          disabled={!isEditing}
                          onChange={(e) =>
                            setProfile({ ...profile, position: e.target.value })
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={profile.address}
                          disabled={!isEditing}
                          onChange={(e) =>
                            setProfile({ ...profile, address: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Emergency Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="emergencyContact">Contact Name</Label>
                          <Input
                            id="emergencyContact"
                            value={profile.emergencyContact}
                            disabled={!isEditing}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                emergencyContact: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="emergencyPhone">Contact Phone</Label>
                          <Input
                            id="emergencyPhone"
                            value={profile.emergencyPhone}
                            disabled={!isEditing}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                emergencyPhone: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={loading}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences">
                <Card>
                  <CardHeader>
                    <CardTitle>System Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>Email Notifications</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.emailNotifications}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                emailNotifications: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>SMS Notifications</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.smsNotifications}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                smsNotifications: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Bell className="h-4 w-4" />
                            <span>System Alerts</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.systemAlerts}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                systemAlerts: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-3">System Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="language">Language</Label>
                          <select
                            id="language"
                            value={preferences.language}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                language: e.target.value,
                              })
                            }
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="English">English</option>
                            <option value="Swahili">Swahili</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="timezone">Timezone</Label>
                          <select
                            id="timezone"
                            value={preferences.timezone}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                timezone: e.target.value,
                              })
                            }
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="Africa/Nairobi">
                              Africa/Nairobi (EAT)
                            </option>
                            <option value="UTC">UTC</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSavePreferences}
                        disabled={loading}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activityLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start space-x-3 p-3 rounded-lg border"
                        >
                          <div
                            className={`p-2 rounded-full ${getActionColor(log.type)}`}
                          >
                            {getActionIcon(log.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">
                                {log.action}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(log.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {log.details}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Enable Two-Factor Authentication
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        View Login History
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Account Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Account Status:</span>
                          <Badge variant="outline" className="text-green-600">
                            Active
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Two-Factor Auth:</span>
                          <Badge variant="outline" className="text-red-600">
                            Disabled
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Password Change:</span>
                          <span className="text-muted-foreground">
                            3 months ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
