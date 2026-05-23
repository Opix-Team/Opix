import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ArchitectureSection from "@/components/ArchitectureSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Opix — Realtime Invite Infrastructure API"
        description="Opix provides production-ready invite flows, realtime event tracking, and integration management through a single, elegant API."
      />
      <Navbar />
      <HeroSection />
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="how-it-works">
        <ArchitectureSection />
      </div>
      <FooterSection />
    </div>
  );
};

export default Index;
