const steps = [
  { num: "01", title: "Create Invite", desc: "API call creates an invite with type, source, and TTL." },
  { num: "02", title: "Trigger Fires", desc: "Database trigger logs a 'created' event automatically." },
  { num: "03", title: "Realtime Stream", desc: "Event publishes to all subscribed clients instantly." },
  { num: "04", title: "Lifecycle Managed", desc: "Status changes (used, expired) trigger new events." },
];

const ArchitectureSection = () => {
  return (
    <section className="relative py-32">
      <div className="absolute inset-0 bg-gradient-radial opacity-50" />
      <div className="relative container max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            How it <span className="text-gradient-primary">works</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
            Event-driven by design. Every invite action is tracked end-to-end.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className="animate-fade-up relative" style={{ animationDelay: `${i * 100}ms` }}>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-primary/40 to-transparent z-0" />
              )}
              <div className="relative p-6 rounded-xl border border-border/40 bg-card/40">
                <span className="text-3xl font-black text-primary/20 font-mono">{step.num}</span>
                <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
