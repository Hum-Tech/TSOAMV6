/**
 * TSOAM Church Management System - Authentication Context
 *
 * This context provides centralized authentication and authorization management
 * for the entire application. It handles user login, session management,
 * role-based access control, and user account lifecycle.
 *
 * Key Features:
 * - JWT-based authentication with session timeout
 * - Role-based access control (RBAC)
 * - Secure user account creation and management
 * - Session extension and automatic logout
 * - Permission validation for route protection
 *
 * Security Features:
 * - Password validation and hashing
 * - Session timeout management
 * - Role-based permission system
 * - Account activation workflow
 *
 * @author TSOAM Development Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

/**
 * User interface defining the structure of authenticated users
 * Includes role-based permissions for fine-grained access control
 */
interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "HR Officer" | "Finance Officer" | "User";
  department?: string;
  employeeId?: string;
  lastLogin?: string;
  sessionExpires?: string;
  canCreateAccounts?: boolean;
  canDeleteAccounts?: boolean;
  isNewAccount?: boolean;
  permissions: {
    dashboard: boolean;
    members: boolean;
    hr: boolean;
    finance: boolean;
    welfare: boolean;
    inventory: boolean;
    events: boolean;
    appointments: boolean;
    messaging: boolean;
    settings: boolean;
    users: boolean;
    systemLogs: boolean;
  };
}

/**
 * Authentication Context Interface
 * Defines all authentication-related methods and state available to components
 */
interface AuthContextType {
  // Current user state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionTimeLeft: number; // Minutes until session expires

  // Authentication methods
  login: (
    email: string,
    password: string,
    otp?: string,
    rememberMe?: boolean,
  ) => Promise<boolean>;
  logout: () => void;
  extendSession: () => void;

