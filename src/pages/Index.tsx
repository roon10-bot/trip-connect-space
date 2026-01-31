import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TripPackages } from "@/components/TripPackages";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <TripPackages />
      <Footer />
    </div>
  );
};

export default Index;
