import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";

const Terms = () => {
  useSEO({
    title: "Allmänna resevillkor | Studentresor",
    description: "Läs Studentresors allmänna resevillkor för paketresor arrangerade av Studentlife Sweden AB. Information om betalning, avbokning och resegaranti.",
    canonical: "https://www.studentresor.se/resevillkor",
    breadcrumbs: [
      { name: "Hem", url: "https://www.studentresor.se/" },
      { name: "Resevillkor", url: "https://www.studentresor.se/resevillkor" },
    ],
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6 prose prose-neutral">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-2">
            Allmänna resevillkor
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Allmänna resevillkor för paketresor – Studentresor (Studentlife Sweden AB)
          </p>

          <div className="space-y-2 text-sm text-muted-foreground mb-10">
            <p>Org.nr: 559358-2330</p>
            <p>Adress: Tågagatan 44, 254 30 Helsingborg</p>
            <p>E-post: info@studentresor.se</p>
            <p>Telefon: 042-424 04 71</p>
          </div>

          <p className="text-foreground/80 mb-8">
            För resor som bokas via Studentresor gäller Svenska Resebyrå- och arrangörsföreningens
            (SRF) allmänna villkor för paketresor (28 juni 2018) samt dessa särskilda villkor. De
            särskilda villkoren tar hänsyn till resans karaktär – till exempel studentresor med
            specifika transporter, boendeformer och aktivitetsupplägg.
          </p>
          <p className="text-foreground/80 mb-10">
            De allmänna och särskilda villkoren utgör tillsammans ett bindande avtal mellan dig som
            resenär och Studentlife Sweden AB ("Studentresor").
          </p>

          <Section title="1. Avtalet">
            Bokningen blir bindande först när du mottagit en skriftlig bekräftelse via e-post.
            Huvudresenären är den person som bokar resan och ansvarar för hela bokningen. Resenär
            under 18 år måste ha målsmans godkännande. Du ansvarar för att kontrollera att
            bokningsbekräftelsen och resehandlingarna är korrekta. Studentresor förbehåller sig
            rätten att justera preliminära tider för avresa och hemkomst.
          </Section>

          <Section title="2. Pris och betalning">
            <p>Pris anges inklusive skatter och obligatoriska avgifter.</p>
            <p className="font-medium mt-3 mb-2">Betalningsvillkor:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Bokningsavgift:</strong> 25 % av totalbeloppet. Bokningsavgiften ska betalas
                inom 48 timmar efter bokningstillfället och är inte återbetalningsbar.
              </li>
              <li>
                <strong>Slutbetalning:</strong> Resterande belopp ska betalas senast 30 dagar före
                avresa.
              </li>
              <li>
                Bokningar som görs närmare än 40 dagar före avresa ska betalas i sin helhet inom 3
                dagar.
              </li>
            </ul>
          </Section>

          <Section title="3. Avbokning">
            <p className="font-medium mb-2">Avbokningsavgifter:</p>
            <ul className="list-disc pl-5 space-y-1.5 mb-3">
              <li>Fram till 40 dagar före avresa: 30 % av totalbeloppet</li>
              <li>Från 39 dagar före avresa: 100 % av totalbeloppet</li>
            </ul>
            <p>
              Avbokning ska ske skriftligen av huvudresenären. Observera att bokningsavgiften alltid
              är ej återbetalningsbar, oavsett tidpunkt för avbokning.
            </p>
          </Section>

          <Section title="4. Överlåtelse av bokning">
            Bokningen kan överlåtas till annan person senast 7 dagar innan avresa, mot en
            administrativ avgift. Både överlåtare och ny resenär är solidariskt ansvariga för
            betalning.
          </Section>

          <Section title="5. Ändringar och inställningar">
            <p>
              Studentresor har rätt att göra mindre ändringar i resans innehåll utan kompensation.
              Vid väsentliga ändringar (t.ex. ändrat avresedatum, destination eller prishöjning över
              8 %) erbjuds kunden alternativ resa eller full återbetalning.
            </p>
            <p className="mt-3">
              Resan kan ställas in vid för få deltagare. Information ges enligt lag:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Senast 20 dagar före avresa om resan varar längre än 6 dagar</li>
              <li>Senast 7 dagar före vid resor på 2–6 dagar</li>
              <li>Senast 48 timmar före vid resor under 2 dagar</li>
            </ul>
          </Section>

          <Section title="6. Ansvar">
            Studentresor ansvarar för att hela paketresan genomförs enligt avtal. Om något blir fel
            ska vi ges möjlighet att åtgärda detta inom rimlig tid. Vid force majeure (t.ex.
            pandemi, naturkatastrof, krig) kan resan ställas in utan rätt till skadestånd.
          </Section>

          <Section title="7. Reklamation">
            Fel ska reklameras snarast, helst på plats. Studentresor har rätt att försöka åtgärda
            problemet innan kompensation kan bli aktuell.
          </Section>

          <Section title="8. Resenärens ansvar">
            Resenären ska följa anvisningar från reseledare och boendepersonal. Du ansvarar för att
            ha giltigt pass, visum (om tillämpligt) och reseförsäkring. Störande beteende,
            skadegörelse eller brott mot regler kan leda till att du avvisas från resan utan
            återbetalning.
          </Section>

          <Section title="9. Hjälp under resan">
            Studentresor bistår med hjälp vid problem under resan – t.ex. vid sjukdom, förlorade
            dokument eller andra akuta situationer. Vår jour kan kontaktas vid behov.
          </Section>

          <Section title="10. Tvist">
            Tvister försöks lösas i första hand mellan parterna. Du kan även vända dig till Allmänna
            Reklamationsnämnden (ARN) eller EU:s onlineplattform för tvistlösning.
          </Section>

          <div className="mt-10 pt-6 border-t border-border">
            <p className="text-foreground/80">
              Studentresor drivs av Studentlife Sweden AB. Vi tillhandahåller resepaket för unga och
              studenter till utvalda europeiska destinationer.
            </p>
            <p className="text-foreground/80 mt-3">
              Vi samarbetar med olika grupper och arrangörer – vid sådana samarbeten kan särskilda
              villkor eller avvikelser förekomma enligt överenskomna avtal.
            </p>
            <p className="text-foreground/80 mt-3 font-medium">
              Genom att boka med oss godkänner du dessa villkor.
            </p>
            <p className="text-muted-foreground text-sm mt-4">Senast uppdaterade: 2025-10-07</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
    <div className="text-foreground/80 leading-relaxed">{children}</div>
  </section>
);

export default Terms;
