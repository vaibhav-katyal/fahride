import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Mail, Lock, ArrowRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.endsWith("@chitkara.edu.in")) {
      setError("Only Chitkara University email IDs (@chitkara.edu.in) are allowed.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const previous = localStorage.getItem("easyride_user");
    const previousUser = previous ? JSON.parse(previous) : {};
    const fallbackName = email.split("@")[0].replace(/[._-]/g, " ");

    localStorage.setItem(
      "easyride_user",
      JSON.stringify({
        ...previousUser,
        email,
        name: previousUser.name || fallbackName,
        phone: previousUser.phone || "",
      })
    );
    navigate("/home");
  };

  return (
    <div className="app-container flex flex-col bg-background min-h-screen px-6 py-10">
      <div className="flex items-center gap-2 mb-12">
        <div className="bg-primary rounded-full p-2">
          <Car className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">
          Chit <span className="text-primary">Pool</span>
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back!</h1>
        <p className="text-muted-foreground text-sm">Sign in with your Chitkara email</p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4 flex-1">
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

        {error && (
          <p className="text-destructive text-xs font-medium px-1">{error}</p>
        )}

        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-4 transition-colors"
        >
          Sign In <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-muted-foreground text-xs mt-2">
          Don't have an account?{" "}
          <button type="button" onClick={() => navigate("/signup")} className="text-primary font-semibold">
            Sign Up
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;
