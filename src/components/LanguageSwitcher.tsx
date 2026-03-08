import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

const languages = [
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
] as const;

interface LanguageSwitcherProps {
  variant?: "header" | "footer";
  useDarkText?: boolean;
}

export const LanguageSwitcher = ({ variant = "header", useDarkText = true }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const current = languages.find(l => l.code === i18n.language) ?? languages[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
  };

  if (variant === "footer") {
    return (
      <div className="flex items-center justify-center gap-3">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
              i18n.language === lang.code
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "text-primary-foreground/50 hover:text-primary-foreground/80 hover:bg-primary-foreground/10"
            }`}
            aria-label={lang.label}
          >
            <span className="text-base">{lang.flag}</span>
            <span className="hidden sm:inline">{lang.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors outline-none px-2 py-1 rounded-md ${
          useDarkText
            ? "text-foreground/70 hover:text-foreground hover:bg-muted"
            : "text-white/80 hover:text-white hover:bg-white/10"
        }`}
        aria-label="Välj språk"
      >
        <span className="text-base">{current.flag}</span>
        <span className="hidden xl:inline">{current.code.toUpperCase()}</span>
        <Globe className="w-3.5 h-3.5 xl:hidden" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-background border border-border shadow-lg z-50 min-w-[140px]"
        sideOffset={8}
        align="end"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`cursor-pointer flex items-center gap-2 ${
              i18n.language === lang.code ? "bg-muted" : ""
            }`}
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
