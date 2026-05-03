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
      .channel("invites-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "invites" }, () => load())
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
              <label className="block text-sm text-muted-foreground mb-1">Type</label>
              <input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border" placeholder="referral" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Source</label>
              <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border" placeholder="email, link, ..." />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Authorized App (optional)</label>
              <select value={form.authorization_id} onChange={e => setForm({ ...form, authorization_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <option value="">— None —</option>
                {auths.map(a => <option key={a.id} value={a.id}>{a.app_name}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Triggers a callback to the app's redirect_uri on lifecycle events.</p>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Expires At (optional)</label>
              <input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border" />
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
                <th className="text-left px-4 py-3 font-medium">App</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map(inv => {
                const app = auths.find(a => a.id === inv.authorization_id);
                return (
                  <tr key={inv.id} className="border-t border-border/40">
                    <td className="px-4 py-3 font-mono text-xs">
                      <button onClick={() => copy(inv.id)} className="inline-flex items-center gap-1.5 hover:text-primary">
                        {inv.id.slice(0, 8)}… <Copy className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="px-4 py-3">{inv.type}</td>
                    <td className={`px-4 py-3 font-medium ${statusColor(inv.status)}`}>{inv.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">{app?.app_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(inv.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {inv.status === "pending" && (
                          <>
                            <button onClick={() => redeem(inv)} title="Mark redeemed" className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => revoke(inv)} title="Revoke" className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => remove(inv.id)} title="Delete" className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Invites;
