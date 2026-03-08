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
import { useTranslation } from "react-i18next";

const FAQ = () => {
  const { t } = useTranslation();

  useSEO({
    title: "Frågor och Svar om Studentresor | Studentresor",
    description: "Vanliga frågor om studentresor till Kroatien.",
    canonical: "https://www.studentresor.com/faq",
    breadcrumbs: [
      { name: "Hem", url: "https://www.studentresor.com/" },
      { name: "FAQ", url: "https://www.studentresor.com/faq" },
    ],
  });

  const faqItems = t("faq.items", { returnObjects: true }) as { question: string; answer: string }[];

  useEffect(() => {
    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(faqJsonLd);
    script.id = "faq-jsonld";
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById("faq-jsonld");
      if (el) el.remove();
    };
  }, [faqItems]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">{t("faq.title")}</h1>
          <p className="text-muted-foreground mb-10">{t("faq.subtitle")}</p>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base md:text-lg font-medium">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {index === faqItems.length - 1 ? (
                    <p>{item.answer} <Link to="/resevillkor" className="text-primary underline hover:opacity-80">{t("footer.travelTerms")}</Link></p>
                  ) : (
                    item.answer
                  )}
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
