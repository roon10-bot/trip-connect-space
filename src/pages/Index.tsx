import { lazy, Suspense } from "react";
import { Hero } from "@/components/Hero";
import { useSEO } from "@/hooks/useSEO";

// Lazy-load everything below the fold + Header (skeleton covers first paint)
const Header = lazy(() => import("@/components/Header").then(m => ({ default: m.Header })));
const TripPackages = lazy(() => import("@/components/TripPackages").then(m => ({ default: m.TripPackages })));
const Testimonials = lazy(() => import("@/components/Testimonials").then(m => ({ default: m.Testimonials })));
const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));
const InstagramFeed = lazy(() => import("@/components/InstagramFeed"));
const YouTubeEmbed = lazy(() => import("@/components/YouTubeEmbed"));

const Index = () => {
  useSEO({
    title: "Studentresor – Studentresa till Kroatien 2026",
    description: "Boka din studentresa till Kroatien. Segelveckan, Splitveckan och Studentveckan – sol, segling och oförglömliga upplevelser. Resegaranti ingår.",
    canonical: "https://www.studentresor.com/",
    ogImage: "https://www.studentresor.com/images/studentresor-og.jpg",
    breadcrumbs: [
      { name: "Hem", url: "https://www.studentresor.com/" },
    ],
  });
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main>
        <Hero />
        <Suspense fallback={null}>
          <TripPackages />
          <YouTubeEmbed videoId="aF9AVtqcMc0" title="Studentresor – Studentresa till Kroatien" />
          <InstagramFeed />
          <Testimonials />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
