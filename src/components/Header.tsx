import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Menu, X, LogOut, User as UserIcon, Shield, ChevronDown } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import studentresorLogo from "@/assets/studentresor-logo.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-elegant border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img 
              src={studentresorLogo} 
              alt="Studentresor" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Våra resor dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className={`flex items-center gap-1 font-medium transition-colors outline-none ${
                isScrolled ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"
              }`}>
                Våra resor
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="bg-background border border-border shadow-lg z-50"
                sideOffset={8}
                align="start"
              >
                <DropdownMenuItem asChild>
                  <Link to="/destinations?trip=segelveckan" className="cursor-pointer">
                    Segelveckan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/destinations?trip=studentveckan" className="cursor-pointer">
                    Studentveckan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/destinations?trip=splitveckan" className="cursor-pointer">
                    Splitveckan
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/om-oss"
              className={`font-medium transition-colors ${
                isScrolled ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"
              }`}
            >
              Om Oss
            </Link>
            <Link
              to="/kontakt"
              className={`font-medium transition-colors ${
                isScrolled ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"
              }`}
            >
              Kontakt
            </Link>
            <Link
              to="/faq"
              className={`font-medium transition-colors ${
                isScrolled ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"
              }`}
            >
              Frågor och Svar
            </Link>
            <Link
              to="/for-skolor"
              className={`font-medium transition-colors ${
                isScrolled ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"
              }`}
            >
              För skolor
            </Link>

            {user && (
              <Link
                to="/dashboard"
                className={`font-medium transition-colors ${
                  isScrolled ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"
                }`}
              >
                Mina bokningar
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className={`font-medium transition-colors flex items-center gap-1 ${
                  isScrolled ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <UserIcon className="w-4 h-4" />
                    Mitt konto
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logga ut
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className={isScrolled ? "" : "text-white hover:text-white/80 hover:bg-white/10"}>
                    Logga in
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="default" size="sm" className="bg-gradient-ocean hover:opacity-90">
                    Skapa konto
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t border-border"
          >
            <nav className="flex flex-col gap-4">
              {/* Våra resor section */}
              <div className="py-2">
                <p className="text-foreground font-medium mb-2">Våra resor</p>
                <div className="pl-4 flex flex-col gap-2">
                  <Link
                    to="/destinations?trip=segelveckan"
                    className="text-foreground/70 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Segelveckan
                  </Link>
                  <Link
                    to="/destinations?trip=studentveckan"
                    className="text-foreground/70 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Studentveckan
                  </Link>
                  <Link
                    to="/destinations?trip=splitveckan"
                    className="text-foreground/70 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Splitveckan
                  </Link>
                </div>
              </div>
              <Link
                to="/om-oss"
                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Om Oss
              </Link>
              <Link
                to="/kontakt"
                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Kontakt
              </Link>
              <Link
                to="/faq"
                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Frågor och Svar
              </Link>
              <Link
                to="/for-skolor"
                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                För skolor
              </Link>
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mina bokningar
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-foreground/80 hover:text-primary transition-colors font-medium py-2 flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <Button variant="outline" onClick={handleSignOut} className="w-full">
                    Logga ut
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Logga in
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-gradient-ocean">
                      Skapa konto
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};
