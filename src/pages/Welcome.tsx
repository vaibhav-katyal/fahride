import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import carpoolImg from "@/assets/carpool-illustration.png";
import { AUTH_CHANGED_EVENT, getCurrentUser } from "@/lib/auth";
import { Users, MapPin, Zap, Leaf, ArrowRight, CheckCircle } from "lucide-react";
import WhatsAppCommunityButton from "@/components/WhatsAppCommunityButton";
import { trackPageView } from "@/lib/analytics";

const Welcome = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getCurrentUser()?.id));

  useEffect(() => {
    trackPageView("/welcome");
    const syncAuth = () => {
      setIsAuthenticated(Boolean(getCurrentUser()?.id));
    };

    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden app-container flex flex-col items-center justify-between bg-background px-6 py-10 min-h-screen">
        <div className="fixed right-4 top-4 z-40">
          <WhatsAppCommunityButton compact className="rounded-full px-4 py-2 text-[11px] shadow-[0_14px_34px_rgba(22,163,74,0.38)]" />
        </div>

        <div className="flex items-center gap-1 mt-4">
          <img
            src="/chitpoo_logo.png"
            alt="FahRide Logo"
            width={80}
            height={80}
            className="w-30 h-30"
          />
          <span className="text-2xl font-bold text-foreground leading-tight">
            Fah <span className="text-primary">Ride</span>
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <img
            src={carpoolImg}
            alt="Carpooling illustration"
            width={800}
            height={600}
            className="w-72 h-auto"
          />
        </div>

        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground leading-tight mb-3">
            Share rides easily<br />
            with <span className="text-primary">FahRide</span>
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
            Share your rides daily while commuting to save money and reduce pollution. Exclusively for Chitkara University students.
          </p>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 mb-6"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        {/* Navigation */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/chitpoo_logo.png" alt="FahRide" width={40} height={40} className="w-10 h-10" />
              <span className="text-xl font-bold text-foreground">Fah <span className="text-primary">Ride</span></span>
            </div>
            <div className="flex items-center gap-4">
              <WhatsAppCommunityButton compact className="rounded-lg px-4 py-2 text-xs" />
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="flex-1 pt-20">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="grid grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    🚀 Smart Carpooling for Students
                  </div>
                  <h1 className="text-5xl font-bold leading-tight text-foreground">
                    Share Rides,<br />Save Money
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                    Connect with fellow Chitkara University students, reduce travel costs by up to 50%, and help the environment together.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => navigate("/signup")}
                    className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:scale-105 flex items-center gap-2"
                  >
                    Start Sharing <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="px-8 py-3 rounded-lg border border-border bg-background text-foreground font-semibold hover:bg-secondary transition-all"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {/* Right Illustration */}
              <div className="flex items-center justify-center">
                <img src={carpoolImg} alt="Carpooling" className="w-full max-w-md drop-shadow-2xl" />
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-card/40 border-t border-border/50 py-20">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-foreground mb-3">Why Choose FahRide?</h2>
                <p className="text-muted-foreground text-lg">Everything you need for convenient and affordable commuting</p>
              </div>

              <div className="grid grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 hover:border-primary/30 transition-all group">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Find Ride Partners</h3>
                  <p className="text-sm text-muted-foreground">Connect with verified students heading to the same locations daily</p>
                </div>

                {/* Feature 2 */}
                <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 hover:border-primary/30 transition-all group">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Real-Time Tracking</h3>
                  <p className="text-sm text-muted-foreground">Live location sharing and route updates for safe, coordinated travel</p>
                </div>

                {/* Feature 3 */}
                <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 hover:border-primary/30 transition-all group">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Instant Booking</h3>
                  <p className="text-sm text-muted-foreground">Quick and easy ride requests with real-time notifications</p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="py-20">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-foreground">Smart Benefits</h2>
                  <p className="text-lg text-muted-foreground">Join our growing community of students saving time and money</p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Save Up to 50%</h4>
                        <p className="text-sm text-muted-foreground">Split fuel costs and parking with fellow riders</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Eco-Friendly</h4>
                        <p className="text-sm text-muted-foreground">Reduce carbon footprint and help the environment</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Community First</h4>
                        <p className="text-sm text-muted-foreground">Build connections with your peers while traveling</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">24/7 Support</h4>
                        <p className="text-sm text-muted-foreground">Always available when you need help</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/signup")}
                    className="mt-8 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:shadow-lg w-full sm:w-auto"
                  >
                    Join Now
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                    <Leaf className="w-8 h-8 text-primary mb-3" />
                    <h4 className="font-bold text-foreground mb-2">Eco Impact</h4>
                    <p className="text-2xl font-bold text-primary">1000+ kg</p>
                    <p className="text-xs text-muted-foreground">Carbon saved this month</p>
                  </div>
                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                    <Users className="w-8 h-8 text-primary mb-3" />
                    <h4 className="font-bold text-foreground mb-2">Active Users</h4>
                    <p className="text-2xl font-bold text-primary">2,500+</p>
                    <p className="text-xs text-muted-foreground">Students using FahRide</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-t border-border/50 py-16">
            <div className="max-w-7xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Start Sharing?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">Join thousands of Chitkara University students saving money and making new friends</p>
              <button
                onClick={() => navigate("/signup")}
                className="px-10 py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:scale-105 text-lg"
              >
                Sign Up Free
              </button>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {/* Brand Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <img src="/chitpoo_logo.png" alt="FahRide" width={32} height={32} className="w-8 h-8" />
                    <span className="text-lg font-bold text-foreground">Fah<span className="text-primary">Ride</span></span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Smart carpooling for Chitkara University students. Save money, reduce emissions, and build community.
                  </p>
                </div>

                {/* Quick Links Column */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Quick Links</h4>
                  <div className="space-y-2 text-sm">
                    <button
                      onClick={() => navigate("/login")}
                      className="block text-muted-foreground hover:text-primary transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => navigate("/signup")}
                      className="block text-muted-foreground hover:text-primary transition-colors"
                    >
                      Join Now
                    </button>
                  </div>
                </div>

                {/* Legal Links Column */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Legal</h4>
                  <div className="space-y-2 text-sm">
                    <button
                      onClick={() => navigate("/terms")}
                      className="block text-muted-foreground hover:text-primary transition-colors"
                    >
                      Terms & Conditions
                    </button>
                    <button
                      onClick={() => navigate("/privacy")}
                      className="block text-muted-foreground hover:text-primary transition-colors"
                    >
                      Privacy Policy
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/30 pt-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                  <p>&copy; 2026 FahRide. All rights reserved. Built for Chitkara University students.</p>
                  <div className="flex items-center gap-4">
                  
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile Footer */}
      <footer className="md:hidden border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="px-6 py-8 space-y-6">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src="/chitpoo_logo.png" alt="FahRide" width={32} height={32} className="w-8 h-8" />
              <span className="text-lg font-bold text-foreground">Fah<span className="text-primary">Ride</span></span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Smart carpooling for Chitkara University students. Save money, reduce emissions, and build community.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 pt-4 border-t border-border/30">
            <p className="text-xs font-semibold text-foreground mb-3">Quick Links</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/login")}
                className="w-full text-left text-xs text-muted-foreground hover:text-primary transition-colors py-1"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="w-full text-left text-xs text-muted-foreground hover:text-primary transition-colors py-1"
              >
                Join Now
              </button>
            </div>
          </div>

          {/* Legal Links */}
          <div className="space-y-2 pt-4 border-t border-border/30">
            <p className="text-xs font-semibold text-foreground mb-3">Legal</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/terms")}
                className="w-full text-left text-xs text-muted-foreground hover:text-primary transition-colors py-1"
              >
                Terms & Conditions
              </button>
              <button
                onClick={() => navigate("/privacy")}
                className="w-full text-left text-xs text-muted-foreground hover:text-primary transition-colors py-1"
              >
                Privacy Policy
              </button>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-4 border-t border-border/30 space-y-2 text-center">
            <p className="text-xs text-muted-foreground">&copy; 2026 FahRide. All rights reserved.</p>
           
          </div>
        </div>
      </footer>
    </>
  );
};

export default Welcome;
