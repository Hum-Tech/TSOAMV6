import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Church,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Loader2,
  UserPlus,
  Key,
  User,
  Phone,
  Building,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function Login() {
  const {
    isAuthenticated,
    login,
    isLoading,
    requireOTP,
    user,
    createAccount,
    validateDate,
    getAllUsers,
    changeUserPassword,
  } = useAuth();

  // Login form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attemptingLogin, setAttemptingLogin] = useState(false);

  // Create account states
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [createAccountForm, setCreateAccountForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    employeeId: "",
    temporaryPassword: "",
  });

  // Real-time validation states
  const [emailValidation, setEmailValidation] = useState({
    isValid: true,
    message: "",
    isChecking: false,
  });

  // Real-time email validation function
  const validateEmailRealTime = (email: string) => {
    if (!email) {
      setEmailValidation({ isValid: true, message: "", isChecking: false });
      return;
    }

    setEmailValidation({ isValid: true, message: "", isChecking: true });

    setTimeout(() => {
      // Basic format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailValidation({
          isValid: false,
          message: "Invalid email format",
          isChecking: false,
        });
        return;
      }

      // Check for duplicate email
      const allUsers = getAllUsers();
      const emailExists = allUsers.find(
        (user: any) => user.email.toLowerCase() === email.toLowerCase(),
      );

      if (emailExists) {
        setEmailValidation({
          isValid: false,
          message: "⚠️ Email already exists in system",
          isChecking: false,
        });
        return;
      }

      // Check suspicious domains
      const suspiciousDomains = [
        "tempmail.com",
        "10minutemail.com",
        "guerrillamail.com",
        "mailinator.com",
      ];
      const emailDomain = email.split("@")[1]?.toLowerCase();
      if (suspiciousDomains.includes(emailDomain)) {
        setEmailValidation({
          isValid: false,
          message: "⚠️ Temporary email services not allowed",
          isChecking: false,
        });
        return;
      }

      // Email is valid
      setEmailValidation({
        isValid: true,
        message: "✅ Email is available",
        isChecking: false,
      });
    }, 500); // 500ms debounce
  };

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: code, 3: new password

  // Check if current user is admin
  const isAdmin =
    user?.role === "Admin" &&
    (user?.canCreateAccounts || user?.canDeleteAccounts);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAttemptingLogin(true);

    if (!email || !password) {
      setError("Please enter both email and password");
      setAttemptingLogin(false);
      return;
    }

    if (requireOTP && !otp) {
      setError("Please enter the OTP sent to your email");
      setAttemptingLogin(false);
      return;
    }

    const success = await login(email, password, otp, rememberMe);

    if (!success) {
      if (requireOTP && !otp) {
        setError("OTP has been sent to your email. Please enter it below.");
      } else if (requireOTP && otp) {
        setError("Invalid OTP. Please check and try again.");
      } else {
        setError("Invalid email or password");
      }
    }

    setAttemptingLogin(false);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !createAccountForm.fullName ||
      !createAccountForm.email ||
      !createAccountForm.role
    ) {
      setError("Please fill in all required fields");
      return;
    }

    // Comprehensive email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createAccountForm.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Check for duplicate email - Enhanced security control
    const allUsers = getAllUsers();
    const emailExists = allUsers.find(
      (user: any) =>
        user.email.toLowerCase() === createAccountForm.email.toLowerCase(),
    );

    if (emailExists) {
      setError(
        `❌ EMAIL ALREADY EXISTS!\n\n` +
          `The email "${createAccountForm.email}" is already registered in the system.\n\n` +
          `• If this is your email, try logging in instead\n` +
          `• If you forgot your password, use the "Forgot Password" option\n` +
          `• Contact administrator if you believe this is an error\n\n` +
          `��� For security reasons, duplicate emails are not allowed.`,
      );
      return;
    }

    // Additional security validations
    if (createAccountForm.fullName.length < 2) {
      setError("Full name must be at least 2 characters long");
      return;
    }

    if (createAccountForm.fullName.length > 100) {
      setError("Full name is too long (maximum 100 characters)");
      return;
    }

    // Validate email domain (basic security check)
    const suspiciousDomains = [
      "tempmail.com",
      "10minutemail.com",
      "guerrillamail.com",
      "mailinator.com",
    ];
    const emailDomain = createAccountForm.email.split("@")[1]?.toLowerCase();
    if (suspiciousDomains.includes(emailDomain)) {
      setError(
        "Please use a permanent email address (temporary email services are not allowed)",
      );
      return;
    }

    // Validate phone number if provided
    if (createAccountForm.phone && createAccountForm.phone.length > 0) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (
        !phoneRegex.test(createAccountForm.phone.replace(/[\s\-\(\)]/g, ""))
      ) {
        setError("Please enter a valid phone number");
        return;
      }
    }

    try {
      // Send account creation request to backend for verification
      const response = await fetch("/api/auth/users/create-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createAccountForm.fullName,
          email: createAccountForm.email,
          phone: createAccountForm.phone,
          role: createAccountForm.role,
          department: createAccountForm.department,
          employee_id: createAccountForm.employeeId,
          requested_by: user?.name || "Login Form",
          ip_address: window.location.hostname,
          request_reason: "New user account creation request",
        }),
      });

      // Check if response is ok before trying to read body
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Clone response to avoid body stream issues
      const responseClone = response.clone();
      let result;

      try {
        result = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, try with the cloned response
        console.warn(
          "JSON parsing failed, trying with cloned response:",
          jsonError,
        );
        result = await responseClone.json();
      }

      if (result.success) {
        // Reset form and validation state
        setCreateAccountForm({
          fullName: "",
          email: "",
          phone: "",
          role: "",
          department: "",
          employeeId: "",
          temporaryPassword: "",
        });
        setEmailValidation({ isValid: true, message: "", isChecking: false });
        setShowCreateAccount(false);

        const demoNote = result.demo
          ? "\n\n(Demo Mode - Database Offline)"
          : "";
        alert(
          `✅ ACCOUNT CREATED SUCCESSFULLY!\n\n📋 Account Details:\n• Name: ${createAccountForm.fullName}\n• Email: ${createAccountForm.email}\n• Role: ${createAccountForm.role}\n\n⚠️ ACTIVATION REQUIRED:\n• Your account has been created but needs admin activation\n• Administrators can activate your account in the Users module\n• You will be able to login once your account is activated\n\n💡 Please contact an administrator to activate your account.${demoNote}`,
        );

        // Log the activity (non-blocking)
        fetch("/api/system-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Account Creation Request",
            module: "Authentication",
            details: `New account request for ${createAccountForm.fullName} (${createAccountForm.email}) - Role: ${createAccountForm.role}`,
            severity: "Info",
          }),
        }).catch((logError) => {
          console.warn("System logging failed:", logError);
        });
      } else {
        setError(result.error || "Failed to submit account request");
      }
    } catch (error) {
      console.error("Account creation request error:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to submit account request. Please try again.";
      if (error.message.includes("Failed to fetch")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.message.includes("body stream already read")) {
        errorMessage = "Request processing error. Please try again.";
      } else if (error.message.includes("HTTP error")) {
        errorMessage = `Server error: ${error.message}`;
      }

      setError(errorMessage);

      // Fallback to local account creation using AuthContext
      try {
        const result = await createAccount(createAccountForm);
        if (result.success && result.credentials) {
          // Reset form and validation state
          setCreateAccountForm({
            fullName: "",
            email: "",
            phone: "",
            role: "",
            department: "",
            employeeId: "",
            temporaryPassword: "",
          });
          setEmailValidation({ isValid: true, message: "", isChecking: false });
          setShowCreateAccount(false);

          alert(
            `✅ ACCOUNT CREATED SUCCESSFULLY! (Local Mode)\n\n📋 Account Details:\n• Name: ${createAccountForm.fullName}\n• Email: ${createAccountForm.email}\n• Role: ${createAccountForm.role}\n• Employee ID: ${result.credentials.employeeId}\n• Temporary Password: ${result.credentials.tempPassword}\n\n⚠️ ACTIVATION REQUIRED:\n• Your account is pending admin activation\n• Visit the Users module to activate this account\n• You can login after activation with the temporary password\n\n💡 Account will appear in the "Pending Activation" tab in Users module.`,
          );
        } else {
          setError(
            result.error || "Failed to create account. Please try again.",
          );
        }
      } catch (fallbackError) {
        console.error("Fallback account creation failed:", fallbackError);
        setError("Unable to create account. Please contact administrator.");
      }
    }
  };

  const handleForgotPassword = async (step: number) => {
    setError("");

    if (step === 1) {
      if (!forgotPasswordEmail) {
        setError("Please enter your email address");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(forgotPasswordEmail)) {
        setError("Please enter a valid email address");
        return;
      }

      try {
        // Request password reset from API
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotPasswordEmail }),
        });

        const result = await response.json();

        if (result.success) {
          // Move to step 2 (enter reset code)
          setResetStep(2);
          setError("");

          // In demo mode, show the reset code
          if (result.demo && result.resetCode) {
            alert(
              `🔑 RESET CODE SENT!\n\n📧 Email: ${forgotPasswordEmail}\n🔢 Reset Code: ${result.resetCode}\n\n⏰ Code expires in 15 minutes.\n\n💡 In production, this code would be sent to your email.`,
            );
          } else {
            alert(
              `📧 Reset code sent to ${forgotPasswordEmail}\n\n⏰ Code expires in 15 minutes.\nPlease check your email.`,
            );
          }
        } else {
          setError(result.error || "Failed to send reset code");
        }
      } catch (error) {
        console.error("Forgot password request error:", error);

        // Fallback to local system if API fails
        const allUsers = getAllUsers();
        const userExists = allUsers.find(
          (u) => u.email === forgotPasswordEmail,
        );

        if (!userExists) {
          setError("Email not found in system");
          return;
        }

        // Generate and "send" reset code
        const resetCode = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();
        setResetCode(resetCode);
        setResetStep(2);
        alert(
          `🔑 RESET CODE (Offline Mode)\n\n📧 Email: ${forgotPasswordEmail}\n🔢 Reset Code: ${resetCode}\n\n⚠️ System is in offline mode.`,
        );
      }
    } else if (step === 2) {
      if (!resetCode || resetCode.length !== 6) {
        setError("Please enter the 6-digit reset code");
        return;
      }

      try {
        // Verify reset code with API
        const response = await fetch("/api/auth/verify-reset-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: forgotPasswordEmail,
            resetCode: resetCode,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setResetStep(3);
          setError("");
        } else {
          setError(result.error || "Invalid reset code");
        }
      } catch (error) {
        console.error("Verify reset code error:", error);
        // In offline mode, just proceed to next step
        setResetStep(3);
        setError("");
      }
    } else if (step === 3) {
      if (!newPassword || newPassword.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }

      try {
        // Reset password via API
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: forgotPasswordEmail,
            resetCode: resetCode,
            newPassword: newPassword,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Reset all states
          setShowForgotPassword(false);
          setResetStep(1);
          setForgotPasswordEmail("");
          setResetCode("");
          setNewPassword("");
          setError("");

          alert(
            "✅ PASSWORD RESET SUCCESSFUL!\n\n🔐 Your password has been updated.\n🚪 You can now login with your new password.\n\n💡 Please login with your new credentials.",
          );
        } else {
          setError(result.error || "Failed to reset password");
        }
      } catch (error) {
        console.error("Reset password error:", error);

        // Fallback to local system if API fails
        const allUsers = getAllUsers();
        const userToUpdate = allUsers.find(
          (u) => u.email === forgotPasswordEmail,
        );

        if (userToUpdate && changeUserPassword) {
          const success = changeUserPassword(userToUpdate.id, newPassword);

          if (success) {
            setShowForgotPassword(false);
            setResetStep(1);
            setForgotPasswordEmail("");
            setResetCode("");
            setNewPassword("");
            setError("");
            alert(
              "✅ PASSWORD RESET SUCCESSFUL!\n\n🔐 Your password has been updated (Offline Mode).\n🚪 You can now login with your new password.",
            );
          } else {
            setError("Failed to reset password. Please try again.");
          }
        } else {
          setError("User not found. Please contact administrator.");
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
      <div className="w-full max-w-md space-y-8 mt-8">
        {/* Church Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-white p-6 rounded-full shadow-xl border-4 border-red-100">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F0627183da1a04fa4b6c5a1ab36b4780e%2F24ea526264444b8ca043118a01335902?format=webp&width=800"
                alt="TSOAM Logo"
                className="h-24 w-24 object-contain"
              />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: "#800020" }}>
              The Seed of Abraham Ministry (TSOAM)
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Church Management System
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">
              Sign in to your account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                    disabled={attemptingLogin}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    disabled={attemptingLogin}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    disabled={attemptingLogin}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {requireOTP && (
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="pl-10"
                      maxLength={6}
                      disabled={attemptingLogin}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                    disabled={attemptingLogin}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    Remember me (7 days)
                  </Label>
                </div>

                <Dialog
                  open={showForgotPassword}
                  onOpenChange={setShowForgotPassword}
                >
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-500"
                      disabled={attemptingLogin}
                    >
                      Forgot password?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-blue-600" />
                        Reset Password
                      </DialogTitle>
                    </DialogHeader>

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center space-x-2 py-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          resetStep >= 1
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        1
                      </div>
                      <div
                        className={`h-1 w-8 ${resetStep >= 2 ? "bg-blue-600" : "bg-gray-200"}`}
                      ></div>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          resetStep >= 2
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        2
                      </div>
                      <div
                        className={`h-1 w-8 ${resetStep >= 3 ? "bg-blue-600" : "bg-gray-200"}`}
                      ></div>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          resetStep >= 3
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        3
                      </div>
                    </div>

                    <div className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      {resetStep === 1 && (
                        <>
                          <div className="text-center">
                            <Mail className="h-12 w-12 mx-auto text-blue-600 mb-3" />
                            <h3 className="font-medium text-gray-900 mb-2">
                              Enter Your Email
                            </h3>
                            <p className="text-sm text-gray-600">
                              We'll send you a 6-digit reset code to verify your
                              identity.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="resetEmail">Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                id="resetEmail"
                                type="email"
                                value={forgotPasswordEmail}
                                onChange={(e) =>
                                  setForgotPasswordEmail(e.target.value)
                                }
                                placeholder="Enter your email address"
                                className="pl-10"
                                autoComplete="email"
                              />
                            </div>
                          </div>
                          <Button
                            onClick={() => handleForgotPassword(1)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            disabled={!forgotPasswordEmail}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Send Reset Code
                          </Button>
                        </>
                      )}

                      {resetStep === 2 && (
                        <>
                          <div className="text-center">
                            <Shield className="h-12 w-12 mx-auto text-green-600 mb-3" />
                            <h3 className="font-medium text-gray-900 mb-2">
                              Enter Reset Code
                            </h3>
                            <p className="text-sm text-gray-600">
                              We sent a 6-digit code to{" "}
                              <span className="font-medium text-blue-600">
                                {forgotPasswordEmail}
                              </span>
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="resetCode">
                              6-Digit Reset Code
                            </Label>
                            <div className="relative">
                              <Shield className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                id="resetCode"
                                type="text"
                                value={resetCode}
                                onChange={(e) => setResetCode(e.target.value)}
                                placeholder="Enter 6-digit code"
                                className="pl-10 text-center tracking-widest"
                                maxLength={6}
                                autoComplete="one-time-code"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setResetStep(1)}
                              className="flex-1"
                            >
                              Back
                            </Button>
                            <Button
                              onClick={() => handleForgotPassword(2)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              disabled={!resetCode || resetCode.length !== 6}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Verify Code
                            </Button>
                          </div>
                        </>
                      )}

                      {resetStep === 3 && (
                        <>
                          <div className="text-center">
                            <Lock className="h-12 w-12 mx-auto text-purple-600 mb-3" />
                            <h3 className="font-medium text-gray-900 mb-2">
                              Create New Password
                            </h3>
                            <p className="text-sm text-gray-600">
                              Enter a strong password (minimum 6 characters).
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="pl-10"
                                autoComplete="new-password"
                              />
                            </div>
                            {newPassword && (
                              <div className="text-xs text-gray-500">
                                Password strength:{" "}
                                {newPassword.length >= 8
                                  ? "Strong"
                                  : newPassword.length >= 6
                                    ? "Medium"
                                    : "Weak"}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setResetStep(2)}
                              className="flex-1"
                            >
                              Back
                            </Button>
                            <Button
                              onClick={() => handleForgotPassword(3)}
                              className="flex-1 bg-purple-600 hover:bg-purple-700"
                              disabled={!newPassword || newPassword.length < 6}
                            >
                              <Lock className="mr-2 h-4 w-4" />
                              Reset Password
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-800 hover:bg-red-900"
                disabled={attemptingLogin || isLoading}
              >
                {attemptingLogin ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {/* Admin Create Account Button */}
            <div className="mt-4 pt-4 border-t">
              <Dialog
                open={showCreateAccount}
                onOpenChange={setShowCreateAccount}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={attemptingLogin}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Create New User Account
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleCreateAccount}
                    className="space-y-4 max-h-[60vh] overflow-y-auto pr-2"
                  >
                    {/* Security Information */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-800">
                            Security Notice
                          </p>
                          <p className="text-blue-700 mt-1">
                            • Email addresses must be unique and verified
                          </p>
                          <p className="text-blue-700">
                            • Account requires admin activation before login
                          </p>
                          <p className="text-blue-700">
                            • All account creation activities are logged
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Error Display */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-red-800">
                              Security Alert
                            </p>
                            <div className="text-red-700 mt-1 whitespace-pre-line">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={createAccountForm.fullName}
                          onChange={(e) =>
                            setCreateAccountForm({
                              ...createAccountForm,
                              fullName: e.target.value,
                            })
                          }
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role *</Label>
                        <Select
                          value={createAccountForm.role}
                          onValueChange={(value) =>
                            setCreateAccountForm({
                              ...createAccountForm,
                              role: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="User">User</SelectItem>
                            <SelectItem value="HR Officer">
                              HR Officer
                            </SelectItem>
                            <SelectItem value="Finance Officer">
                              Finance Officer
                            </SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="createEmail">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          id="createEmail"
                          type="email"
                          value={createAccountForm.email}
                          onChange={(e) => {
                            const email = e.target.value;
                            setCreateAccountForm({
                              ...createAccountForm,
                              email: email,
                            });
                            validateEmailRealTime(email);
                          }}
                          placeholder="Enter email address"
                          className={`pl-10 pr-10 ${
                            emailValidation.isValid === false
                              ? "border-red-500 focus:ring-red-500"
                              : emailValidation.message.includes("✅")
                                ? "border-green-500 focus:ring-green-500"
                                : ""
                          }`}
                        />
                        <div className="absolute right-3 top-2.5">
                          {emailValidation.isChecking ? (
                            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                          ) : emailValidation.message.includes("✅") ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : emailValidation.message.includes("⚠️") ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : null}
                        </div>
                      </div>
                      {emailValidation.message && (
                        <p
                          className={`text-sm ${
                            emailValidation.isValid === false
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {emailValidation.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={createAccountForm.phone}
                          onChange={(e) =>
                            setCreateAccountForm({
                              ...createAccountForm,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={createAccountForm.department}
                          onChange={(e) =>
                            setCreateAccountForm({
                              ...createAccountForm,
                              department: e.target.value,
                            })
                          }
                          placeholder="Enter department"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employeeId">Employee ID</Label>
                        <Input
                          id="employeeId"
                          value={createAccountForm.employeeId}
                          onChange={(e) =>
                            setCreateAccountForm({
                              ...createAccountForm,
                              employeeId: e.target.value,
                            })
                          }
                          placeholder="Auto-generated if empty"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tempPassword">Temporary Password</Label>
                        <Input
                          id="tempPassword"
                          value={createAccountForm.temporaryPassword}
                          onChange={(e) =>
                            setCreateAccountForm({
                              ...createAccountForm,
                              temporaryPassword: e.target.value,
                            })
                          }
                          placeholder="Auto-generated if empty"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCreateAccount(false);
                          setEmailValidation({
                            isValid: true,
                            message: "",
                            isChecking: false,
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          !createAccountForm.fullName ||
                          !createAccountForm.email ||
                          !createAccountForm.role ||
                          emailValidation.isValid === false ||
                          emailValidation.isChecking
                        }
                        className={
                          emailValidation.isValid === false ||
                          emailValidation.isChecking
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }
                      >
                        {emailValidation.isChecking ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Checking...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2025 The Seed of Abraham Ministry. All rights reserved.</p>
          <p className="mt-1">
            For support, contact{" "}
            <a
              href="mailto:admin@tsoam.org"
              className="text-blue-600 hover:text-blue-500"
            >
              admin@tsoam.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
