import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Music, QrCode, Sparkles, Heart, Clock } from "lucide-react";
import { Link } from "wouter";
import Snowfall from "@/components/Snowfall";

export default function Home() {
  const features = [
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Beautiful Templates",
      description: "Choose from stunning Christmas-themed designs with animations",
    },
    {
      icon: <Music className="h-8 w-8" />,
      title: "Festive Music",
      description: "Add Christmas songs or upload your own music",
    },
    {
      icon: <Gift className="h-8 w-8" />,
      title: "Personal Touch",
      description: "Add photos and heartfelt messages with AI suggestions",
    },
    {
      icon: <QrCode className="h-8 w-8" />,
      title: "Easy Sharing",
      description: "Share via QR code - perfect for printed cards too",
    },
  ];

  const pricingPlans = [
    {
      name: "Single Card",
      price: "R$ 3",
      cards: 1,
      description: "Perfect for that special someone",
      popular: false,
    },
    {
      name: "Family Pack",
      price: "R$ 5",
      cards: 5,
      description: "Send joy to all your loved ones",
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Snowfall />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="container max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Spread Holiday Joy</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="text-primary">Christmas Cards</span>
              <br />
              <span className="font-script text-4xl md:text-6xl text-[oklch(0.45_0.15_145)]">Made Magical</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create beautiful, personalized Christmas cards with music, photos, and heartfelt messages. 
              Share the magic with a simple QR code.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/create">
                <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
                  <Gift className="mr-2 h-5 w-5" />
                  Create Your Card
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                View Pricing
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg">Create memorable cards in minutes</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow bg-card">
                <CardContent className="pt-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Three simple steps to spread holiday cheer</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Choose & Customize", desc: "Pick a template, add your message, photo, and music" },
              { step: "2", title: "Pay & Generate", desc: "Complete payment and get your unique QR code" },
              { step: "3", title: "Share the Joy", desc: "Send the QR code to your loved ones" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                  {item.step}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-muted-foreground text-lg">Choose the plan that works for you</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative overflow-hidden ${plan.popular ? 'border-primary shadow-xl scale-105' : 'border-border shadow-lg'}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-medium rounded-bl-lg">
                    Best Value
                  </div>
                )}
                <CardContent className="pt-8 pb-6 text-center">
                  <h3 className="font-semibold text-xl mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-primary mb-2">{plan.price}</div>
                  <p className="text-muted-foreground mb-1">{plan.cards} card{plan.cards > 1 ? 's' : ''}</p>
                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                  <Link href="/create">
                    <Button className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Cards are accessible until January 15th, 2025</span>
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
              Made with <Heart className="h-4 w-4 text-primary" /> for the holiday season
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
