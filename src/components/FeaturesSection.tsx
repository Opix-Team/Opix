import { Link2, Activity, Shield, Webhook, Timer, Database } from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "Smart Invites",
    description: "Create, track, and expire invites with full lifecycle management. Referral, signup, or custom types.",
  },
  {
    icon: Activity,
    title: "Realtime Events",
    description: "Every invite action streams live — created, opened, used, expired. Built on realtime subscriptions.",
  },
  {
    icon: Shield,
    title: "Row-Level Security",
    description: "Fine-grained access control baked in. Owners manage their invites, events are publicly readable.",
  },
  {
    icon: Webhook,
    title: "Integrations",
    description: "Connect external services with owned integrations and full audit logging for every API call.",
  },
  {
    icon: Timer,
    title: "Auto-Expiry",
    description: "Set TTLs on invites. Expired invites trigger events automatically — no cron jobs needed.",
  },
  {
    icon: Database,
    title: "Event Sourcing",
    description: "Every state change is captured as an immutable event. Full audit trail, zero data loss.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="relative py-32">
      <div className="container max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Everything you need for
            <span className="text-gradient-primary"> invite infrastructure</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
            Production-ready primitives so you can focus on your product, not plumbing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`animate-fade-up group relative p-6 rounded-xl surface-glass transition-all hover:border-primary/30`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 transition-colors group-hover:bg-primary/20">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
