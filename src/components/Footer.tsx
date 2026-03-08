import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import studentresorLogo from "@/assets/studentresor-logo.svg";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-6">
              <img src={studentresorLogo} alt="Studentresor" className="h-12 w-auto" />
            </Link>
            <p className="text-primary-foreground/70 text-sm mb-2">Studentlife Sweden AB</p>
            <p className="text-primary-foreground/70 text-sm mb-4">Org.nr: 559358-2330</p>
            <div className="flex gap-4">
              <a href="https://www.tiktok.com/@studentresor.se" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors" aria-label="TikTok">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.3z"/></svg>
              </a>
              <a href="https://www.instagram.com/studentresor.se/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a href="https://www.youtube.com/@studentresor_official" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors" aria-label="YouTube">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/jim-solutions-ab/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          {/* Trips */}
          <div>
            <h4 className="font-serif font-semibold text-lg mb-6">{t("footer.ourTrips")}</h4>
            <ul className="space-y-3">
              <li><Link to="/segelveckan" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("trips.segelveckan")}</Link></li>
              <li><Link to="/splitveckan" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("trips.splitveckan")}</Link></li>
              <li><Link to="/studentveckan" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("trips.studentveckan")}</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-serif font-semibold text-lg mb-6">{t("footer.information")}</h4>
            <ul className="space-y-3">
              <li><Link to="/resevillkor" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("footer.travelTerms")}</Link></li>
              <li><Link to="/faq" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("footer.questionsAndAnswers")}</Link></li>
              <li><Link to="/kontakt" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("footer.contact")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-semibold text-lg mb-6">{t("footer.contactTitle")}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-primary-foreground/70">Tågagatan 44<br />254 30 Helsingborg</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <a href="tel:+46424240471" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">042-424 04 71</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a href="mailto:info@studentresor.com" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">info@studentresor.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Language switcher + copyright */}
        <div className="border-t border-primary-foreground/10 mt-12 pt-8">
          <div className="flex flex-col items-center gap-4">
            <LanguageSwitcher variant="footer" />
            <p className="text-primary-foreground/50 text-sm">
              © {new Date().getFullYear()} Studentlife Sweden AB. {t("footer.allRightsReserved")}
            </p>
            <p className="text-primary-foreground/40 text-xs">
              {t("footer.travelGuarantee")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
