import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Activity } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type IntegrationLog = Tables<"integration_logs">;

const eventColors: Record<string, string> = {
  created: "bg-primary",
  used: "bg-primary",
  expired: "bg-destructive",
  updated: "bg-muted-foreground",
};

const Events = () => {
  const [events, setEvents] = useState<IntegrationLog[]>([]);
  const [integrationIds, setIntegrationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's integrations
      const { data: integrations } = await supabase
        .from("integrations")
        .select("id")
        .eq("owner", user.id);

      const ids = (integrations ?? []).map((i) => i.id);
      setIntegrationIds(ids);

      if (ids.length === 0) {
        setEvents([]);
        setLoading(false);
      } else {
        const { data } = await supabase
          .from("integration_logs")
          .select("*")
          .in("integration_id", ids)
          .order("created_at", { ascending: false })
          .limit(50);
        setEvents(data ?? []);
        setLoading(false);
      }

      channel = supabase
        .channel(`user:${user.id}:events`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "integration_logs" },
          (payload) => {
            const row = payload.new as IntegrationLog;
            if (ids.includes(row.integration_id)) {
              setEvents((prev) => [row, ...prev].slice(0, 50));
            }
          },
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Event Stream</h1>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-primary font-medium">LIVE</span>
        </div>
        <p className="text-muted-foreground mt-1">Realtime feed of tracked events</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 surface-glass rounded-xl">
          <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {integrationIds.length === 0
              ? "No integrations yet. Track an event from the Connect guide to get started."
              : "No events yet. They'll appear here in realtime."}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {events.map((event, i) => (
            <div
              key={event.id}
              className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/20 transition-colors animate-fade-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="mt-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${eventColors[event.event_type] || eventColors.updated}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{event.event_type}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {event.integration_id.slice(0, 8)}…
                  </span>
                  {event.status_code != null && (
                    <span className="text-xs text-muted-foreground">{event.status_code}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(event.created_at).toLocaleString()}
                </p>
                {event.payload && Object.keys(event.payload as object).length > 0 && (
                  <pre className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded-md p-2 overflow-x-auto font-mono">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Events;
