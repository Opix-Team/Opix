const FooterSection = () => (
  <footer className="border-t border-border/40 py-12">
    <div className="container max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">O</span>
        </div>
        <span className="font-semibold text-lg">Opix</span>
      </div>
      <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Opix. Built for developers.</p>
    </div>
  </footer>
);

export default FooterSection;
