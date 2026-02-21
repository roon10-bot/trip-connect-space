import { useEffect } from "react";
import { Header } from "@/components/Header";
import { useSEO } from "@/hooks/useSEO";
import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const faqItems = [
  {
    question: "Vad ingår i resan?",
    answer: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Flyg tur/retur från vald avreseort (t.ex. Köpenhamn, Stockholm eller Göteborg)</li>
        <li>Transfer mellan flygplats och boende</li>
        <li>Boende (Splitveckan – hotell/lägenhet, Seglingsveckan – hytt på segelbåt)</li>
        <li>Städning och servicepersonal</li>
        <li>Segling (vid val av Seglingsveckan, lördag till lördag)</li>
        <li>Svensk personal på plats hela veckan</li>
        <li>Lokal support 24/7</li>
      </ul>
    ),
  },
  {
    question: "Hur bokar jag en resa?",
    answer:
      "Du kan antingen göra en bokningsförfrågan vid större grupper (10+) eller boka direkt via bokningslänken.",
  },
  {
    question: "Vilka betalningsalternativ erbjuder ni?",
    answer: "Ni kan betala med samtliga betalkort eller Swish.",
  },
  {
    question: "Vad händer om jag inte kan betala i tid?",
    answer:
      "Om betalningen inte sker i tid kan det leda till att din bokning förloras och att extra kostnader kan tillkomma. Vi rekommenderar att du kontaktar oss om du har problem med betalningen.",
  },
  {
    question: "Vad händer om resan ställs in?",
    answer:
      "Om resan ställs in på grund av oförutsedda händelser kommer vi att erbjuda återbetalning eller en alternativ resa. Vi samarbetar nära med våra leverantörer för att minimera risken för inställda resor.",
  },
  {
    question: "Finns det åldersgränser för att delta?",
    answer: "Ja, resan är endast tillgänglig för personer som har fyllt 18 år.",
  },
  {
    question: "Hur många personer bor på varje katamaran?",
    answer: "Varje katamaran rymmer 10 personer exklusive skeppare.",
  },
  {
    question: "Vad händer om jag blir sjuk under resan?",
    answer:
      "Din hemförsäkring har ett reseskydd samt om du har betalat din resa via ett betalkort från Visa eller Mastercard så ingår ett reseskydd. Vi är tillgängliga på plats och hjälper er lösa sådana situationer ifall de skulle uppstå.",
  },
  {
    question: "Hur kontaktar jag er under resan om jag har problem?",
    answer:
      "Vi har 24/7 support som du kan kontakta via telefon eller vårt supportcenter på plats.",
  },
  {
    question: "Vad händer om flyget ställs in?",
    answer:
      "Vi arbetar nära flygbolagen för att hantera inställda flyg och kommer att arrangera alternativa flyg.",
  },
  {
    question: "Har Studentresor.com tecknat resegaranti?",
    answer: (
      <p>
        Studentresor.com är varumärket som används för att erbjuda reseupplevelser, medan
        Studentlife Sweden AB, med organisationsnummer 559358-2330, fungerar som den ansvariga
        researrangören. Företaget har även säkerställt trygghet för sina kunder genom att teckna en
        resegaranti hos Kammarkollegiet, vilket innebär att kunder är skyddade vid exempelvis
        oförväntade händelser som inställda resor. Detta garanterar att du som resenär kan boka med
        förtroende och veta att dina betalningar och reseplaner är säkrade.
      </p>
    ),
  },
  {
    question: "Allmänna resevillkor",
    answer: (
      <p>
        Du kan läsa om våra allmänna resevillkor{" "}
        <Link to="/resevillkor" className="text-primary underline hover:opacity-80">
          här
        </Link>
        .
      </p>
    ),
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqItems
    .filter((item) => typeof item.answer === "string")
    .map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      },
    })),
};

const FAQ = () => {
  useSEO({
    title: "Frågor och Svar om Studentresor | Studentresor",
    description: "Vanliga frågor om studentresor till Kroatien. Läs om betalning, avbokning, åldersgräns, resegaranti och vad som ingår i resan.",
    canonical: "https://www.studentresor.com/faq",
    breadcrumbs: [
      { name: "Hem", url: "https://www.studentresor.com/" },
      { name: "FAQ", url: "https://www.studentresor.com/faq" },
    ],
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(faqJsonLd);
    script.id = "faq-jsonld";
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById("faq-jsonld");
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frågor och Svar
          </h1>
          <p className="text-muted-foreground mb-10">
            Här hittar du svar på de vanligaste frågorna om våra resor, bokning och betalning.
          </p>

          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base md:text-lg font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
