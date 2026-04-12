import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Clock, Star, MapPin, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-illustration.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const features = [
  { icon: Zap, title: "Lightning Fast", desc: "Order in under 60 seconds with our streamlined checkout." },
  { icon: Search, title: "Smart Search", desc: "Find exactly what you crave with intelligent filters." },
  { icon: Clock, title: "Real-time Tracking", desc: "Know exactly when your food arrives at your door." },
  { icon: ShieldCheck, title: "Secure Payments", desc: "Multiple payment options with bank-grade security." },
];

const steps = [
  { num: "01", title: "Browse", desc: "Explore nearby restaurants and their menus." },
  { num: "02", title: "Order", desc: "Add items to cart and checkout in seconds." },
  { num: "03", title: "Track", desc: "Watch your order from kitchen to doorstep." },
  { num: "04", title: "Enjoy", desc: "Dig in! Fresh food, delivered fast." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="font-heading text-2xl font-bold text-gradient">Zenvy</Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" animate="visible" className="space-y-6">
            <motion.h1 variants={fadeUp} custom={0} className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Order smarter.<br /><span className="text-gradient">Eat faster.</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-muted-foreground max-w-md">
              The fastest way to discover nearby restaurants and get your favorite food delivered. No clutter, no hassle.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="flex gap-3">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">Learn More</Button>
              </a>
            </motion.div>
            <motion.div variants={fadeUp} custom={3} className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="text-sm font-medium">4.9 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">500+ Cities</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">30 min avg</span>
              </div>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <img src={heroImage} alt="Food delivery illustration" width={1024} height={1024} className="w-full max-w-lg mx-auto animate-float" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Why choose <span className="text-gradient">Zenvy</span>?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground max-w-md mx-auto">
              Built for speed, designed for simplicity.
            </motion.p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="bg-card rounded-xl p-6 shadow-card hover:shadow-hover transition-shadow duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="font-heading text-3xl md:text-4xl font-bold mb-4">
              How it works
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground max-w-md mx-auto">
              Four simple steps to deliciousness.
            </motion.p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="text-center">
                <div className="text-5xl font-heading font-bold text-primary/20 mb-3">{s.num}</div>
                <h3 className="font-heading font-semibold text-xl mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="rounded-2xl p-12 text-center" style={{ background: "var(--gradient-hero)" }}>
            <motion.h2 variants={fadeUp} custom={0} className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to order smarter?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
              Join thousands of happy foodies. Your next meal is just a tap away.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Link to="/auth?mode=signup">
                <Button size="lg" variant="secondary" className="gap-2">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-heading text-xl font-bold text-gradient">Zenvy</span>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <Link to="/auth" className="hover:text-foreground transition-colors">Login</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Zenvy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
