import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Music, QrCode, Sparkles, Heart, Clock } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext"; // Importando o Contexto

export default function Home() {
  // Pegamos o estado global de idioma
  const { language, setLanguage, priceFormatted } = useLanguage();

  // --- DICIONÁRIO DE TRADUÇÕES ---
  const t = {
    hero: {
      badge: language === "pt" ? "Espalhe a Magia do Natal" : "Spread Holiday Joy",
      title1: language === "pt" ? "Cartões de Natal" : "Christmas Cards",
      title2: language === "pt" ? "Feitos de Magia" : "Made Magical",
      subtitle: language === "pt" 
        ? "Crie cartões personalizados lindos com música, fotos e mensagens emocionantes. Compartilhe a magia com um simples QR Code."
        : "Create beautiful, personalized Christmas cards with music, photos, and heartfelt messages. Share the magic with a simple QR code.",
      cta: language === "pt" ? "Criar meu Cartão" : "Create Your Card",
      pricingBtn: language === "pt" ? "Ver Preços" : "View Pricing",
    },
    features: {
      title: language === "pt" ? "Tudo que você precisa" : "Everything You Need",
      subtitle: language === "pt" ? "Crie cartões memoráveis em minutos" : "Create memorable cards in minutes",
      items: [
        {
          title: language === "pt" ? "Templates Lindos" : "Beautiful Templates",
          desc: language === "pt" ? "Escolha entre designs natalinos incríveis com animações" : "Choose from stunning Christmas-themed designs with animations",
        },
        {
          title: language === "pt" ? "Música Festiva" : "Festive Music",
          desc: language === "pt" ? "Adicione músicas de Natal ou envie seu próprio áudio" : "Add Christmas songs or upload your own music",
        },
        {
          title: language === "pt" ? "Toque Pessoal" : "Personal Touch",
          desc: language === "pt" ? "Adicione fotos e mensagens com sugestões de IA" : "Add photos and heartfelt messages with AI suggestions",
        },
        {
          title: language === "pt" ? "Compartilhamento Fácil" : "Easy Sharing",
          desc: language === "pt" ? "Envie via QR Code - perfeito para imprimir também" : "Share via QR code - perfect for printed cards too",
        },
      ]
    },
    steps: {
      title: language === "pt" ? "Como Funciona" : "How It Works",
      subtitle: language === "pt" ? "Três passos simples para espalhar alegria" : "Three simple steps to spread holiday cheer",
      items: [
        { title: language === "pt" ? "Escolha & Personalize" : "Choose & Customize", desc: language === "pt" ? "Escolha um modelo, adicione sua mensagem, foto e música" : "Pick a template, add your message, photo, and music" },
        { title: language === "pt" ? "Pague & Gere" : "Pay & Generate", desc: language === "pt" ? "Faça o pagamento seguro e receba seu QR Code único" : "Complete payment and get your unique QR code" },
        { title: language === "pt" ? "Compartilhe" : "Share the Joy", desc: language === "pt" ? "Envie o QR Code para quem você ama" : "Send the QR code to your loved ones" },
      ]
    },
    pricing: {
      title: language === "pt" ? "Preço Simples" : "Simple Pricing",
      subtitle: language === "pt" ? "Acesso vitalício ao seu cartão digital" : "Lifetime access to your digital card",
      bestValue: language === "pt" ? "Melhor Valor" : "Best Value",
      single: {
        name: language === "pt" ? "Cartão Único" : "Single Card",
        desc: language === "pt" ? "Perfeito para alguém especial" : "Perfect for that special someone",
        price: priceFormatted, // Usa o preço formatado do contexto (R$ 10 ou $ 5)
      },
      family: {
        name: language === "pt" ? "Pacote Família" : "Family Pack",
        desc: language === "pt" ? "Espalhe alegria para todos" : "Send joy to all your loved ones",
        // Lógica simples: 5x o preço com desconto (Ex: R$ 40 ou $ 20)
        price: language === "pt" ? "R$ 40,00" : "$ 20.00",
      },
      getStarted: language === "pt" ? "Começar Agora" : "Get Started",
      validity: language === "pt" ? "Cartões acessíveis até 15 de Jan, 2026" : "Cards are accessible until January 15th, 2026",
    },
    footer: {
      madeWith: language === "pt" ? "Feito com" : "Made with",
      season: language === "pt" ? "para o Natal" : "for the holiday season",
    }
  };

  const featuresList = [
    { icon: <Sparkles className="h-8 w-8" />, ...t.features.items[0] },
    { icon: <Music className="h-8 w-8" />, ...t.features.items[1] },
    { icon: <Gift className="h-8 w-8" />, ...t.features.items[2] },
    { icon: <QrCode className="h-8 w-8" />, ...t.features.items[3] },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      
      {/* LANGUAGE SELECTOR (Floating Top Right) */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button 
          variant={language === "pt" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setLanguage("pt")}
          className="shadow-md"
        >
          🇧🇷 BR
        </Button>
        <Button 
          variant={language === "en" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setLanguage("en")}
          className="shadow-md"
        >
          🇺🇸 US
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="container max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>{t.hero.badge}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="text-primary">{t.hero.title1}</span>
              <br />
              <span className="font-script text-4xl md:text-6xl text-[oklch(0.45_0.15_145)]">
                {t.hero.title2}
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.hero.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/create">
                <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
                  <Gift className="mr-2 h-5 w-5" />
                  {t.hero.cta}
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                {t.hero.pricingBtn}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-pulse">🎄</div>
        <div className="absolute top-40 right-10 text-4xl opacity-20 animate-pulse delay-500">⭐</div>
        <div className="absolute bottom-20 left-1/4 text-5xl opacity-20 animate-pulse delay-1000">🎁</div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/50">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.features.title}</h2>
            <p className="text-muted-foreground text-lg">{t.features.subtitle}</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuresList.map((feature, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow bg-card">
                <CardContent className="pt-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.steps.title}</h2>
            <p className="text-muted-foreground text-lg">{t.steps.subtitle}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {t.steps.items.map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-card/50">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.pricing.title}</h2>
            <p className="text-muted-foreground text-lg">{t.pricing.subtitle}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Single Plan */}
            <Card className="relative overflow-hidden border-border shadow-lg hover:shadow-xl transition-all">
              <CardContent className="pt-8 pb-6 text-center">
                <h3 className="font-semibold text-xl mb-2">{t.pricing.single.name}</h3>
                <div className="text-4xl font-bold text-primary mb-2">{t.pricing.single.price}</div>
                <p className="text-muted-foreground mb-1">1 card</p>
                <p className="text-sm text-muted-foreground mb-6">{t.pricing.single.desc}</p>
                <Link href="/create">
                  <Button className="w-full" variant="outline">
                    {t.pricing.getStarted}
                  </Button>
                </Link>
              </CardContent>
            </Card>


          </div>
          
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{t.pricing.validity}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              <span className="font-semibold">Christmas Cards</span>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {t.footer.madeWith} <Heart className="h-4 w-4 text-primary" /> {t.footer.season}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}