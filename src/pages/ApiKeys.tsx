import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Copy, Key, Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const ApiKeys = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState({ name: "", scopes: ["read"] });
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const fetchKeys = async () => {
    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });
    setKeys((data as ApiKey[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const createKey = async () => {
    if (!user || !newKey.name) return;

    // Generate a key client-side, store only hash + prefix
    const rawKey = "opx_" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, "0")).join("");
    const prefix = rawKey.slice(0, 12) + "...";

    // Simple hash for demo (in production, use server-side hashing)
    const encoder = new TextEncoder();
    const data = encoder.encode(rawKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const keyHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0")).join("");

    const { error } = await supabase.from("api_keys").insert({
      user_id: user.id,
      name: newKey.name,
      key_prefix: prefix,
      key_hash: keyHash,
      scopes: newKey.scopes,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setGeneratedKey(rawKey);
      toast.success("API key created! Copy it now — it won't be shown again.");
      fetchKeys();
    }
  };

  const deleteKey = async (id: string) => {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("API key revoked");
      fetchKeys();
    }
  };

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const availableScopes = ["read", "write", "invites", "integrations", "events"];

  const toggleScope = (scope: string) => {
    setNewKey(prev => ({
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
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">Manage keys for programmatic access to Opix</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setGeneratedKey(null); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all hover:glow-primary-sm"
        >
          <Plus className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {/* Generated Key Banner */}
      {generatedKey && (
        <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">New API Key — copy it now!</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono bg-muted/50 px-3 py-2 rounded-lg break-all">
              {generatedKey}
            </code>
            <button
              onClick={() => copyKey(generatedKey)}
              className="p-2 rounded-lg hover:bg-muted/50 text-foreground transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">This key won't be shown again. Store it securely.</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && !generatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="surface-glass rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h2 className="text-lg font-semibold">Create API Key</h2>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Name</label>
              <input
                type="text"
                value={newKey.name}
                onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. Google Classroom Integration"
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
                      newKey.scopes.includes(scope)
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
              <button onClick={createKey} disabled={!newKey.name} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:glow-primary-sm transition-all disabled:opacity-50">
                Generate Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-16 surface-glass rounded-xl">
          <Key className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No API keys yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div key={key.id} className="surface-glass rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{key.name}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      key.is_active
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {key.is_active ? "Active" : "Revoked"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <code className="text-xs font-mono text-muted-foreground">{key.key_prefix}</code>
                    <button onClick={() => copyKey(key.key_prefix)} className="text-muted-foreground hover:text-foreground">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => deleteKey(key.id)}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                {key.last_used_at && (
                  <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                )}
              </div>
              {key.scopes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {key.scopes.map(scope => (
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

export default ApiKeys;
