import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Mail, Lock, User, ArrowRight } from "lucide-react";

const branches = ["CSE", "Mech Engg", "ECE", "Civil", "MBA", "Pharmacy", "Biotech", "BCA", "BBA"];
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "MBA/PhD"];

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.endsWith("@chitkara.edu.in")) {
      setError("Only Chitkara University email IDs (@chitkara.edu.in) are allowed.");
      return;
    }

    if (phone.trim().length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!rollNumber.trim()) {
      setError("Please enter your roll number.");
      return;
    }

    if (!branch || !year) {
      setError("Please select branch and year.");
      return;
    }

    localStorage.setItem("easyride_user", JSON.stringify({ email, name, phone, rollNumber, branch, year }));
    navigate("/home");
  };

  return (
    <div className="app-container flex flex-col bg-background min-h-screen px-6 py-10">
      <div className="flex items-center gap-2 mb-12">
        <div className="bg-primary rounded-full p-2">
          <Car className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">
          Easy <span className="text-primary">Ride</span>
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Create Account</h1>
        <p className="text-muted-foreground text-sm">Join Chitkara's carpooling community</p>
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-4 flex-1">
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
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
            required
          />
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Roll Number"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
            className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
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

        {error && (
          <p className="text-destructive text-xs font-medium px-1">{error}</p>
        )}

        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-4 transition-colors"
        >
          Create Account <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-muted-foreground text-xs mt-2">
          Already have an account?{" "}
          <button type="button" onClick={() => navigate("/login")} className="text-primary font-semibold">
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
};

export default Signup;
