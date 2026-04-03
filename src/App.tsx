import { useEffect, useRef, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RideProvider } from "@/context/RideContext";
import { SocketProvider } from "@/context/SocketContext";
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

const AppRoutes = () => {
  const { isAuthenticated, isHydrated } = useAuthState();

  return (
    <Routes>
      <Route
        path="/"
        element={<Welcome />}
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
            <Signup />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
            <ForgotPassword />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
            <SearchRide />
          </ProtectedRoute>
        }
      />
      <Route
        path="/post-ride"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
            <PostRide />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-rides"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
            <MyRides />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
            <MyBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ride/:id"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
            <RideDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isHydrated={isHydrated}>
            <NotFound />
          </ProtectedRoute>
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
        <SocketProvider>
          <RideProvider>
            <AppRoutes />
          </RideProvider>
        </SocketProvider>
        <CookieConsent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
