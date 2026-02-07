import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Destinations from "./pages/Destinations";
import Book from "./pages/Book";
import BookTrip from "./pages/BookTrip";
import Admin from "./pages/Admin";
import SearchTrips from "./pages/SearchTrips";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";
import Contact from "./pages/Contact";
import { ChatAssistant } from "./components/ChatAssistant";

const queryClient = new QueryClient();

// Toggle this to show/hide the Coming Soon page
const COMING_SOON_MODE = false;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {COMING_SOON_MODE ? (
          <Routes>
            <Route path="*" element={<ComingSoon />} />
          </Routes>
        ) : (
          <>
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ChatAssistant />
          </>
        )}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
