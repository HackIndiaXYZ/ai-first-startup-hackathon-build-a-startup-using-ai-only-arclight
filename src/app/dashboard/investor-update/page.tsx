"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Presentation,
  Loader2,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Users,
  Settings,
  Target,
} from "lucide-react";
import { TriageResult, WeeklyUpdate, Slide } from "@/lib/types";
import { toast } from "sonner";

const SLIDE_ICONS = [TrendingUp, Target, Users, Settings, Sparkles];

export default function InvestorUpdatePage() {
  const [update, setUpdate] = useState<WeeklyUpdate | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [triageResults, setTriageResults] = useState<TriageResult[]>([]);
  const [triageLoaded, setTriageLoaded] = useState(false);

  // Load triage results first
  useEffect(() => {
    async function loadTriage() {
      try {
        const res = await fetch("/api/triage");
        const data = await res.json();
        if (data.success) {
          setTriageResults(data.results);
          setTriageLoaded(true);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load triage data");
      }
    }
    loadTriage();
  }, []);

  const generateUpdate = async () => {
    if (triageResults.length === 0) {
      toast.error("No triage data available");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/weekly-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triageResults }),
      });
      const data = await res.json();
      if (data.success) {
        setUpdate(data.update);
        toast.success("Weekly update generated", {
          description: "Investor email and slide deck ready",
        });
      } else {
        toast.error("Failed to generate update");
      }
    } catch (err) {
      console.error(err);
      toast.error("Weekly update generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyEmail = async () => {
    if (!update) return;
    await navigator.clipboard.writeText(update.emailContent);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Investor Update
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated weekly update for your investors
          </p>
        </div>
        <Button
          onClick={generateUpdate}
          disabled={loading || !triageLoaded}
          className="bg-gradient-to-r from-[oklch(0.65_0.15_270)] to-[oklch(0.6_0.2_290)] hover:opacity-90 transition-opacity"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : update ? (
            <RefreshCw className="w-4 h-4 mr-2" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {update ? "Regenerate" : "Generate Update"}
        </Button>
      </div>

      {/* No update generated yet */}
      {!update && !loading && (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[oklch(0.75_0.15_270_/_0.2)] to-[oklch(0.65_0.2_290_/_0.2)] flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-1">
              Generate Your Weekly Update
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Your AI chief-of-staff will synthesize this week&apos;s triaged
              emails into a polished investor update email and a mini pitch deck
              summary.
            </p>
            {triageLoaded && (
              <p className="text-xs text-muted-foreground mt-3">
                Based on{" "}
                <span className="font-medium text-foreground">
                  {triageResults.length} triaged emails
                </span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[oklch(0.75_0.15_270)] to-[oklch(0.65_0.2_290)] flex items-center justify-center animate-pulse-slow mb-4">
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            </div>
            <h3 className="text-lg font-medium mb-1">
              Generating your update...
            </h3>
            <p className="text-sm text-muted-foreground">
              Synthesizing {triageResults.length} emails into investor-ready
              content
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generated Update */}
      {update && !loading && (
        <Tabs defaultValue="email" className="space-y-4">
          <TabsList className="glass">
            <TabsTrigger value="email" className="gap-2">
              <FileText className="w-3.5 h-3.5" />
              Email Draft
            </TabsTrigger>
            <TabsTrigger value="slides" className="gap-2">
              <Presentation className="w-3.5 h-3.5" />
              Slide Summary
            </TabsTrigger>
          </TabsList>

          {/* Email Tab */}
          <TabsContent value="email">
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Investor Update Email — Week of{" "}
                  {update.weekStart} to {update.weekEnd}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyEmail}
                  className="glass"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 mr-2 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 mr-2" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm prose-invert max-w-none">
                  <div className="p-4 rounded-lg bg-accent/30 text-sm whitespace-pre-wrap leading-relaxed font-mono">
                    {update.emailContent}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Slides Tab */}
          <TabsContent value="slides">
            <div className="grid gap-4">
              {update.slides.map((slide, index) => (
                <SlideCard
                  key={index}
                  slide={slide}
                  index={index}
                  total={update.slides.length}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function SlideCard({
  slide,
  index,
  total,
}: {
  slide: Slide;
  index: number;
  total: number;
}) {
  const Icon = SLIDE_ICONS[index % SLIDE_ICONS.length];

  return (
    <Card
      className="glass animate-in-up overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Slide number bar */}
      <div className="h-1 bg-gradient-to-r from-[oklch(0.65_0.15_270)] to-[oklch(0.6_0.2_290)]" 
        style={{ width: `${((index + 1) / total) * 100}%` }}
      />
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">
              Slide {index + 1} of {total}
            </p>
            <CardTitle className="text-base">{slide.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{slide.content}</p>

        {/* Metrics */}
        {slide.metrics && slide.metrics.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {slide.metrics.map((metric, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-accent/30 border border-border/30"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {metric.label}
                </p>
                <p className="text-lg font-bold mt-0.5">{metric.value}</p>
                {metric.change && (
                  <p className="text-[10px] text-primary mt-0.5">
                    {metric.change}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bullet Points */}
        {slide.bulletPoints && slide.bulletPoints.length > 0 && (
          <ul className="space-y-1.5">
            {slide.bulletPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
