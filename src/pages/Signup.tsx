import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Phone, ShieldCheck, Clock } from "lucide-react";
import {
  isCollegeEmail,
  sanitizePhone,
  setCurrentUserFromAccount,
  type UserAccount,
} from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

const branches = ["CSE", "Mech Engg", "ECE", "Civil", "MBA", "Pharmacy", "Biotech", "BCA", "BBA"];
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "MBA/PhD"];

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
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

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = sanitizePhone(phone);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!isCollegeEmail(normalizedEmail)) {
      setError("Only Chitkara University email IDs (@chitkara.edu.in) are allowed.");
      return;
    }

    if (normalizedPhone.length !== 10) {
      setError("Please enter a valid phone number.");
      setIsLoading(false);
      return;
    }

    if (!branch || !year) {
      setError("Please select branch and year.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    apiRequest<{ success: boolean; message: string; data: { email: string; resendAfter: string } }>("/auth/signup/request-otp", {
      method: "POST",
      body: JSON.stringify({
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password,
        branch,
        year,
      }),
    })
      .then((response) => {
        setEmail(normalizedEmail);
        setPhone(normalizedPhone);
        setStep("otp");
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

    apiRequest<{ success: boolean; message: string; data: { user: UserAccount; accessToken: string } }>(
      "/auth/signup/verify-otp",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          otp: otp.trim(),
          purpose: "signup",
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
    <div className="app-container desktop-premium-page flex flex-col bg-background min-h-screen px-6 py-10 md:items-center md:justify-center">
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-lime-200/30 blur-3xl" />
      </div>

      <div className="relative md:w-full md:max-w-2xl desktop-glass-card md:p-8">
      <div className="flex items-center gap-1 mb-12 md:mb-8">
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
        <h1 className="text-2xl font-bold text-foreground mb-1">Create Account</h1>
        <p className="text-muted-foreground text-sm">
          {step === "details" ? "Fill details and verify OTP" : "Verify OTP to complete signup"}
        </p>
      </div>

      <form onSubmit={step === "details" ? handleSendOtp : handleVerifyOtp} className="flex flex-col gap-4 flex-1 md:min-h-0">
        {step === "details" && (
          <>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                required
              />
            </div>

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
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Branch</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                  required
                >
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                required
              />
            </div>
          </>
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
                onClick={handleSendOtp} 
                className="text-left text-xs text-primary font-semibold px-1 hover:underline"
              >
                Resend OTP
              </button>
            )}
          </>
        )}

        {error && <p className="text-destructive text-xs font-medium px-1">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-4 transition-colors"
        >
          {isLoading ? "Please wait..." : step === "details" ? "Send OTP" : "Verify OTP"}
          <ArrowRight className="w-4 h-4" />
        </button>

        {step === "details" && (
          <p className="text-center text-muted-foreground text-xs mt-2">
            Already have an account?{" "}
            <button type="button" onClick={() => navigate("/login")} className="text-primary font-semibold">
              Sign In
            </button>
          </p>
        )}
      </form>
      </div>
    </div>
  );
};

export default Signup;
