import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Copy, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Invite = Tables<"invites">;

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
  used: <CheckCircle2 className="w-3.5 h-3.5 text-primary" />,
  expired: <XCircle className="w-3.5 h-3.5 text-destructive" />,
};

const Invites = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newInvite, setNewInvite] = useState({ type: "referral", source: "dashboard", expiresInHours: 24 });

  const fetchInvites = async () => {
    const { data } = await supabase
      .from("invites")
      .select("*")
      .order("created_at", { ascending: false });
    setInvites(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvites();

    const channel = supabase
      .channel("invites-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "invites" }, () => {
        fetchInvites();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const createInvite = async () => {
    if (!user) return;
    const expiresAt = new Date(Date.now() + newInvite.expiresInHours * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("invites").insert({
      type: newInvite.type,
      source: newInvite.source,
      created_by: user.id,
      expires_at: expiresAt,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Invite created!");
      setShowCreate(false);
    }
  };

  const deleteInvite = async (id: string) => {
    const { error } = await supabase.from("invites").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Invite deleted");
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Invite ID copied!");
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Invites</h1>
          <p className="text-muted-foreground mt-1">Manage your invite links</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all hover:glow-primary-sm"
        >
          <Plus className="w-4 h-4" />
          New Invite
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="surface-glass rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h2 className="text-lg font-semibold">Create Invite</h2>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Type</label>
              <select
                value={newInvite.type}
                onChange={(e) => setNewInvite({ ...newInvite, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="referral">Referral</option>
                <option value="signup">Signup</option>
                <option value="team">Team</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Source</label>
              <input
                type="text"
                value={newInvite.source}
                onChange={(e) => setNewInvite({ ...newInvite, source: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Expires in (hours)</label>
              <input
                type="number"
                value={newInvite.expiresInHours}
                onChange={(e) => setNewInvite({ ...newInvite, expiresInHours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createInvite}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:glow-primary-sm transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : invites.length === 0 ? (
        <div className="text-center py-16 surface-glass rounded-xl">
          <p className="text-muted-foreground">No invites yet. Create your first one!</p>
        </div>
      ) : (
        <div className="surface-glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Source</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Expires</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Created</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <button onClick={() => copyId(inv.id)} className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground">
                      {inv.id.slice(0, 8)}…
                      <Copy className="w-3 h-3" />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">{inv.type}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      {statusIcon[inv.status] || statusIcon.pending}
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{inv.source || "—"}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => deleteInvite(inv.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
