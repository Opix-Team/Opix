import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Copy, FileCode, Key, Plug, Send, Terminal } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const BASE_URL = "https://coatunyealgfrmpszpsu.supabase.co/functions/v1";

const CodeBlock = ({ code, lang = "bash" }: { code: string; lang?: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative group rounded-lg border border-border/60 bg-[hsl(var(--surface-elevated))] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-card/50">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{lang}</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-foreground/90 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const StepCard = ({
  number,
  icon: Icon,
  title,
  children,
}: {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="relative pl-16">
    <div className="absolute left-0 top-0 flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/30">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div className="absolute left-6 top-12 bottom-[-2rem] w-px bg-gradient-to-b from-primary/30 to-transparent last:hidden" />
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs font-mono text-primary">STEP {String(number).padStart(2, "0")}</span>
    </div>
    <h2 className="text-2xl font-semibold mb-3">{title}</h2>
    <div className="space-y-4 text-muted-foreground leading-relaxed">{children}</div>
  </div>
);

const Connect = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-gradient-radial">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/50 backdrop-blur-xl mb-6">
            <Plug className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono text-muted-foreground">INTEGRATION GUIDE</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight">
            Connect <span className="text-gradient-primary">Opix</span> in 5 steps
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From zero to your first event in under 5 minutes. No SDK install required —
            just plain HTTP calls to a stable, versioned API.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="container max-w-3xl mx-auto px-6 space-y-16">
          <StepCard number={1} icon={Key} title="Create an API key">
            <p>
              Sign in to your dashboard and head to <strong className="text-foreground">API Keys</strong>.
              Click <em>Create Key</em>, give it a name, and pick the scopes your integration needs:
            </p>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {["read", "write", "events", "integrations"].map((s) => (
                <li key={s} className="flex items-center gap-2 px-3 py-2 rounded-md bg-card/40 border border-border/40">
                  <code className="text-primary font-mono text-xs">{s}</code>
                </li>
              ))}
            </ul>
            <p className="text-sm">
              You'll see the key <strong className="text-foreground">once</strong>. It starts with{" "}
              <code className="text-primary font-mono">opx_</code>. Copy it somewhere safe.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to={user ? "/dashboard/api-keys" : "/auth"}>
                {user ? "Go to API Keys" : "Sign in to get started"}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </StepCard>

          <StepCard number={2} icon={Terminal} title="Validate the key">
            <p>Make sure your key works by calling the validation endpoint:</p>
            <CodeBlock
              code={`curl -X POST ${BASE_URL}/api-keys-validate \\
  -H "Authorization: Bearer opx_your_key_here"`}
            />
            <p className="text-sm">
              A successful response looks like <code className="text-primary font-mono">{`{ "data": { "valid": true, ... } }`}</code>.
              All Opix endpoints share this <code className="text-foreground font-mono">{`{ data }`}</code> /{" "}
              <code className="text-foreground font-mono">{`{ error }`}</code> envelope.
            </p>
          </StepCard>

          <StepCard number={3} icon={Plug} title="Register your app">
            <p>
              Create an authorization to represent the application that will be sending events.
              The response includes a top-level <code className="text-primary font-mono">data.id</code> —
              that's the <strong className="text-foreground">authorization id</strong>. Copy it and pass it as{" "}
              <code className="text-foreground font-mono">authorization_id</code> in step 4.
            </p>
            <p className="text-sm">
              Heads up: do <strong className="text-foreground">not</strong> use{" "}
              <code className="font-mono">client_id</code> or <code className="font-mono">user_id</code> from the
              response — those are different fields. You want <code className="text-primary font-mono">data.id</code>.
            </p>
            <CodeBlock
              code={`curl -X POST ${BASE_URL}/authorizations-create \\
  -H "Authorization: Bearer opx_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "app_name": "My App",
    "app_url": "https://myapp.com",
    "redirect_uri": "https://myapp.com/callback",
    "scopes": ["read", "write"]
  }'`}
            />
          </StepCard>

          <StepCard number={4} icon={Send} title="Track your first event">
            <p>You're live. Send an event from your backend whenever something interesting happens:</p>
            <CodeBlock
              code={`curl -X POST ${BASE_URL}/events-track \\
  -H "Authorization: Bearer opx_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "authorization_id": "<data.id from step 3>",
    "event_type": "user.signed_in",
    "payload": { "user_id": "u_123" },
    "status_code": 200
  }'`}
            />
            <CodeBlock
              lang="typescript"
              code={`// Or from Node / TypeScript
await fetch("${BASE_URL}/events-track", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.OPIX_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    authorization_id: "<data.id from step 3>",
    event_type: "user.signed_in",
    payload: { user_id: "u_123" },
  }),
});`}
            />
            <p className="text-sm">
              Head to the <Link to="/dashboard/events" className="text-primary hover:underline">Events</Link>{" "}
              page in your dashboard to watch them stream in.
            </p>
          </StepCard>
        </div>
      </section>

      {/* Reference */}
      <section className="py-16 border-t border-border/40">
        <div className="container max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-2">Endpoint reference</h2>
          <p className="text-muted-foreground mb-8">
            Base URL: <code className="text-primary font-mono text-sm">{BASE_URL}</code>
          </p>
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-card/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Method</th>
                  <th className="text-left px-4 py-3 font-medium">Path</th>
                  <th className="text-left px-4 py-3 font-medium">Scope</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {[
                  ["POST", "/api-keys-validate", "—"],
                  ["GET", "/authorizations-list", "integrations"],
                  ["POST", "/authorizations-create", "integrations"],
                  ["POST", "/authorizations-revoke", "integrations"],
                  ["GET", "/events-list", "events"],
                  ["POST", "/events-track", "events"],
                ].map(([m, p, s]) => (
                  <tr key={p} className="border-t border-border/40">
                    <td className="px-4 py-3 text-primary">{m}</td>
                    <td className="px-4 py-3 text-foreground">{p}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default Connect;
