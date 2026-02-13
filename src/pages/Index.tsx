import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TripPackages } from "@/components/TripPackages";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import InstagramFeed from "@/components/InstagramFeed";
import { useSEO } from "@/hooks/useSEO";

const Index = () => {
  useSEO({
    title: "Studentresor – Studentresor till Kroatien | Segelveckan, Splitveckan & Studentveckan",
    description: "Boka din studentresa till Kroatien med Studentresor. Segelveckan, Splitveckan och Studentveckan – sol, segling och oförglömliga upplevelser för studenter. Resegaranti hos Kammarkollegiet.",
    canonical: "https://www.studentresor.se/",
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
