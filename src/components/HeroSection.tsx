import { ArrowRight, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative z-10 container max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-medium text-primary">Realtime Invite Infrastructure</span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-100 text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08]">
          Invite systems that
          <br />
          <span className="text-gradient-primary">just work.</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-up delay-200 mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Opix gives you production-ready invite flows, integration management, 
          and realtime event tracking — all through a single, elegant API.
        </p>

        {/* CTA */}
        <div className="animate-fade-up delay-300 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-base transition-all glow-primary-sm hover:glow-primary">
            Get Started
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg border border-border text-foreground font-medium text-base transition-colors hover:bg-secondary">
            View Docs
          </button>
        </div>

        {/* Code preview */}
        <div className="animate-fade-up delay-500 mt-16 max-w-2xl mx-auto">
          <div className="surface-glass rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
              <div className="w-3 h-3 rounded-full bg-primary/40" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">invite.create.ts</span>
            </div>
            <pre className="p-5 text-left text-sm font-mono leading-relaxed overflow-x-auto">
              <code>
                <span className="text-muted-foreground">{"// Create an invite with realtime tracking"}</span>{"\n"}
                <span className="text-primary">const</span>{" invite = "}<span className="text-primary">await</span>{" opix.invites."}<span className="text-cyan-300">create</span>{"({"}{"\n"}
                {"  type: "}<span className="text-green-400">{'"referral"'}</span>{","}{"\n"}
                {"  source: "}<span className="text-green-400">{'"dashboard"'}</span>{","}{"\n"}
                {"  expires_in: "}<span className="text-orange-300">{"86400"}</span>{"\n"}
                {"});"}{"\n\n"}
                <span className="text-muted-foreground">{"// Events stream in realtime ⚡"}</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
