import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Power, PowerOff, ExternalLink, Copy, ShieldCheck, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Authorization {
  id: string;
  app_name: string;
  app_url: string | null;
  app_icon: string | null;
  description: string | null;
  client_id: string;
  redirect_uri: string | null;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

const presetApps = [
  {
    name: "Google Classroom",
    url: "https://google-classroom-mod.lovable.app",
    icon: "📚",
    description: "Authorize Google Classroom to access Opix invites and events",
    scopes: ["read", "invites", "events"],
  },
];

const Authorizations = () => {
  const { user } = useAuth();
  const [auths, setAuths] = useState<Authorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    app_name: "",
    app_url: "",
    description: "",
    redirect_uri: "",
    scopes: ["read"] as string[],
  });
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchAuths = async () => {
    const { data } = await supabase
      .from("authorizations")
      .select("*")
      .order("created_at", { ascending: false });
    setAuths((data as Authorization[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAuths();
  }, []);

  const createAuth = async (preset?: typeof presetApps[0]) => {
    if (!user) return;
    const appName = preset ? preset.name : form.app_name;
    const appUrl = preset ? preset.url : form.app_url;
    const appDesc = preset ? preset.description : form.description;
    if (!appName) {
      toast.error("App name is required");
      return;
    }

    const { data, error } = await supabase.from("authorizations").insert({
      user_id: user.id,
      app_name: appName,
      app_url: appUrl || null,
      app_icon: preset?.icon || null,
      description: appDesc || null,
      redirect_uri: form.redirect_uri || (preset?.url ? preset.url + "/callback" : null),
      scopes: preset?.scopes || form.scopes,
    }).select().single();

    if (error) {
      toast.error(error.message);
    } else {
      setCreatedClientId((data as Authorization).client_id);
      toast.success("App authorized!");
      setShowCreate(false);
      setForm({ app_name: "", app_url: "", description: "", redirect_uri: "", scopes: ["read"] });
      fetchAuths();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("authorizations").update({ is_active: !current }).eq("id", id);
    if (error) toast.error(error.message);
    else fetchAuths();
  };

  const deleteAuth = async (id: string) => {
    const { error } = await supabase.from("authorizations").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Authorization revoked");
      fetchAuths();
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const availableScopes = ["read", "write", "invites", "integrations", "events"];

  const toggleScope = (scope: string) => {
    setForm(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope]
    }));
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Authorizations</h1>
          <p className="text-muted-foreground mt-1">Authorize external apps to access Opix</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreatedClientId(null); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all hover:glow-primary-sm"
        >
          <Plus className="w-4 h-4" />
          Authorize App
        </button>
      </div>

      {/* Client ID Banner */}
      {createdClientId && (
        <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">App Authorized — Client ID</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono bg-muted/50 px-3 py-2 rounded-lg break-all">
              {createdClientId}
            </code>
            <button onClick={() => copyText(createdClientId)} className="p-2 rounded-lg hover:bg-muted/50 text-foreground transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Use this Client ID in the external app's Opix configuration.</p>
        </div>
      )}

      {/* Quick Authorize Presets */}
      {!showCreate && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Quick Authorize</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {presetApps.map((app) => (
              <button
                key={app.name}
                onClick={() => createAuth(app)}
                className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
              >
                <span className="text-2xl">{app.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{app.name}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{app.description}</p>
                </div>
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="surface-glass rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h2 className="text-lg font-semibold">Authorize App</h2>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">App Name</label>
              <input
                type="text"
                value={form.app_name}
                onChange={(e) => setForm({ ...form, app_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="My App"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">App URL</label>
              <input
                type="url"
                value={form.app_url}
                onChange={(e) => setForm({ ...form, app_url: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="https://myapp.com"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="What will this app do with Opix?"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Redirect URI</label>
              <input
                type="url"
                value={form.redirect_uri}
                onChange={(e) => setForm({ ...form, redirect_uri: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="https://myapp.com/callback"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Scopes</label>
              <div className="flex flex-wrap gap-2">
                {availableScopes.map(scope => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => toggleScope(scope)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      form.scopes.includes(scope)
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted/50 transition-colors">
                Cancel
              </button>
              <button onClick={() => createAuth()} disabled={!form.app_name} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:glow-primary-sm transition-all disabled:opacity-50">
                Authorize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authorized Apps List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : auths.length === 0 ? (
        <div className="text-center py-16 surface-glass rounded-xl">
          <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No authorized apps yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {auths.map((auth) => (
            <div key={auth.id} className="surface-glass rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {auth.app_icon ? (
                    <span className="text-2xl">{auth.app_icon}</span>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{auth.app_name}</h3>
                    {auth.app_url && (
                      <a href={auth.app_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                        {auth.app_url} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(auth.id, auth.is_active)}
                    className={`p-1.5 rounded-md transition-colors ${auth.is_active ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted/50"}`}
                    title={auth.is_active ? "Deactivate" : "Activate"}
                  >
                    {auth.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteAuth(auth.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {auth.description && (
                <p className="text-xs text-muted-foreground mt-2">{auth.description}</p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <code className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                  {auth.client_id.slice(0, 12)}...
                </code>
                <button onClick={() => copyText(auth.client_id)} className="text-muted-foreground hover:text-foreground">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className={auth.is_active ? "text-primary" : "text-destructive"}>
                  {auth.is_active ? "Active" : "Inactive"}
                </span>
                <span>•</span>
                <span>{new Date(auth.created_at).toLocaleDateString()}</span>
              </div>
              {auth.scopes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {auth.scopes.map(scope => (
                    <span key={scope} className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                      {scope}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Authorizations;
