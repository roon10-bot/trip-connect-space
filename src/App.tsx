import { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

// Lazy-load all routes except Index for faster initial load
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Destinations = lazy(() => import("./pages/Destinations"));
const Book = lazy(() => import("./pages/Book"));
const BookTrip = lazy(() => import("./pages/BookTrip"));
const Admin = lazy(() => import("./pages/Admin"));
const SearchTrips = lazy(() => import("./pages/SearchTrips"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const ForElevkarer = lazy(() => import("./pages/ForElevkarer"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const AccountTerms = lazy(() => import("./pages/AccountTerms"));
const Splitveckan = lazy(() => import("./pages/Splitveckan"));
const Segelveckan = lazy(() => import("./pages/Segelveckan"));
const Studentveckan = lazy(() => import("./pages/Studentveckan"));
const Settings = lazy(() => import("./pages/Settings"));
const AltapayCallback = lazy(() => import("./pages/AltapayCallback"));
const Partner = lazy(() => import("./pages/Partner"));
const ChatAssistant = lazy(() => import("./components/ChatAssistant").then(m => ({ default: m.ChatAssistant })));

const queryClient = new QueryClient();

/** Defers rendering children until the browser is idle (or after 3s timeout) */
const IdleLoad = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(() => setReady(true), { timeout: 3000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => setReady(true), 2000);
      return () => clearTimeout(id);
    }
  }, []);
  if (!ready) return null;
  return <>{children}</>;
};

// Toggle this to show/hide the Coming Soon page
const COMING_SOON_MODE = false;

const PageFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {COMING_SOON_MODE ? (
          <Routes>
            <Route path="*" element={<Suspense fallback={<PageFallback />}><ComingSoon /></Suspense>} />
          </Routes>
        ) : (
          <>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/destinations" element={<Destinations />} />
                <Route path="/book/:id" element={<Book />} />
                <Route path="/book/trip/:id" element={<BookTrip />} />
                <Route path="/search" element={<SearchTrips />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/kontakt" element={<Contact />} />
                <Route path="/om-oss" element={<AboutUs />} />
                <Route path="/for-skolor" element={<ForElevkarer />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/resevillkor" element={<Terms />} />
                <Route path="/kontovillkor" element={<AccountTerms />} />
                <Route path="/splitveckan" element={<Splitveckan />} />
                <Route path="/segelveckan" element={<Segelveckan />} />
                <Route path="/studentveckan" element={<Studentveckan />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/partner" element={<Partner />} />
                <Route path="/altapay/ok" element={<AltapayCallback />} />
                <Route path="/altapay/fail" element={<AltapayCallback />} />
                <Route path="/altapay/redirect" element={<AltapayCallback />} />
                <Route path="/altapay/:status" element={<AltapayCallback />} />
                <Route path="/payment/return" element={<AltapayCallback />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Suspense fallback={null}>
              <IdleLoad><ChatAssistant /></IdleLoad>
            </Suspense>
          </>
        )}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
