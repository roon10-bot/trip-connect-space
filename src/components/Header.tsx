import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Menu, X, LogOut, User as UserIcon, Shield, Home, ChevronDown } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { usePartner } from "@/hooks/usePartner";
import { useTranslation } from "react-i18next";
import studentresorLogo from "@/assets/studentresor-logo.svg";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAdmin } = useAdmin();
  const { partnerProfile } = usePartner();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === "/" || location.pathname === "/splitveckan" || location.pathname === "/segelveckan" || location.pathname === "/studentveckan";

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

  const useDarkText = !isHomePage || isScrolled;

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 w-full transition-all duration-300 ${isMenuOpen ? "z-[110]" : "z-50"} ${
          useDarkText
            ? "bg-background/95 backdrop-blur-md shadow-elegant border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="w-full px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 gap-2">
            <Link to="/" className="flex items-center group shrink-0">
              <img
                src={studentresorLogo}
                alt="Studentresor"
                width="140"
                height="48"
                className={`h-10 lg:h-12 w-auto transition-all duration-300 ${useDarkText ? "brightness-0" : ""}`}
              />
            </Link>

            <nav className="hidden lg:flex items-center gap-2 xl:gap-4 2xl:gap-6 min-w-0 flex-1 justify-center">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className={`flex items-center gap-1 text-sm xl:text-base font-medium transition-colors outline-none whitespace-nowrap ${
                  useDarkText ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"
                }`}>
                  {t("nav.ourTrips")}
                  <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border border-border shadow-lg z-50" sideOffset={8} align="start">
                  <DropdownMenuItem asChild>
                    <Link to="/segelveckan" className="cursor-pointer">{t("trips.segelveckan")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/studentveckan" className="cursor-pointer">{t("trips.studentveckan")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/splitveckan" className="cursor-pointer">{t("trips.splitveckan")}</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/om-oss" className={`text-sm xl:text-base font-medium transition-colors whitespace-nowrap ${useDarkText ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"}`}>
                {t("nav.aboutUs")}
              </Link>
              <Link to="/kontakt" className={`text-sm xl:text-base font-medium transition-colors whitespace-nowrap ${useDarkText ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"}`}>
                {t("nav.contact")}
              </Link>
              <Link to="/faq" className={`text-sm xl:text-base font-medium transition-colors whitespace-nowrap ${useDarkText ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"}`}>
                {t("nav.faq")}
              </Link>
              <Link to="/for-skolor" className={`text-sm xl:text-base font-medium transition-colors whitespace-nowrap ${useDarkText ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"}`}>
                <span className="hidden 2xl:inline">{t("nav.forSchools")}</span>
                <span className="2xl:hidden">{t("nav.forSchoolsShort")}</span>
              </Link>
            </nav>

            <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
              <LanguageSwitcher useDarkText={useDarkText} />

              {user && (
                <Link to="/dashboard" className={`text-sm xl:text-base font-medium transition-colors whitespace-nowrap ${useDarkText ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"}`}>
                  {t("nav.myBookings")}
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" className={`text-sm xl:text-base font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${useDarkText ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"}`}>
                  <Shield className="w-4 h-4" />
                  {t("nav.admin")}
                </Link>
              )}
              {partnerProfile && (
                <Link to="/partner" className={`text-sm xl:text-base font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${useDarkText ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white"}`}>
                  <Home className="w-4 h-4" />
                  {t("nav.hostPortal")}
                </Link>
              )}

              {user ? (
                <div className="flex items-center gap-2">
                  <Link to="/settings">
                    <Button variant="ghost" size="sm" className={`gap-1.5 ${useDarkText ? "" : "text-white hover:text-white/80 hover:bg-white/10"}`}>
                      <UserIcon className="w-4 h-4" />
                      <span className="hidden xl:inline">{t("nav.myAccount")}</span>
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden xl:inline">{t("nav.logOut")}</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/auth">
                    <Button variant="ghost" size="sm" className={useDarkText ? "" : "text-white hover:text-white/80 hover:bg-white/10"}>
                      {t("nav.logIn")}
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup">
                    <Button variant="default" size="sm" className="bg-gradient-ocean hover:opacity-90">
                      {t("nav.createAccount")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <button
              className={`lg:hidden p-1.5 relative z-[110] ${isMenuOpen ? "text-white" : useDarkText ? "text-foreground" : "text-white"}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] lg:hidden bg-accent"
          >
            <div className="flex flex-col h-full pt-20 pb-8 px-6 overflow-y-auto">
              <nav className="flex flex-col gap-1">
                {/* Language switcher at top of mobile menu */}
                <div className="mb-4 flex gap-2">
                  {[
                    { code: "sv", flag: "🇸🇪" },
                    { code: "en", flag: "🇬🇧" },
                    { code: "hr", flag: "🇭🇷" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        const { i18n } = require("react-i18next");
                        // handled via hook below
                      }}
                      className="text-2xl"
                    >
                      {lang.flag}
                    </button>
                  ))}
                </div>
                <MobileLanguageSwitcher />

                <div className="mb-4">
                  <p className="text-white/50 text-sm uppercase tracking-wider mb-3">{t("nav.ourTrips")}</p>
                  <div className="flex flex-col gap-1">
                    <Link to="/segelveckan" className="text-white text-2xl font-serif font-bold py-2 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                      {t("trips.segelveckan")}
                    </Link>
                    <Link to="/studentveckan" className="text-white text-2xl font-serif font-bold py-2 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                      {t("trips.studentveckan")}
                    </Link>
                    <Link to="/splitveckan" className="text-white text-2xl font-serif font-bold py-2 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                      {t("trips.splitveckan")}
                    </Link>
                  </div>
                </div>

                <div className="h-px bg-white/20 my-4" />

                <Link to="/om-oss" className="text-white text-2xl font-serif font-bold py-2 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                  {t("nav.aboutUs")}
                </Link>
                <Link to="/kontakt" className="text-white text-2xl font-serif font-bold py-2 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                  {t("nav.contact")}
                </Link>
                <Link to="/faq" className="text-white text-2xl font-serif font-bold py-2 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                  {t("nav.questionsAndAnswers")}
                </Link>
                <Link to="/for-skolor" className="text-white text-2xl font-serif font-bold py-2 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                  {t("nav.forSchools")}
                </Link>

                {user && (
                  <>
                    <div className="h-px bg-white/20 my-4" />
                    <Link to="/dashboard" className="text-white text-2xl font-serif font-bold py-2 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                      {t("nav.myBookings")}
                    </Link>
                    <Link to="/settings" className="text-white text-2xl font-serif font-bold py-2 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                      {t("nav.myAccount")}
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="text-white text-2xl font-serif font-bold py-2 hover:text-primary transition-colors flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                        <Shield className="w-6 h-6" />
                        {t("nav.admin")}
                      </Link>
                    )}
                    {partnerProfile && (
                      <Link to="/partner" className="text-white text-2xl font-serif font-bold py-2 hover:text-primary transition-colors flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                        <Home className="w-6 h-6" />
                        {t("nav.hostPortal")}
                      </Link>
                    )}
                  </>
                )}
              </nav>

              <div className="mt-auto pt-8">
                {user ? (
                  <Button
                    variant="outline"
                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                    className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("nav.logOut")}
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link to="/auth?mode=signup" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white text-lg py-6">
                        {t("nav.createAccount")}
                      </Button>
                    </Link>
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                        {t("nav.logIn")}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/** Small mobile language switcher with flags */
const MobileLanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const languages = [
    { code: "sv", flag: "🇸🇪" },
    { code: "en", flag: "🇬🇧" },
    { code: "hr", flag: "🇭🇷" },
  ];

  return (
    <div className="flex gap-3 mb-4">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`text-2xl p-1.5 rounded-lg transition-colors ${
            i18n.language === lang.code ? "bg-white/20" : "hover:bg-white/10"
          }`}
          aria-label={lang.code.toUpperCase()}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
};
