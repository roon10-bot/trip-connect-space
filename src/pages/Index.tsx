import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { GoogleReviews } from "@/components/GoogleReviews";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <GoogleReviews />
      <Footer />
    </div>
  );
};

export default Index;
