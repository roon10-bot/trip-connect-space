import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";

const AccountTerms = () => {
  useSEO({
    title: "Användarvillkor & Integritetspolicy | Studentresor",
    description: "Läs Studentresors användarvillkor för konto och integritetspolicy. Information om GDPR, personuppgiftshantering och dina rättigheter.",
    canonical: "https://www.studentresor.com/kontovillkor",
    breadcrumbs: [
      { name: "Hem", url: "https://www.studentresor.com/" },
      { name: "Kontovillkor", url: "https://www.studentresor.com/kontovillkor" },
    ],
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6 prose prose-neutral">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-2">
            Användarvillkor – Konto
          </h1>
          <p className="text-muted-foreground text-sm mb-10">
            Senast uppdaterad: 2025-10-07
          </p>

          <p className="text-foreground/80 mb-8">
            Välkommen till studentresor.com. Genom att skapa ett konto godkänner du följande villkor.
          </p>

          <Section title="1. Om tjänsten">
            studentresor.com är en digital plattform där användare kan skapa konto, hantera
            uppgifter och genomföra bokningar. Att skapa konto innebär inte att någon resa har
            bokats eller att bindande reseavtal har ingåtts.
          </Section>

          <Section title="2. Konto och ansvar">
            <p>Du ansvarar för:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Att uppgifterna du anger är korrekta</li>
              <li>Att hålla dina inloggningsuppgifter säkra</li>
              <li>All aktivitet som sker via ditt konto</li>
            </ul>
            <p className="mt-3">
              Vi förbehåller oss rätten att stänga eller begränsa konton vid missbruk.
            </p>
          </Section>

          <Section title="3. Ålder">
            För att skapa konto måste du vara minst 18 år, eller ha målsmans godkännande.
          </Section>

          <Section title="4. Tillgänglighet">
            Vi strävar efter att plattformen alltid ska fungera, men garanterar inte oavbruten
            tillgång.
          </Section>

          <Section title="5. Ändringar">
            Vi kan uppdatera dessa villkor vid behov. Den senaste versionen finns alltid
            publicerad på webbplatsen.
          </Section>

          <Section title="6. Kontakt">
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Studentlife Sweden AB</p>
              <p>Org.nr: 559358-2330</p>
              <p>Adress: Tågagatan 44, 254 30 Helsingborg</p>
              <p>E-post: info@studentresor.com</p>
              <p>Telefon: 042-424 04 71</p>
            </div>
          </Section>

          {/* Divider */}
          <div className="my-12 border-t border-border" />

          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
            Integritetspolicy
          </h2>
          <p className="text-muted-foreground text-sm mb-10">
            Senast uppdaterad: 2025-10-07
          </p>

          <p className="text-foreground/80 mb-8">
            Studentlife Sweden AB ("Studentresor", "vi", "oss") är personuppgiftsansvarig för
            behandlingen av dina personuppgifter. Vi värnar om din integritet och följer EU:s
            dataskyddsförordning (GDPR) samt svensk dataskyddslagstiftning.
          </p>

          <Section title="1. Vilka uppgifter vi samlar in">
            <p>När du skapar konto och använder vår tjänst kan vi behandla följande personuppgifter:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Namn och kontaktuppgifter (e-post, telefonnummer)</li>
              <li>Inloggningsuppgifter (e-postadress och krypterat lösenord)</li>
              <li>Boknings- och betalningsinformation</li>
              <li>Teknisk data (IP-adress, webbläsare, enhet) för att säkerställa tjänstens funktion</li>
            </ul>
          </Section>

          <Section title="2. Varför vi behandlar dina uppgifter">
            <p>Vi behandlar dina personuppgifter för att:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Administrera ditt konto och autentisera inloggning</li>
              <li>Möjliggöra och hantera bokningar</li>
              <li>Kommunicera med dig om din resa och bokning</li>
              <li>Uppfylla rättsliga skyldigheter (t.ex. bokföringslagen)</li>
              <li>Förbättra och utveckla vår tjänst</li>
            </ul>
          </Section>

          <Section title="3. Rättslig grund">
            <p>Behandlingen stödjer sig på följande rättsliga grunder enligt GDPR:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Avtal:</strong> Nödvändigt för att fullgöra avtalet med dig (kontoskapande, bokning)</li>
              <li><strong>Rättslig förpliktelse:</strong> Vi är skyldiga att spara viss information enligt lag</li>
              <li><strong>Berättigat intresse:</strong> Förbättring av tjänsten och säkerhet</li>
              <li><strong>Samtycke:</strong> I de fall vi behöver ditt specifika godkännande</li>
            </ul>
          </Section>

          <Section title="4. Delning av uppgifter">
            Vi delar endast uppgifter med tredje part när det är nödvändigt för att
            tillhandahålla våra tjänster:
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Betaltjänstleverantörer (t.ex. Stripe) för säker betalningshantering</li>
              <li>Researrangörer och samarbetspartners vid genomförande av bokad resa</li>
              <li>IT-leverantörer för drift och underhåll av plattformen</li>
            </ul>
            <p className="mt-3">
              Vi säljer aldrig dina personuppgifter till tredje part.
            </p>
          </Section>

          <Section title="5. Lagring och radering">
            Vi lagrar dina personuppgifter så länge ditt konto är aktivt eller så länge det
            krävs för att uppfylla de ändamål de samlades in för. Bokföringsmaterial sparas i
            7 år enligt bokföringslagen. Efter att syftet uppfyllts raderas uppgifterna på ett
            säkert sätt.
          </Section>

          <Section title="6. Dina rättigheter enligt GDPR">
            <p>Du har rätt att:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Registerutdrag:</strong> Begära information om vilka uppgifter vi har om dig</li>
              <li><strong>Rättelse:</strong> Begära att felaktiga uppgifter korrigeras</li>
              <li><strong>Radering:</strong> Begära att dina uppgifter raderas ("rätten att bli glömd")</li>
              <li><strong>Begränsning:</strong> Begära att behandlingen begränsas</li>
              <li><strong>Dataportabilitet:</strong> Få ut dina uppgifter i ett maskinläsbart format</li>
              <li><strong>Invändning:</strong> Invända mot behandling baserad på berättigat intresse</li>
            </ul>
            <p className="mt-3">
              Kontakta oss på <a href="mailto:info@studentresor.com" className="text-primary underline">info@studentresor.com</a> för att utöva dina rättigheter.
            </p>
          </Section>

          <Section title="7. Säkerhet">
            Vi vidtar lämpliga tekniska och organisatoriska åtgärder för att skydda dina
            personuppgifter mot obehörig åtkomst, förlust eller förändring. All kommunikation
            sker via krypterade anslutningar (SSL/TLS) och lösenord lagras krypterade.
          </Section>

          <Section title="8. Cookies">
            Vi använder nödvändiga cookies för att tjänsten ska fungera korrekt (t.ex.
            inloggningssession). Vi använder inga spårningscookies för marknadsföring utan
            ditt samtycke.
          </Section>

          <Section title="9. Tillsynsmyndighet">
            Om du anser att vi behandlar dina personuppgifter i strid med GDPR har du rätt
            att lämna klagomål till Integritetsskyddsmyndigheten (IMY):
            <div className="mt-2 text-sm text-muted-foreground">
              <p>Integritetsskyddsmyndigheten</p>
              <p>Box 8114, 104 20 Stockholm</p>
              <p>
                <a href="https://www.imy.se" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                  www.imy.se
                </a>
              </p>
            </div>
          </Section>

          <div className="mt-10 pt-6 border-t border-border">
            <p className="text-foreground/80">
              Vid frågor om hur vi hanterar dina personuppgifter, kontakta oss:
            </p>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <p>Studentlife Sweden AB</p>
              <p>E-post: <a href="mailto:info@studentresor.com" className="text-primary underline">info@studentresor.com</a></p>
              <p>Telefon: 042-424 04 71</p>
            </div>
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

export default AccountTerms;