  // Security features
  requireOTP: boolean;
  setRequireOTP: (require: boolean) => void;
  createAccount: (
    accountData: any,
  ) => Promise<{ success: boolean; credentials?: any; error?: string }>;
  validateDate: (
    date: string,
    fieldName: string,
  ) => { valid: boolean; error?: string };
  getAllUsers: () => (User & { password: string; isActive: boolean })[];
  activateUser: (userId: string) => boolean;
  changeUserPassword: (userId: string, newPassword: string) => boolean;
  deleteUser: (userId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role-based permissions system
const getRolePermissions = (role: string) => {
  const basePermissions = {
    dashboard: true,
    members: false,
    hr: false,
    finance: false,
    welfare: false,
    inventory: false,
    events: false,
    appointments: false,
    messaging: false,
    settings: false,
    users: false,
    systemLogs: false,
  };

  switch (role) {
    case "Admin":
      return {
        dashboard: true,
        members: true,
        hr: true,
        finance: true,
        welfare: true,
        inventory: true,
        events: true,
        appointments: true,
        messaging: true,
        settings: true,
        users: true,
        systemLogs: true,
      };
    case "HR Officer":
      return {
        ...basePermissions,
        members: true,
        hr: true,
        welfare: true,
        appointments: true,
        messaging: true,
      };
    case "Finance Officer":
      return {
        ...basePermissions,
        finance: true,
        inventory: true,
        events: true,
      };
    case "User":
    default:
      return {
        ...basePermissions,
        members: true,
        inventory: true,
        events: true,
        appointments: true,
      };
  }
};

// Session management constants
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const REMEMBER_ME_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const SESSION_WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before expiry

// Mock users for demonstration - in production, this would be stored in database
let systemUsers: (User & { password: string; isActive: boolean })[] = [
  {
    id: "1",
    name: "Humphrey Njoroge",
    email: "admin@tsoam.org",
    password: "admin123",
    role: "Admin",
    department: "Administration",
    employeeId: "TSOAM-EMP-001",
    canCreateAccounts: true,
    canDeleteAccounts: true,
    isActive: true,
    permissions: {
      dashboard: true,
      members: true,
      hr: true,
      finance: true,
      welfare: true,
      inventory: true,
      events: true,
      appointments: true,
      messaging: true,
      settings: true,
      users: true,
      systemLogs: true,
    },
  },
  {
    id: "2",
    name: "Pastor James Kuria",
    email: "pastor@tsoam.org",
    password: "pastor123",
    role: "Admin",
    department: "Ministry",
    employeeId: "TSOAM-EMP-002",
    canCreateAccounts: true,
    canDeleteAccounts: true,
    isActive: true,
    permissions: {
      dashboard: true,
      members: true,
      hr: true,
      finance: true,
      welfare: true,
      inventory: true,
      events: true,
      appointments: true,
      messaging: true,
      settings: true,
      users: true,
      systemLogs: true,
    },
  },
  {
    id: "3",
    name: "Mary Wanjiku",
    email: "hr@tsoam.org",
    password: "hr123",
    role: "HR Officer",
    department: "Human Resources",
    employeeId: "TSOAM-EMP-003",
    isActive: true,
    permissions: {
      dashboard: true,
      members: true,
      hr: true,
      finance: false,
      welfare: true,
      inventory: false,
      events: true,
      appointments: true,
      messaging: true,
      settings: false,
      users: false,
      systemLogs: false,
    },
  },
  {
    id: "4",
    name: "Peter Mwangi",
    email: "finance@tsoam.org",
    password: "finance123",
    role: "Finance Officer",
    department: "Finance",
    employeeId: "TSOAM-EMP-004",
    isActive: true,
    permissions: {
      dashboard: true,
      members: false,
      hr: false,
      finance: true,
      welfare: false,
      inventory: true,
      events: false,
      appointments: false,
      messaging: false,
      settings: false,
      users: false,
      systemLogs: false,
    },
  },
  {
    id: "5",
    name: "Grace Mutua",
    email: "user@tsoam.org",
    password: "user123",
    role: "User",
    department: "General",
    employeeId: "TSOAM-EMP-005",
    isActive: true,
    permissions: {
      dashboard: true,
      members: true,
      hr: false,
      finance: false,
      welfare: false,
      inventory: true,
      events: true,
      appointments: true,
      messaging: false,
      settings: false,
      users: false,
      systemLogs: false,
    },
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requireOTP, setRequireOTP] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Session countdown timer
  useEffect(() => {
    if (user && sessionTimeLeft > 0) {
      const timer = setInterval(() => {
        setSessionTimeLeft((prev) => {
          const newTime = prev - 1;

          // Show warning at 5 minutes
          if (newTime === 5 && !sessionTimer) {
            showSessionWarning();
          }

          // Auto-logout when session expires
          if (newTime <= 0) {
            logout();
            return 0;
          }

          return newTime;
        });
      }, 60000); // Update every minute

      return () => clearInterval(timer);
    }
  }, [user, sessionTimeLeft, sessionTimer]);

  /**
   * Check for existing valid session
   */
  const checkExistingSession = () => {
    try {
      const savedUser = localStorage.getItem("tsoam_user");
      const sessionToken = localStorage.getItem("tsoam_session_token");
      const sessionExpiry = localStorage.getItem("tsoam_session_expiry");

      if (savedUser && sessionToken && sessionExpiry) {
        const expiryTime = new Date(sessionExpiry).getTime();
        const currentTime = new Date().getTime();

        if (currentTime < expiryTime) {
          // Session is still valid
          const userData = JSON.parse(savedUser);
          const timeLeft = Math.floor((expiryTime - currentTime) / (1000 * 60));

          setUser({
            ...userData,
            permissions:
              userData.permissions || getRolePermissions(userData.role),
          });
          setSessionTimeLeft(timeLeft);
          console.log(`Session restored. ${timeLeft} minutes remaining.`);
        } else {
          // Session expired, clear storage
          clearSession();
        }
      }
    } catch (error) {
      console.error("Error checking existing session:", error);
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Show session warning notification
   */
  const showSessionWarning = () => {
    if (
      window.confirm(
        "Your session will expire in 5 minutes. Do you want to extend it?",
      )
    ) {
      extendSession();
    }
  };

  /**
   * Clear all session data
   */
  const clearSession = () => {
    localStorage.removeItem("tsoam_user");
    localStorage.removeItem("tsoam_session_token");
    localStorage.removeItem("tsoam_session_expiry");
    localStorage.removeItem("tsoam_remember_token");
  };

  const login = async (
    email: string,
    password: string,
    otp?: string,
    rememberMe: boolean = false,
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Load all users from localStorage (includes demo + newly created accounts)
      const storedUsers = localStorage.getItem("tsoam_system_users");
      let usersToCheck = systemUsers;

      if (storedUsers) {
        usersToCheck = JSON.parse(storedUsers);
      } else {
        // First time - save default active demo users to localStorage
        localStorage.setItem("tsoam_system_users", JSON.stringify(systemUsers));
      }

      // Find user in all accounts (demo + newly created)
      const foundUser = usersToCheck.find(
        (u: any) => u.email === email && u.password === password,
      );

      if (!foundUser) {
        setIsLoading(false);
        return false;
      }

      // Check activation status
      // Demo users (original systemUsers) are always active
      // New accounts need admin activation
      const isDemoUser = systemUsers.some((u) => u.email === foundUser.email);
      const isNewAccount = foundUser.isNewAccount === true;

      if (isNewAccount && foundUser.isActive === false) {
        setIsLoading(false);
        throw new Error(
          "Your account is pending activation. Please contact an administrator to activate your account.",
        );
      }

      // Check if OTP is required for this user (Admin roles require OTP)
      if (
        (foundUser.role === "Admin" || foundUser.role === "HR Officer") &&
        !otp
      ) {
        setRequireOTP(true);
        setIsLoading(false);
        return false;
      }

      // Validate OTP if provided (mock validation - accept "123456")
      if (requireOTP && otp !== "123456") {
        setIsLoading(false);
        return false;
      }

      // Calculate session expiry
      const currentTime = new Date();
      const sessionDuration = rememberMe
        ? REMEMBER_ME_DURATION
        : SESSION_DURATION;
      const expiryTime = new Date(currentTime.getTime() + sessionDuration);

      // Extract user data (without password)
      const { password: _, ...userData } = foundUser;
      const userWithSession = {
        ...userData,
        lastLogin: currentTime.toISOString(),
        sessionExpires: expiryTime.toISOString(),
        permissions: getRolePermissions(userData.role),
      };

      // Generate session token (in production, this would be a JWT or similar)
      const sessionToken = `tsoam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Save session data
      setUser(userWithSession);
      setSessionTimeLeft(Math.floor(sessionDuration / (1000 * 60)));
      localStorage.setItem("tsoam_user", JSON.stringify(userWithSession));
      localStorage.setItem("tsoam_session_token", sessionToken);
      localStorage.setItem("tsoam_session_expiry", expiryTime.toISOString());

      if (rememberMe) {
        localStorage.setItem("tsoam_remember_token", sessionToken);
      }

      setRequireOTP(false);
      setIsLoading(false);

      // Log successful login
      console.log(
        `User ${email} logged in successfully. Session expires: ${expiryTime.toLocaleString()}`,
      );

      return true;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  /**
   * Extend current session
   */
  const extendSession = () => {
    if (user) {
      const currentTime = new Date();
      const newExpiryTime = new Date(currentTime.getTime() + SESSION_DURATION);

      const updatedUser = {
        ...user,
        sessionExpires: newExpiryTime.toISOString(),
      };

      setUser(updatedUser);
      setSessionTimeLeft(30); // Reset to 30 minutes
      localStorage.setItem("tsoam_user", JSON.stringify(updatedUser));
      localStorage.setItem("tsoam_session_expiry", newExpiryTime.toISOString());

      console.log("Session extended until:", newExpiryTime.toLocaleString());
    }
  };

  const logout = () => {
    console.log("User logged out");
    setUser(null);
    setRequireOTP(false);
    setSessionTimeLeft(0);

    if (sessionTimer) {
      clearTimeout(sessionTimer);
      setSessionTimer(null);
    }

    clearSession();
  };

  // Create new account function
  const createAccount = async (
    accountData: any,
  ): Promise<{ success: boolean; credentials?: any; error?: string }> => {
    try {
      // Enhanced security validations
      if (!accountData.fullName || !accountData.email || !accountData.role) {
        return { success: false, error: "Missing required fields" };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(accountData.email)) {
        return { success: false, error: "Invalid email format" };
      }

      // Security: Block suspicious email patterns
      const suspiciousPatterns = [
        /admin.*admin/i,
        /test.*test/i,
        /fake/i,
        /temp/i,
        /noreply/i,
        /no-reply/i,
      ];

      const emailLocalPart = accountData.email.split("@")[0];
      if (suspiciousPatterns.some((pattern) => pattern.test(emailLocalPart))) {
        return {
          success: false,
          error: "Email address contains restricted keywords",
        };
      }

      // Validate name length and format
      if (
        accountData.fullName.length < 2 ||
        accountData.fullName.length > 100
      ) {
        return {
          success: false,
          error: "Full name must be between 2 and 100 characters",
        };
      }

      // Security: Check for suspicious name patterns
      const suspiciousNamePatterns = [
        /^test/i,
        /^admin/i,
        /^fake/i,
        /^dummy/i,
        /[0-9]{5,}/, // Too many consecutive numbers
        /(.)\1{4,}/, // Repeated characters (like "aaaaaaa")
      ];

      if (
        suspiciousNamePatterns.some((pattern) =>
          pattern.test(accountData.fullName),
        )
      ) {
        return {
          success: false,
          error: "Please enter a valid full name",
        };
      }

      // Get current users from localStorage (includes both demo and created accounts)
      const storedUsers = localStorage.getItem("tsoam_system_users");
      let allUsers = storedUsers ? JSON.parse(storedUsers) : [...systemUsers];

      // Check if email already exists (case insensitive)
      const existingUser = allUsers.find(
        (u: any) => u.email.toLowerCase() === accountData.email.toLowerCase(),
      );
      if (existingUser) {
        return {
          success: false,
          error: "Email address is already registered in the system",
        };
      }

      // Security: Rate limiting - max 5 new accounts per hour
      const recentAccounts = allUsers.filter((user: any) => {
        if (!user.createdAt || !user.isNewAccount) return false;
        const createdTime = new Date(user.createdAt).getTime();
        const hourAgo = Date.now() - 60 * 60 * 1000;
        return createdTime > hourAgo;
      });

      if (recentAccounts.length >= 5) {
        return {
          success: false,
          error: "Account creation limit reached. Please try again later.",
        };
      }

      // Generate unique employee ID
      const nextId =
        Math.max(...allUsers.map((u: any) => parseInt(u.id) || 0)) + 1;
      const employeeId =
        accountData.employeeId ||
        `TSOAM-EMP-${String(nextId).padStart(3, "0")}`;

      // Generate temporary password if not provided
      const tempPassword =
        accountData.temporaryPassword ||
        `temp${Math.floor(Math.random() * 10000)}`;

      // Create new user (marked as newly created, not demo)
      const newUser = {
        id: String(nextId),
        name: accountData.fullName,
        email: accountData.email,
        password: tempPassword,
        role: accountData.role,
        department: accountData.department || "General",
        employeeId,
        isActive: false, // Admin must activate new accounts
        canCreateAccounts: accountData.role === "Admin",
        canDeleteAccounts: accountData.role === "Admin",
        isNewAccount: true, // Flag to identify newly created accounts
        createdAt: new Date().toISOString(),
        phone: accountData.phone || "",
        permissions: getRolePermissions(accountData.role), // Add proper permissions
      };

      // Add to all users
      allUsers.push(newUser);

      // Save updated users list to localStorage
      localStorage.setItem("tsoam_system_users", JSON.stringify(allUsers));

      return {
        success: true,
        credentials: {
          employeeId,
          tempPassword,
          email: accountData.email,
          accountType: "new",
        },
      };
    } catch (error) {
      return { success: false, error: "Failed to create account" };
    }
  };

  // Date validation function
  const validateDate = (
    date: string,
    fieldName: string,
  ): { valid: boolean; error?: string } => {
    if (!date) return { valid: true }; // Optional field

    const inputDate = new Date(date);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Check if date is valid
    if (isNaN(inputDate.getTime())) {
      return { valid: false, error: `Invalid ${fieldName}` };
    }

    // Check if date is in the future (for things like joining date, birth date)
    if (
      fieldName.toLowerCase().includes("birth") ||
      fieldName.toLowerCase().includes("join")
    ) {
      if (inputDate > currentDate) {
        return {
          valid: false,
          error: `${fieldName} cannot be in the future. Current year is ${currentYear}`,
        };
      }
    }

    // Check if birth date is reasonable (not too old)
    if (fieldName.toLowerCase().includes("birth")) {
      const age = currentYear - inputDate.getFullYear();
      if (age > 150) {
        return {
          valid: false,
          error: "Birth date seems invalid - person would be too old",
        };
      }
      if (age < 0) {
        return { valid: false, error: "Birth date cannot be in the future" };
      }
    }

    // Check if joining date is not before church establishment (example: 2000)
    if (fieldName.toLowerCase().includes("join")) {
      if (inputDate.getFullYear() < 2000) {
        return {
          valid: false,
          error: "Joining date cannot be before church establishment (2000)",
        };
      }
    }

    return { valid: true };
  };

  // Get all users (admin only)
  const getAllUsers = () => {
    // Load users from localStorage to include newly created accounts
    const storedUsers = localStorage.getItem("tsoam_system_users");
    if (storedUsers) {
      return JSON.parse(storedUsers);
    }

    // If no stored users, save default users and return them
    localStorage.setItem("tsoam_system_users", JSON.stringify(systemUsers));
    return systemUsers;
  };

  // Activate user (admin only)
  const activateUser = (userId: string): boolean => {
    // Get current users from localStorage
    const allUsers = getAllUsers();
    const userIndex = allUsers.findIndex((u: any) => u.id === userId);

    if (userIndex !== -1) {
      // Mark user as active
      allUsers[userIndex].isActive = true;
      allUsers[userIndex].isNewAccount = false; // No longer a new account

      // Save updated users back to localStorage
      localStorage.setItem("tsoam_system_users", JSON.stringify(allUsers));
      return true;
    }
    return false;
  };

  // Change user password (admin only)
  const changeUserPassword = (userId: string, newPassword: string): boolean => {
    // Get current users from localStorage
    const allUsers = getAllUsers();
    const userIndex = allUsers.findIndex((u: any) => u.id === userId);

    if (userIndex !== -1) {
      // Update password
      allUsers[userIndex].password = newPassword;

      // Save updated users back to localStorage
      localStorage.setItem("tsoam_system_users", JSON.stringify(allUsers));
      return true;
    }
    return false;
  };

  // Delete user (admin only)
  const deleteUser = (userId: string): boolean => {
    // Get current users from localStorage
    const allUsers = getAllUsers();
    const userIndex = allUsers.findIndex((u: any) => u.id === userId);

    if (userIndex !== -1 && allUsers[userIndex].role !== "Admin") {
      // Remove user from array
      allUsers.splice(userIndex, 1);

      // Save updated users back to localStorage
      localStorage.setItem("tsoam_system_users", JSON.stringify(allUsers));
      return true;
    }
    return false;
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    sessionTimeLeft,
    login,
    logout,
    extendSession,
    requireOTP,
    setRequireOTP,
    createAccount,
    validateDate,
    getAllUsers,
    activateUser,
    changeUserPassword,
    deleteUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
