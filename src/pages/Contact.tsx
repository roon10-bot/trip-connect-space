import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast.success("Tack för ditt meddelande! Vi återkommer så snart vi kan.");
      setIsSubmitting(false);
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-accent to-accent/80">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-accent-foreground mb-4">
            Kontakta oss
          </h1>
          <p className="text-accent-foreground/80 text-lg max-w-2xl mx-auto">
            Har du frågor om våra resor eller vill veta mer? Tveka inte att höra av dig – vi hjälper dig gärna!
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                  Hör av dig
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Vi finns här för att svara på alla dina frågor. Kontakta oss via formuläret, mejl eller telefon så återkommer vi inom 24 timmar.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">E-post</h3>
                    <a href="mailto:info@studentresor.se" className="text-muted-foreground hover:text-primary transition-colors">
                      info@studentresor.se
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Telefon</h3>
                    <a href="tel:+46424240471" className="text-muted-foreground hover:text-primary transition-colors">
                      042-424 04 71
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Adress</h3>
                    <p className="text-muted-foreground">
                      Tågagatan 44, Helsingborg
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                Skicka ett meddelande
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Förnamn</Label>
                    <Input id="firstName" placeholder="Ditt förnamn" required maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Efternamn</Label>
                    <Input id="lastName" placeholder="Ditt efternamn" required maxLength={100} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input id="email" type="email" placeholder="din@email.se" required maxLength={255} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Ämne</Label>
                  <Input id="subject" placeholder="Vad gäller det?" required maxLength={200} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Meddelande</Label>
                  <Textarea
                    id="message"
                    placeholder="Skriv ditt meddelande här..."
                    className="min-h-[140px]"
                    required
                    maxLength={2000}
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90" disabled={isSubmitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Skickar..." : "Skicka meddelande"}
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
