import { Header } from "@/components/Header";
import { useSEO } from "@/hooks/useSEO";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const Contact = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useSEO({
    title: "Kontakta Studentresor – Frågor om studentresor till Kroatien",
    description: "Kontakta Studentresor för frågor om studentresor till Kroatien.",
    canonical: "https://www.studentresor.com/kontakt",
    breadcrumbs: [
      { name: "Hem", url: "https://www.studentresor.com/" },
      { name: "Kontakt", url: "https://www.studentresor.com/kontakt" },
    ],
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        },
      });
      if (error) throw error;
      toast.success(t("contact.successToast"));
      form.reset();
    } catch (err: any) {
      console.error("Contact form error:", err);
      toast.error(t("contact.errorToast"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-16 bg-gradient-to-br from-accent to-accent/80">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-accent-foreground mb-4">{t("contact.heroTitle")}</h1>
          <p className="text-accent-foreground/80 text-lg max-w-2xl mx-auto">{t("contact.heroSubtitle")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6">{t("contact.reachOut")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("contact.reachOutDesc")}</p>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10"><Mail className="w-5 h-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t("contact.email")}</h3>
                    <a href="mailto:info@studentresor.com" className="text-muted-foreground hover:text-primary transition-colors">info@studentresor.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10"><Phone className="w-5 h-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t("contact.phone")}</h3>
                    <a href="tel:+46424240471" className="text-muted-foreground hover:text-primary transition-colors">042-424 04 71</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10"><MapPin className="w-5 h-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t("contact.address")}</h3>
                    <p className="text-muted-foreground">Tågagatan 44, Helsingborg</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6">{t("contact.sendMessage")}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("contact.firstName")}</Label>
                    <Input id="firstName" name="firstName" placeholder={t("contact.firstNamePlaceholder")} required maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("contact.lastName")}</Label>
                    <Input id="lastName" name="lastName" placeholder={t("contact.lastNamePlaceholder")} required maxLength={100} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("contact.emailLabel")}</Label>
                  <Input id="email" name="email" type="email" placeholder={t("contact.emailPlaceholder")} required maxLength={255} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">{t("contact.subject")}</Label>
                  <Input id="subject" name="subject" placeholder={t("contact.subjectPlaceholder")} required maxLength={200} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t("contact.message")}</Label>
                  <Textarea id="message" name="message" placeholder={t("contact.messagePlaceholder")} className="min-h-[140px]" required maxLength={2000} />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90" disabled={isSubmitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? t("contact.sending") : t("contact.send")}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Contact;
