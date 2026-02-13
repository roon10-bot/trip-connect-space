import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TripPackages } from "@/components/TripPackages";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <TripPackages />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;
