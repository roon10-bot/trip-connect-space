import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RotateCcw, CheckCircle2 } from "lucide-react";

interface CheckItem {
  id: string;
  label: string;
}

interface CheckSection {
  id: string;
  title: string;
  emoji: string;
  items: CheckItem[];
}

const sections: CheckSection[] = [
  {
    id: "auth",
    title: "Autentisering",
    emoji: "🔐",
    items: [
      { id: "auth-signup", label: "Registrering — konto skapas, bekräftelsemail skickas" },
      { id: "auth-verify", label: "E-postverifiering — länk i mail fungerar" },
      { id: "auth-login", label: "Inloggning med verifierat konto" },
      { id: "auth-welcome", label: "Välkomstmail skickas efter verifiering (en gång)" },
      { id: "auth-logout", label: "Utloggning rensar sessionen korrekt" },
    ],
  },
  {
    id: "booking",
    title: "Bokningsflöde",
    emoji: "✈️",
    items: [
      { id: "book-step1", label: "Steg 1 — välj resa, antal resenärer, avgångsort" },
      { id: "book-step2", label: "Steg 2 — fyll i alla resenärers information" },
      { id: "book-step3", label: "Steg 3 — granska sammanfattning, testa rabattkod" },
      { id: "book-step4-block", label: "Steg 4 — icke-inloggad/overifierad blockeras" },
      { id: "book-altapay", label: "AltaPay-kortbetalning → callback → bokning confirmed" },
      { id: "book-swish-desktop", label: "Swish Desktop — QR-kod visas, polling fungerar" },
      { id: "book-swish-mobile", label: "Swish Mobil — Öppna Swish-knapp → polling → bekräftelse" },
      { id: "book-duffel", label: "Duffel-flyg — offert hämtas och köps vid betalning" },
      { id: "book-pending-timeout", label: "Pending booking timeout — förfaller efter 30 min" },
      { id: "book-fullbooked", label: "Fullbokad resa — is_fullbooked sätts, nya bokningar blockeras" },
      { id: "book-discount", label: "Rabattkod — giltig/ogiltig/utgången kod" },
    ],
  },
  {
    id: "payments",
    title: "Betalningar (efter bokning)",
    emoji: "💳",
    items: [
      { id: "pay-plan", label: "Betalningsplan visas korrekt (40/30/30, 50/50, 100%)" },
      { id: "pay-installment", label: "Delbetalning 2 & 3 via dashboard fungerar" },
      { id: "pay-manual", label: "Manuell betalning via admin fungerar" },
    ],
  },
  {
    id: "dashboard",
    title: "Kunddashboard",
    emoji: "📊",
    items: [
      { id: "dash-bookings", label: "Mina bokningar visas med korrekt status" },
      { id: "dash-payments", label: "Betalningsöversikt — kommande/genomförda" },
      { id: "dash-documents", label: "Uppladdade dokument synliga" },
      { id: "dash-travelers", label: "Medresenärer kan se sin bokning efter inloggning" },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    emoji: "🛡️",
    items: [
      { id: "admin-trips-crud", label: "Resor — skapa, redigera, kopiera, ta bort" },
      { id: "admin-bookings", label: "Bokningslista — filtrera/sök bokningar" },
      { id: "admin-status", label: "Ändra bokningsstatus manuellt" },
      { id: "admin-templates", label: "Resmallar — skapa mall, skapa resa från mall" },
      { id: "admin-email", label: "E-postmallar — redigera och förhandsgranska" },
      { id: "admin-discount", label: "Rabattkoder — skapa/inaktivera" },
      { id: "admin-sales", label: "Försäljningsrapport — kräver sökknapp" },
      { id: "admin-meetings", label: "Mötesbokning — skapa tider, kunder kan boka" },
      { id: "admin-bulk", label: "Massuppdatering av resor" },
    ],
  },
  {
    id: "partner",
    title: "Partnerflöde",
    emoji: "🏠",
    items: [
      { id: "partner-register", label: "Registrering — skicka in partneransökan" },
      { id: "partner-approve", label: "Admin-godkännande → partner-roll tilldelas" },
      { id: "partner-listing", label: "Skapa boende — wizard med bilder" },
      { id: "partner-listing-approve", label: "Godkänn boende → resa skapas automatiskt" },
      { id: "partner-payouts", label: "Partner ser sina utbetalningar" },
    ],
  },
  {
    id: "public",
    title: "Publika sidor",
    emoji: "🌐",
    items: [
      { id: "pub-home", label: "Startsida laddas, destinationer visas" },
      { id: "pub-search", label: "Sök resor — filter fungerar" },
      { id: "pub-destinations", label: "Segelveckan, Splitveckan, Studentveckan" },
      { id: "pub-contact", label: "Kontaktformulär skickar mail" },
      { id: "pub-pages", label: "FAQ, Villkor, Om oss renderas korrekt" },
    ],
  },
  {
    id: "security",
    title: "Säkerhet",
    emoji: "🔒",
    items: [
      { id: "sec-rls", label: "RLS — icke-inloggad kan inte se andras bokningar" },
      { id: "sec-admin", label: "Admin-skydd — /admin kräver admin-roll" },
      { id: "sec-rate", label: "Rate limiting / Turnstile CAPTCHA fungerar" },
      { id: "sec-expire", label: "Cron-jobb rensar expired pending bookings" },
    ],
  },
  {
    id: "responsive",
    title: "Responsivitet & App",
    emoji: "📱",
    items: [
      { id: "resp-mobile", label: "Mobilvy — bokningsflöde, dashboard, admin" },
      { id: "resp-capacitor", label: "Capacitor (native) — Swish deep-linking" },
    ],
  },
  {
    id: "email",
    title: "E-post",
    emoji: "📧",
    items: [
      { id: "email-confirm", label: "Bokningsbekräftelse skickas till bokare" },
      { id: "email-invite", label: "Resenärsinbjudan skickas till medresenärer" },
      { id: "email-meeting", label: "Mötesbekräftelse skickas vid mötesbokning" },
    ],
  },
];

const STORAGE_KEY = "admin_test_checklist";

export const AdminTestChecklist = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(JSON.parse(saved));
    } catch {}
  }, []);

  const persist = (next: Record<string, boolean>) => {
    setChecked(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const toggle = (id: string) => {
    persist({ ...checked, [id]: !checked[id] });
  };

  const resetAll = () => {
    persist({});
  };

  const totalItems = sections.reduce((s, sec) => s + sec.items.length, 0);
  const doneItems = Object.values(checked).filter(Boolean).length;
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const sectionProgress = (sec: CheckSection) => {
    const done = sec.items.filter((i) => checked[i.id]).length;
    return { done, total: sec.items.length };
  };

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {progress === 100 ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : null}
              <span className="text-lg font-semibold">
                {doneItems} / {totalItems} testfall klara ({progress}%)
              </span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={doneItems === 0}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Nollställ
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Nollställ checklistan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Alla {doneItems} avbockade testfall nollställs. Detta kan inte ångras.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={resetAll}>Nollställ</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="grid gap-4">
        {sections.map((sec) => {
          const sp = sectionProgress(sec);
          const allDone = sp.done === sp.total;
          return (
            <Card key={sec.id} className={allDone ? "border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/20" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{sec.emoji}</span>
                    {sec.title}
                  </CardTitle>
                  <Badge variant={allDone ? "default" : "secondary"} className={allDone ? "bg-green-500" : ""}>
                    {sp.done}/{sp.total}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2.5">
                  {sec.items.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 cursor-pointer group"
                    >
                      <Checkbox
                        checked={!!checked[item.id]}
                        onCheckedChange={() => toggle(item.id)}
                        className="mt-0.5"
                      />
                      <span
                        className={`text-sm leading-snug transition-colors ${
                          checked[item.id]
                            ? "line-through text-muted-foreground/60"
                            : "text-foreground group-hover:text-primary"
                        }`}
                      >
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
