"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, ArrowRight, Sparkles, Mail, BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Mail,
    title: "Smart Triage",
    description: "AI classifies every email: Investor, Customer, Urgent, or Noise",
  },
  {
    icon: BarChart3,
    title: "Founder Dashboard",
    description: "Prioritized feed, open loops, deadlines, and trend analytics",
  },
  {
    icon: Sparkles,
    title: "Auto-Draft",
    description: "Generate replies in your voice — direct, warm, or formal",
  },
  {
    icon: FileText,
    title: "Investor Updates",
    description: "Weekly updates and pitch slides synthesized from your activity",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div
        className={`text-center space-y-6 max-w-2xl transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[oklch(0.75_0.15_270)] to-[oklch(0.65_0.2_290)] flex items-center justify-center shadow-lg glow-sm">
            <Bot className="w-6 h-6 text-white" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="gradient-text">AI Co-Founder</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Your AI chief-of-staff for early-stage operations. Triage your inbox,
          surface what matters, draft responses, and generate investor updates —
          all on autopilot.
        </p>

        <Button
          size="lg"
          onClick={() => router.push("/dashboard")}
          className="bg-gradient-to-r from-[oklch(0.65_0.15_270)] to-[oklch(0.6_0.2_290)] hover:opacity-90 transition-opacity text-white px-8 py-6 text-base"
        >
          Launch Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-xs text-muted-foreground">
          🟢 Demo Mode — powered by seeded data, no account needed
        </p>
      </div>

      {/* Features */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 mt-16 max-w-2xl w-full transition-all duration-700 delay-300 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {features.map((feature, i) => (
          <div
            key={feature.title}
            className="glass glass-hover rounded-xl p-5 animate-in-up"
            style={{ animationDelay: `${400 + i * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-xs text-muted-foreground">
        <p>Built with Next.js + Claude AI + Supabase</p>
        <p className="mt-1">Hackathon Project — AI SaaS Startup Track</p>
      </div>
    </div>
  );
}
