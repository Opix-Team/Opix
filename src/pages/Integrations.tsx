import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Integration = Tables<"integrations">;

const Integrations = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", type: "webhook" });

  const fetchIntegrations = async () => {
    const { data } = await supabase
      .from("integrations")
      .select("*")
      .order("created_at", { ascending: false });
    setIntegrations(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const createIntegration = async () => {
    if (!user) return;
    const { error } = await supabase.from("integrations").insert({
      name: form.name,
      type: form.type,
      owner: user.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Integration created!");
      setShowCreate(false);
      setForm({ name: "", type: "webhook" });
      fetchIntegrations();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("integrations").update({ is_active: !current }).eq("id", id);
    if (error) toast.error(error.message);
    else fetchIntegrations();
  };

  const deleteIntegration = async (id: string) => {
    const { error } = await supabase.from("integrations").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Integration deleted");
      fetchIntegrations();
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-1">Connect external services</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all hover:glow-primary-sm"
        >
          <Plus className="w-4 h-4" />
          New Integration
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="surface-glass rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h2 className="text-lg font-semibold">New Integration</h2>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="My Webhook"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="webhook">Webhook</option>
                <option value="api">API</option>
                <option value="slack">Slack</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted/50 transition-colors">
                Cancel
              </button>
              <button onClick={createIntegration} disabled={!form.name} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:glow-primary-sm transition-all disabled:opacity-50">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : integrations.length === 0 ? (
        <div className="text-center py-16 surface-glass rounded-xl">
          <p className="text-muted-foreground">No integrations yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((int) => (
            <div key={int.id} className="surface-glass rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{int.name}</h3>
                  <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium mt-1 inline-block">
                    {int.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(int.id, int.is_active)}
                    className={`p-1.5 rounded-md transition-colors ${int.is_active ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted/50"}`}
                    title={int.is_active ? "Deactivate" : "Activate"}
                  >
                    {int.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteIntegration(int.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{int.is_active ? "Active" : "Inactive"}</span>
                <span>•</span>
                <span>{new Date(int.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Integrations;
