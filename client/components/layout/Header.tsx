import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Settings,
  User,
  LogOut,
  Clock,
  Calendar,
  Wifi,
  WifiOff,
  Mail,
  CheckCheck,
  Eye,
  MessageSquare,
  X,
} from "lucide-react";
import { OfflineIndicator } from "@/components/OfflineIndicator";

// Types for notifications and messages
interface Notification {
  id: number;
  type: "message" | "system" | "welfare" | "maintenance";
  title: string;
  message: string;
  time: string;
  unread: boolean;
  sender?: string;
  recipient?: string;
  priority: "low" | "medium" | "high";
}

interface Message {
  id: number;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  delivered: boolean;
  category: string;
}

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "message",
      title: "New Message",
      message: "You have a new message from Pastor James",
      time: "5 min ago",
      unread: true,
      sender: "Pastor James Kuria",
      recipient: user?.name || "You",
      priority: "medium",
    },
    {
      id: 2,
      type: "system",
      title: "Payroll Processed",
      message: "Monthly payroll has been successfully processed",
      time: "1 hour ago",
      unread: true,
      priority: "low",
    },
    {
      id: 3,
      type: "welfare",
      title: "Welfare Request",
      message: "New welfare request requires your approval",
      time: "2 hours ago",
      unread: false,
      priority: "high",
    },
    {
      id: 4,
      type: "maintenance",
      title: "Equipment Maintenance",
      message: "Sound system maintenance is due tomorrow",
      time: "3 hours ago",
      unread: false,
      priority: "medium",
    },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: "Pastor James Kuria",
      to: user?.name || "You",
      subject: "Weekly Service Preparation",
      content:
        "Please prepare the worship songs for this Sunday's service. We'll need 4 songs for the opening and 2 for the closing.",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read: false,
      delivered: true,
      category: "Worship Team",
    },
    {
      id: 2,
      from: "Mary Wanjiku",
      to: user?.name || "You",
      subject: "HR Policy Update",
      content:
        "New HR policies have been updated. Please review the changes in the HR module.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: true,
      delivered: true,
      category: "HR Team",
    },
  ]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
  };

  // Count unread notifications
  const unreadCount = notifications.filter((n) => n.unread).length;
  const unreadMessages = messages.filter((m) => !m.read).length;

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Mark notification as read
  const markNotificationAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification,
      ),
    );
  };

  // Mark message as read
  const markMessageAsRead = (id: number) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, read: true } : message,
      ),
    );
  };

  // Delete notification
  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      case "system":
        return <Settings className="h-4 w-4" />;
      case "welfare":
        return <User className="h-4 w-4" />;
      case "maintenance":
        return <Settings className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left side - Greeting and Time */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-foreground">
              {getTimeBasedGreeting()}, {user.name.split(" ")[0]}!
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Center - Clock */}
        <div className="flex items-center space-x-2 text-sm font-mono">
          <Clock className="h-4 w-4" />
          <span>
            {currentTime.toLocaleTimeString("en-US", {
              hour12: true,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>

        {/* Right side - Status and User Actions */}
        <div className="flex items-center space-x-4">
          {/* Offline Indicator with Sync Status */}
          <OfflineIndicator />

          {/* Notifications */}
          <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount + unreadMessages > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {unreadCount + unreadMessages}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications & Messages
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="notifications" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="notifications" className="relative">
                    Notifications
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-2 h-4 w-4 rounded-full p-0 text-xs"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="relative">
                    Messages
                    {unreadMessages > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-2 h-4 w-4 rounded-full p-0 text-xs"
                      >
                        {unreadMessages}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="notifications"
                  className="max-h-[400px] overflow-y-auto space-y-2"
                >
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          notification.unread
                            ? "border-l-4 border-l-blue-500"
                            : ""
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div
                                className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}
                              >
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm">
                                    {notification.title}
                                  </h4>
                                  {notification.unread && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {notification.time}
                                  </span>
                                  {notification.sender && (
                                    <span className="text-xs text-muted-foreground">
                                      From: {notification.sender}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent
                  value="messages"
                  className="max-h-[400px] overflow-y-auto space-y-2"
                >
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No messages</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <Card
                        key={message.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          !message.read ? "border-l-4 border-l-green-500" : ""
                        }`}
                        onClick={() => {
                          markMessageAsRead(message.id);
                          setSelectedMessage(message);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                                <Mail className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm">
                                    {message.subject}
                                  </h4>
                                  {!message.read && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Unread
                                    </Badge>
                                  )}
                                  {message.delivered && (
                                    <CheckCheck className="h-3 w-3 text-green-500" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {message.content}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    From: {message.from}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(message.timestamp)}
                                  </span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-xs mt-1"
                                >
                                  {message.category}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMessage(message);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-red-800 text-white">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
                <Badge variant="outline" className="w-fit text-xs mt-1">
                  {user.role}
                </Badge>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              {/* Only show Settings for Finance Officer and other authorized roles */}
              {(user.role === "Finance Officer" ||
                user.role === "Admin" ||
                user.role === "HR Officer" ||
                user?.permissions?.settings) && (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Message Detail Dialog */}
      {selectedMessage && (
        <Dialog
          open={!!selectedMessage}
          onOpenChange={() => setSelectedMessage(null)}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {selectedMessage.subject}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">From:</span>
                  <p className="text-muted-foreground">
                    {selectedMessage.from}
                  </p>
                </div>
                <div>
                  <span className="font-medium">To:</span>
                  <p className="text-muted-foreground">{selectedMessage.to}</p>
                </div>
                <div>
                  <span className="font-medium">Category:</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedMessage.category}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Time:</span>
                  <p className="text-muted-foreground">
                    {formatTime(selectedMessage.timestamp)}
                  </p>
                </div>
              </div>
              <div>
                <span className="font-medium">Message:</span>
                <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
                  {selectedMessage.content}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCheck className="h-4 w-4 text-green-500" />
                <span>Delivered</span>
                {selectedMessage.read && (
                  <>
                    <span>•</span>
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span>Read</span>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </header>
  );
}
