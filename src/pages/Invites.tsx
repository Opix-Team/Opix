import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Copy, Mail, Check, X } from "lucide-react";
import { toast } from "sonner";
import { sendOpixCallback } from "@/lib/opix-callbacks";

interface Invite {
  id: string;
  type: string;
  status: string;
  source: string | null;
  authorization_id: string | null;
  metadata: any;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
}

interface AuthorizationOpt {
  id: string;
  app_name: string;
  client_id: string;
  redirect_uri: string | null;
  is_active: boolean;
}

const Invites = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [auths, setAuths] = useState<AuthorizationOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    type: "referral",
    source: "",
    authorization_id: "",
    expires_at: "",
  });

  const load = async () => {
    const [{ data: inv }, { data: a }] = await Promise.all([
      supabase.from("invites").select("*").order("created_at", { ascending: false }),
      supabase.from("authorizations").select("id, app_name, client_id, redirect_uri, is_active"),
    ]);
    setInvites((inv as Invite[]) ?? []);
    setAuths((a as AuthorizationOpt[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`user:${user?.id ?? "anon"}:invites`)
      .on("postgres_changes", { event: "*", schema: "public", table: "invites", filter: `created_by=eq.${user?.id ?? ""}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fireCallback = async (auth_id: string | null, event: string, data: unknown) => {
    if (!auth_id) return;
    const a = auths.find(x => x.id === auth_id);
    if (!a) return;
    await sendOpixCallback(
      { ...a, app_name: a.app_name, client_id: a.client_id, redirect_uri: a.redirect_uri, is_active: a.is_active } as any,
      event,
      data,
    );
  };

  const create = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("invites").insert({
      created_by: user.id,
      type: form.type,
      source: form.source || null,
      authorization_id: form.authorization_id || null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    }).select().single();
    if (error) return toast.error(error.message);
    toast.success("Invite created");
    setShowCreate(false);
    setForm({ type: "referral", source: "", authorization_id: "", expires_at: "" });
    fireCallback(data.authorization_id, "invite.created", data);
  };

  const redeem = async (inv: Invite) => {
    const { data, error } = await supabase.from("invites").update({
      status: "used",
      used_at: new Date().toISOString(),
    }).eq("id", inv.id).select().single();
    if (error) return toast.error(error.message);
    toast.success("Invite redeemed");
    fireCallback(inv.authorization_id, "invite.redeemed", data);
  };

  const revoke = async (inv: Invite) => {
    const { data, error } = await supabase.from("invites").update({
      status: "revoked",
    }).eq("id", inv.id).select().single();
    if (error) return toast.error(error.message);
    toast.success("Invite revoked");
    fireCallback(inv.authorization_id, "invite.revoked", data);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("invites").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Invite deleted");
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const statusColor = (s: string) =>
    s === "used" ? "text-primary" :
    s === "revoked" ? "text-destructive" :
    s === "expired" ? "text-muted-foreground" : "text-foreground";

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Invites</h1>
          <p className="text-muted-foreground mt-1">Issue, track, and revoke invites — with callbacks to your authorized apps</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all hover:glow-primary-sm"
        >
          <Plus className="w-4 h-4" />
          New Invite
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="surface-glass rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h2 className="text-lg font-semibold">New Invite</h2>
            <div>
              {/* Fixed: Attached label via htmlFor linking input ID */}
              <label htmlFor="invite-type" className="block text-sm text-muted-foreground mb-1">Type</label>
              <input 
                id="invite-type" // Fixed: Applied matching id selector
                value={form.type} 
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border" 
                placeholder="referral" 
              />
            </div>
            <div>
              {/* Fixed: Attached label via htmlFor linking input ID */}
              <label htmlFor="invite-source" className="block text-sm text-muted-foreground mb-1">Source</label>
              <input 
                id="invite-source" // Fixed: Applied matching id selector
                value={form.source} 
                onChange={e => setForm({ ...form, source: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border" 
                placeholder="email, link, ..." 
              />
            </div>
            <div>
              {/* Fixed: Attached label via htmlFor linking select ID */}
              <label htmlFor="invite-auth-app" className="block text-sm text-muted-foreground mb-1">Authorized App (optional)</label>
              <select 
                id="invite-auth-app" // Fixed: Applied matching id selector
                value={form.authorization_id} 
                onChange={e => setForm({ ...form, authorization_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border"
              >
                <option value="">— None —</option>
                {auths.map(a => <option key={a.id} value={a.id}>{a.app_name}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Triggers a callback to the app's redirect_uri on lifecycle events.</p>
            </div>
            <div>
              {/* Fixed: Attached label via htmlFor linking input ID */}
              <label htmlFor="invite-expiry" className="block text-sm text-muted-foreground mb-1">Expires At (optional)</label>
              <input 
                id="invite-expiry" // Fixed: Applied matching id selector
                type="datetime-local" 
                value={form.expires_at} 
                onChange={e => setForm({ ...form, expires_at: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border" 
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted/50">
                Cancel
              </button>
              <button onClick={create} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:glow-primary-sm">
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
      ) : invites.length === 0 ? (
        <div className="text-center py-16 surface-glass rounded-xl">
          <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No invites yet.</p>
        </div>
      ) : (
        <div className="surface-glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-card/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {invites.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs max-w-[120px] truncate">
                    {inv.id}
                  </td>
                  <td className="px-4 py-3 font-medium">{inv.type}</td>
                  <td className={`px-4 py-3 font-medium ${statusColor(inv.status)}`}>
                    {inv.status}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.source || "—"}</td>
            <thead className="bg-card/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {invites.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs max-w-[120px] truncate">
                    {inv.id}
                  </td>
                  <td className="px-4 py-3 font-medium">{inv.type}</td>
                  <td className={`px-4 py-3 font-medium ${statusColor(inv.status)}`}>
                    {inv.status}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.source || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Fixed: Added aria-label to copy icon-button */}
                      <button
                        onClick={() => copy(inv.id)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={`Copy invite ID ${inv.id} to clipboard`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      
                      {inv.status === "pending" && (
                        <>
                          {/* Fixed: Added aria-label to redeem icon-button */}
                          <button
                            onClick={() => redeem(inv)}
                            className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            aria-label={`Mark invite ${inv.id} as redeemed`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Fixed: Added aria-label to revoke icon-button */}
                          <button
                            onClick={() => revoke(inv)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            aria-label={`Revoke pending invite ${inv.id}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {/* Fixed: Added aria-label to delete icon-button */}
                      <button
                        onClick={() => remove(inv.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Permanently delete invite records for ${inv.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Invites;
