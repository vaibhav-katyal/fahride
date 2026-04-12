import { useEffect, useRef, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import AnalyticsHealthBadge from "@/components/AnalyticsHealthBadge";
import { RideProvider } from "@/context/RideContext";
import { SocketProvider } from "@/context/SocketContext";
import { MaintenanceProvider, useMaintenance } from "@/context/MaintenanceContext";
import { CoinRewardProvider } from "@/context/CoinRewardContext";
import CookieConsent from "@/components/CookieConsent";
import { AUTH_CHANGED_EVENT, getCurrentUser, hydrateCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import SearchRide from "./pages/SearchRide";
import PostRide from "./pages/PostRide";
import Profile from "./pages/Profile";
import RideDetail from "./pages/RideDetail";
import Notifications from "./pages/Notifications";
import MyRides from "./pages/MyRides";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import MaintenanceMode from "./pages/MaintenanceMode";

const queryClient = new QueryClient();

const useAuthState = () => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener(AUTH_CHANGED_EVENT, syncUser);
    void hydrateCurrentUser().finally(() => {
      syncUser();
      setIsHydrated(true);
    });

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncUser);
    };
  }, []);

  return {
    isAuthenticated: Boolean(currentUser?.id),
    isHydrated,
  };
};

const ProtectedRoute = ({
  isAuthenticated,
  isHydrated,
  children,
}: {
  isAuthenticated: boolean;
  isHydrated: boolean;
  children: ReactNode;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const lastWarnedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!isHydrated || isAuthenticated) return;

    const attemptedPath = `${location.pathname}${location.search}`;
    if (lastWarnedPath.current === attemptedPath) return;
    lastWarnedPath.current = attemptedPath;

    toast.error("Login first to continue.", {
      action: {
        label: "Sign In",
        onClick: () => navigate("/login"),
      },
    });
  }, [isAuthenticated, isHydrated, location.pathname, location.search, navigate]);

  if (!isHydrated) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute = ({
  isAuthenticated,
  isHydrated,
  children,
}: {
  isAuthenticated: boolean;
  isHydrated: boolean;
  children: ReactNode;
}) => {
  if (!isHydrated) return null;
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return <>{children}</>;
};

const MaintenancePageGuard = ({
  isMaintenanceMode,
}: {
  isMaintenanceMode: boolean;
}) => {
  if (!isMaintenanceMode) {
    return <Navigate to="/" replace />;
  }
  return <MaintenanceMode />;
};

const MaintenanceRoute = ({
  isMaintenanceMode,
  children,
}: {
  isMaintenanceMode: boolean;
  children: ReactNode;
}) => {
  if (isMaintenanceMode) {
    return <Navigate to="/maintenance" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, isHydrated } = useAuthState();
  const { isMaintenanceMode } = useMaintenance();

  return (
    <Routes>
      {/* Admin Routes - Not affected by maintenance mode */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/v1/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      {/* Maintenance Mode Route - Protected by maintenance status check */}
      <Route path="/maintenance" element={<MaintenancePageGuard isMaintenanceMode={isMaintenanceMode} />} />

      {/* Public Routes */}
      <Route
        path="/"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <Welcome />
          </MaintenanceRoute>
        }
      />
      <Route
        path="/login"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <PublicOnlyRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
              <Login />
            </PublicOnlyRoute>
          </MaintenanceRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <PublicOnlyRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
              <Signup />
            </PublicOnlyRoute>
          </MaintenanceRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <PublicOnlyRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
              <ForgotPassword />
            </PublicOnlyRoute>
          </MaintenanceRoute>
        }
      />
      <Route
        path="/terms"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <TermsAndConditions />
          </MaintenanceRoute>
        }
      />
      <Route
        path="/privacy"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <PrivacyPolicy />
          </MaintenanceRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/home"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
              <Home />
            </ProtectedRoute>
          </MaintenanceRoute>
        }
      />
      <Route
        path="/search"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
              <SearchRide />
            </ProtectedRoute>
          </MaintenanceRoute>
        }
      />
      <Route
        path="/post-ride"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
              <PostRide />
            </ProtectedRoute>
          </MaintenanceRoute>
        }
      />
      <Route
        path="/my-rides"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
              <MyRides />
            </ProtectedRoute>
          </MaintenanceRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
              <MyBookings />
            </ProtectedRoute>
          </MaintenanceRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
              <Profile />
            </ProtectedRoute>
          </MaintenanceRoute>
        }
      />
      <Route
        path="/ride/:id"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
              <RideDetail />
            </ProtectedRoute>
          </MaintenanceRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
              <Notifications />
            </ProtectedRoute>
          </MaintenanceRoute>
        }
      />
      <Route
        path="*"
        element={
          <MaintenanceRoute isMaintenanceMode={isMaintenanceMode}>
            <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
              <NotFound />
            </ProtectedRoute>
          </MaintenanceRoute>
        }
      />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MaintenanceProvider>
          <AnalyticsTracker />
          <AnalyticsHealthBadge />
          <SocketProvider>
            <RideProvider>
              <CoinRewardProvider>
                <AppRoutes />
              </CoinRewardProvider>
            </RideProvider>
          </SocketProvider>
          <CookieConsent />
        </MaintenanceProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
