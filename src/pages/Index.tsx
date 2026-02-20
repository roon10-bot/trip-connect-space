import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TripPackages } from "@/components/TripPackages";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import InstagramFeed from "@/components/InstagramFeed";
import { useSEO } from "@/hooks/useSEO";

const Index = () => {
  useSEO({
    title: "Studentresor – Studentresa till Kroatien 2026",
    description: "Boka din studentresa till Kroatien. Segelveckan, Splitveckan och Studentveckan – sol, segling och oförglömliga upplevelser. Resegaranti ingår.",
    canonical: "https://www.studentresor.se/",
    ogImage: "https://www.studentresor.se/images/studentresor-og.jpg",
  });
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <TripPackages />
        <InstagramFeed />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
