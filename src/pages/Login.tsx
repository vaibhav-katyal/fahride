import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import {
  isCollegeEmail,
  sanitizePhone,
  setCurrentUserFromAccount,
} from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    if (!isCollegeEmail(normalizedEmail)) {
      setError("Only Chitkara University email IDs (@chitkara.edu.in) are allowed.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    apiRequest<{ success: boolean; message: string; data: { email: string; resendAfter: string } }>("/auth/login/request-otp", {
      method: "POST",
      body: JSON.stringify({
        email: normalizedEmail,
        password,
      }),
    })
      .then((response) => {
        setEmail(normalizedEmail);
        setOtpStep(true);
        setResendAfterTime(new Date(response.data.resendAfter).getTime());
        toast.success("OTP sent to your email.");
      })
      .catch((apiError: unknown) => {
        const errorMsg = apiError instanceof Error ? apiError.message : "Failed to send OTP";
        setError(errorMsg);
        if (errorMsg.includes("Please wait")) {
          toast.error("OTP request already sent. Please check your email or wait before retrying.");
        }
      })
      .finally(() => setIsLoading(false));
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    apiRequest<{ success: boolean; message: string; data: { user: { id?: string; name: string; email: string; phone: string; branch?: string; year?: string; role?: "user" | "admin" }; accessToken: string } }>(
      "/auth/login/verify-otp",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          otp: otp.trim(),
          purpose: "login",
        }),
      }
    )
      .then((response) => {
        setCurrentUserFromAccount(response.data.user, response.data.accessToken);
        navigate("/home");
      })
      .catch((apiError: unknown) => {
        setError(apiError instanceof Error ? apiError.message : "Failed to verify OTP");
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
        <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back!</h1>
        <p className="text-muted-foreground text-sm">
          {otpStep ? "Verify OTP to sign in" : "Sign in with your Chitkara email"}
        </p>
      </div>

      <form onSubmit={otpStep ? handleVerifyOtp : handleLogin} className="flex flex-col gap-4 flex-1">
        {!otpStep && (
          <>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="yourname@chitkara.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                required
              />
            </div>

            <button 
              type="button" 
              onClick={() => navigate("/forgot-password")} 
              className="text-right text-xs text-primary font-semibold px-1 hover:underline"
            >
              Forgot password?
            </button>
          </>
        )}

        {otpStep && (
          <>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(sanitizePhone(e.target.value).slice(0, 6))}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                required
              />
            </div>

            <p className="text-xs text-muted-foreground px-1">
              OTP sent to {email}.
            </p>

            {remainingSeconds > 0 ? (
              <div className="flex items-center gap-2 px-1 py-2 bg-amber-50 dark:bg-amber-950 rounded-lg text-amber-800 dark:text-amber-200 text-xs">
                <Clock className="w-4 h-4" />
                <span>Resend available in {remainingSeconds} seconds</span>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={handleLogin} 
                className="text-left text-xs text-primary font-semibold px-1 hover:underline"
              >
                Resend OTP
              </button>
            )}
          </>
        )}

        {error && (
          <p className="text-destructive text-xs font-medium px-1">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-4 transition-colors"
        >
          {isLoading ? "Please wait..." : otpStep ? "Verify OTP" : "Send OTP"} <ArrowRight className="w-4 h-4" />
        </button>

        {!otpStep && (
          <p className="text-center text-muted-foreground text-xs mt-2">
            Don't have an account?{" "}
            <button type="button" onClick={() => navigate("/signup")} className="text-primary font-semibold">
              Sign Up
            </button>
          </p>
        )}
      </form>
    </div>
  );
};

export default Login;
