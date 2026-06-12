import { useNavigate } from "react-router-dom";
import {
  User,
  LogOut,
  Bell,
  Moon,
  Volume2,
  ChevronRight,
  ChefHat,
  Clock,
  Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();

  // Placeholder user data - backend integration pending for detailed stats
  const user = {
    name: authUser?.username || "Staff Member",
    role: "Kitchen Operations",
    station: "Main Kitchen",
    ordersCompleted: "--",
    avgTime: "--:--",
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-6 pb-0">
        <button
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Orders
        </button>
      </header>

      <div className="relative z-10 flex-1 p-6 space-y-6">
        {/* Profile Card */}
        <div className="glass-card p-6 text-center space-y-4">
          <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <User className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
            <p className="text-muted-foreground">{user.role}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <ChefHat className="w-4 h-4" />
            <span>{user.station}</span>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Today's Performance
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/30 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-primary mb-1">
                <Flame className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {user.ordersCompleted}
              </p>
              <p className="text-xs text-muted-foreground">Orders Completed</p>
            </div>
            <div className="bg-background/30 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-accent mb-1">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {user.avgTime}
              </p>
              <p className="text-xs text-muted-foreground">Avg. Time</p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="glass-card divide-y divide-white/5">
          <div className="p-5">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">
              Settings
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Notifications</p>
                    <p className="text-sm text-muted-foreground">New order alerts</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Sound Effects</p>
                    <p className="text-sm text-muted-foreground">Completion sounds</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Always on</p>
                  </div>
                </div>
                <Switch defaultChecked disabled />
              </div>
            </div>
          </div>

        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-14 text-lg font-medium border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-2xl"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Profile;
