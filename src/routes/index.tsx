import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Zap, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Samsung Lock Tool — Protection anti-vol professionnelle" },
      { name: "description", content: "Outil professionnel de protection anti-vol pour appareils Samsung. Verrouillage à distance par USB en quelques secondes." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Samsung Lock Tool</span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost"><Link to="/auth">Connexion</Link></Button>
            <Button asChild><Link to="/auth">Démarrer</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground mb-8">
          <Shield className="h-3.5 w-3.5" />
          Protection anti-vol nouvelle génération
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          Verrouillez vos Samsung
          <br />en un clic.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Système de blocage à distance via USB. 5 crédits par opération. Logs en temps réel,
          historique complet, panneau admin.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/auth">Créer un compte <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          { icon: Zap, title: "Rapide", desc: "Verrouillage en moins de 10 secondes via USB." },
          { icon: Shield, title: "Sécurisé", desc: "Compte protégé, crédits débités automatiquement." },
          { icon: Lock, title: "Définitif", desc: "L'appareil doit être reflashé pour être récupéré." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-border/60 bg-card/50 p-6 hover:border-primary/40 transition-colors">
            <f.icon className="h-6 w-6 text-primary mb-4" />
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        © 2026 Samsung Lock Tool. Outil légitime de protection anti-vol.
      </footer>
    </div>
  );
}
