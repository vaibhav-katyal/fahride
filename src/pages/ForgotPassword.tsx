import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, ShieldCheck, Clock, Eye, EyeOff } from "lucide-react";
import { isCollegeEmail } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendAfterTime, setResendAfterTime] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    if (!resendAfterTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((resendAfterTime - now) / 1000));
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        setResendAfterTime(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [resendAfterTime]);

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    if (!isCollegeEmail(normalizedEmail)) {
      setError("Only Chitkara University email IDs (@chitkara.edu.in) are allowed.");
      setIsLoading(false);
      return;
    }

    apiRequest<{ success: boolean; message: string; data: { email: string; resendAfter: string } }>("/auth/password-reset/request-otp", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail }),
    })
      .then((response) => {
        setEmail(normalizedEmail);
        setStep("otp");
        setResendAfterTime(new Date(response.data.resendAfter).getTime());
        toast.success("OTP sent to your email.");
      })
      .catch((apiError: unknown) => {
        const errorMsg = apiError instanceof Error ? apiError.message : "Failed to send OTP";
        setError(errorMsg);
        if (errorMsg.includes("Please wait")) {
          toast.error("OTP request already sent. Please wait before retrying.");
        }
      })
      .finally(() => setIsLoading(false));
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setStep("reset");
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    apiRequest<{ success: boolean; message: string }>(
      "/auth/password-reset/reset",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          otp: otp.trim(),
          newPassword,
        }),
      }
    )
      .then(() => {
        toast.success("Password reset successfully! Please login with your new password.");
        navigate("/login");
      })
      .catch((apiError: unknown) => {
        setError(apiError instanceof Error ? apiError.message : "Failed to reset password");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="app-container flex flex-col bg-background min-h-screen px-6 py-10">
      <div className="flex items-center gap-1 mb-12">
        <img
          src="/chitpoo_logo.png"
          alt="Chit Pool Logo"
          width={80}
          height={80}
          className="w-30 h-30"
        />
        <span className="text-xl font-bold text-foreground">
          Chit <span className="text-primary">Pool</span>
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Reset Password</h1>
        <p className="text-muted-foreground text-sm">
          {step === "email" && "Enter your email to reset your password"}
          {step === "otp" && "Verify OTP sent to your email"}
          {step === "reset" && "Create your new password"}
        </p>
      </div>

      <form
        onSubmit={step === "email" ? handleRequestOtp : step === "otp" ? handleVerifyOtp : handleResetPassword}
        className="flex flex-col gap-4 flex-1"
      >
        {step === "email" && (
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              placeholder="yourname@chitkara.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              required
              disabled={isLoading}
            />
          </div>
        )}

        {step === "otp" && (
          <>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                required
                autoFocus
              />
            </div>

            <p className="text-xs text-muted-foreground px-1">OTP sent to {email}.</p>

            {remainingSeconds > 0 ? (
              <div className="flex items-center gap-2 px-1 py-2 bg-amber-50 dark:bg-amber-950 rounded-lg text-amber-800 dark:text-amber-200 text-xs">
                <Clock className="w-4 h-4" />
                <span>Resend available in {remainingSeconds} seconds</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestOtp}
                className="text-left text-xs text-primary font-semibold px-1 hover:underline"
              >
                Resend OTP
              </button>
            )}
          </>
        )}

        {step === "reset" && (
          <>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </>
        )}

        {error && <p className="text-destructive text-xs font-medium px-1">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            "Please wait..."
          ) : step === "email" ? (
            <>
              Send OTP <ArrowRight className="w-4 h-4" />
            </>
          ) : step === "otp" ? (
            <>
              Verify OTP <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Reset Password <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-muted-foreground text-xs mt-2">
          Remember your password?{" "}
          <button type="button" onClick={() => navigate("/login")} className="text-primary font-semibold">
            Login
          </button>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;
