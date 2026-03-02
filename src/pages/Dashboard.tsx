import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Link2, Webhook, Activity, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ invites: 0, integrations: 0, events: 0 });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const [invitesRes, integrationsRes, eventsRes] = await Promise.all([
        supabase.from("invites").select("id", { count: "exact", head: true }),
        supabase.from("integrations").select("id", { count: "exact", head: true }),
        supabase.from("invite_events").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        invites: invitesRes.count ?? 0,
        integrations: integrationsRes.count ?? 0,
        events: eventsRes.count ?? 0,
      });
    };

    const fetchRecentEvents = async () => {
      const { data } = await supabase
        .from("invite_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentEvents(data ?? []);
    };

    fetchStats();
    fetchRecentEvents();

    // Realtime subscription for events
    const channel = supabase
      .channel("dashboard-events")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "invite_events" }, (payload) => {
        setRecentEvents((prev) => [payload.new, ...prev].slice(0, 5));
        setStats((prev) => ({ ...prev, events: prev.events + 1 }));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "invites" }, () => {
        setStats((prev) => ({ ...prev, invites: prev.invites + 1 }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const statCards = [
    { label: "Total Invites", value: stats.invites, icon: Link2, color: "text-primary" },
    { label: "Integrations", value: stats.integrations, icon: Webhook, color: "text-primary" },
    { label: "Events Logged", value: stats.events, icon: Activity, color: "text-primary" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your Opix workspace</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="surface-glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <div className="surface-glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Recent Events</h2>
        </div>
        {recentEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No events yet. Create an invite to get started.</p>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((event: any) => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div>
                    <span className="text-sm font-medium">{event.event_type}</span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {event.invite_id?.slice(0, 8)}...
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
