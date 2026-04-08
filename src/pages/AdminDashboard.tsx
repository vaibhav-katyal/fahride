import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, LogOut, Power, Info, Users, Mail, Phone, Book } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMaintenance } from "@/context/MaintenanceContext";
import { apiRequest } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  year: string;
  profileImageUrl: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isMaintenanceMode, setIsMaintenanceMode } = useMaintenance();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingState, setPendingState] = useState<boolean | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");

  // Check if we're in production
  const isProduction = window.location.hostname !== "localhost" && 
                       window.location.hostname !== "127.0.0.1" &&
                       window.location.hostname !== "[::1]";

  useEffect(() => {
    const isAuth = sessionStorage.getItem("adminAuthenticated");
    if (!isAuth) {
      navigate("/admin");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      setUsersError("");
      try {
        const response = await apiRequest<{
          success: boolean;
          data: {
            users: User[];
            total: number;
          };
        }>("/auth/admin/users");
        setUsers(response.data.users);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load users";
        setUsersError(message);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuthenticated");
    navigate("/admin");
  };

  const handleMaintenanceToggle = (newState: boolean) => {
    if (newState && !isMaintenanceMode) {
      setPendingState(true);
      setShowConfirm(true);
    } else if (!newState && isMaintenanceMode) {
      setPendingState(false);
      setShowConfirm(true);
    }
  };

  const confirmMaintenanceChange = () => {
    if (pendingState !== null) {
      setIsMaintenanceMode(pendingState);
    }
    setShowConfirm(false);
    setPendingState(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10 mt-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-emerald-200/60 text-sm mt-2">
              {isProduction ? "Production Environment" : "Development Environment (localhost)"}
            </p>
          </div>
          <Button
            onClick={handleLogout}
            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Environment Notice for Localhost */}
        {!isProduction && (
          <Alert className="mb-6 bg-blue-950/50 border-blue-500/30 text-blue-200">
            <Info className="h-4 w-4" />
            <AlertDescription>
              💡 You're on localhost. Maintenance mode settings won't persist and won't affect the live site. Enable it in production (fahride.app) to impact users.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Maintenance Mode Card */}
          <Card className="shadow-2xl border border-emerald-500/30 bg-white/5 backdrop-blur-sm lg:col-span-2">
            <CardHeader className="border-b border-emerald-500/20">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="h-10 w-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Power className="h-5 w-5 text-emerald-400" />
                </div>
                Maintenance Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-sm text-emerald-100/80">
                  When enabled, all users on <span className="font-semibold text-emerald-300">fahride.app</span> will see a maintenance page instead of accessing the app. They will be shown a beautiful message that the site is under maintenance.
                </p>
              </div>

              {isMaintenanceMode && isProduction && (
                <Alert className="bg-yellow-950/50 border-yellow-500/30 text-yellow-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ⚠️ Maintenance mode is currently <strong>ACTIVE</strong>. Users on fahride.app cannot access the app.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between p-5 bg-white/5 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                <div>
                  <p className="font-semibold text-white">Status</p>
                  <p className="text-sm text-emerald-200/80 mt-1">
                    {isMaintenanceMode 
                      ? "🟢 Maintenance Mode ON" 
                      : "🔴 Maintenance Mode OFF"}
                  </p>
                </div>
                <Switch
                  checked={isMaintenanceMode}
                  onCheckedChange={handleMaintenanceToggle}
                  disabled={!isProduction}
                  className={!isProduction ? "opacity-50" : ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-500/20">
                <div className="bg-white/5 p-4 rounded-lg border border-emerald-500/10">
                  <p className="text-xs text-emerald-200/60 uppercase tracking-wider">Environment</p>
                  <p className="text-lg font-semibold text-white mt-2">
                    {isProduction ? "🌐 Production" : "💻 Local"}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-emerald-500/10">
                  <p className="text-xs text-emerald-200/60 uppercase tracking-wider">Status</p>
                  <p className="text-lg font-semibold text-white mt-2">
                    {isProduction ? "✅ Active" : "⏸️ Preview"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Section */}
          <Card className="shadow-2xl border border-blue-500/30 bg-white/5 backdrop-blur-sm lg:col-span-2">
            <CardHeader className="border-b border-blue-500/20">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                All Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {isLoadingUsers ? (
                <div className="text-center py-8">
                  <p className="text-emerald-200/60">Loading users...</p>
                </div>
              ) : usersError ? (
                <Alert className="bg-red-950/50 border-red-500/30 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{usersError}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="bg-blue-950/40 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-2xl font-bold text-blue-300">
                      {users.length}
                    </p>
                    <p className="text-sm text-blue-100/80 mt-1">
                      Total users registered
                    </p>
                  </div>

                  {users.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="bg-white/5 border border-emerald-500/20 rounded-lg p-4 hover:border-emerald-500/40 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="font-semibold text-white">{user.name}</p>
                              <div className="flex items-center gap-4 text-xs text-emerald-200/70 mt-2">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {user.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {user.phone}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap text-xs text-emerald-200/60">
                            <span className="bg-emerald-950/50 px-2 py-1 rounded border border-emerald-500/30">
                              {user.branch}
                            </span>
                            <span className="bg-blue-950/50 px-2 py-1 rounded border border-blue-500/30 flex items-center gap-1">
                              <Book className="w-3 h-3" />
                              {user.year}
                            </span>
                            <span className="text-emerald-200/50 ml-auto">
                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-emerald-200/60">No users found</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-emerald-200/50 text-xs">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p className="mt-2">FahRide Admin Control Panel</p>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-slate-900 border-emerald-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {pendingState ? "🚨 Enable Maintenance Mode?" : "✅ Disable Maintenance Mode?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-emerald-100/70">
              {pendingState
                ? "This will BLOCK all users from accessing fahride.app. They will only see the maintenance page. Are you absolutely sure?"
                : "This will ALLOW users to access fahride.app again. Are you sure?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMaintenanceChange}
              className={pendingState 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white"}
            >
              {pendingState ? "Yes, Enable Maintenance" : "Yes, Turn Off Maintenance"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
