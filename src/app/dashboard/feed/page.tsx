"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Mail,
  Clock,
  Send,
  Sparkles,
  Loader2,
  Check,
  Filter,
  ChevronDown,
} from "lucide-react";
import { TriageResult, EmailCategory, DraftResult } from "@/lib/types";
import { toast } from "sonner";

const CATEGORY_CONFIG: Record<
  EmailCategory,
  { bg: string; text: string; border: string; glow: string }
> = {
  Investor: {
    bg: "bg-[oklch(0.72_0.2_290_/_0.15)]",
    text: "text-[oklch(0.72_0.2_290)]",
    border: "border-[oklch(0.72_0.2_290_/_0.3)]",
    glow: "glow-investor",
  },
  Customer: {
    bg: "bg-[oklch(0.7_0.18_230_/_0.15)]",
    text: "text-[oklch(0.7_0.18_230)]",
    border: "border-[oklch(0.7_0.18_230_/_0.3)]",
    glow: "glow-customer",
  },
  "Urgent/Deadline": {
    bg: "bg-[oklch(0.7_0.22_25_/_0.15)]",
    text: "text-[oklch(0.7_0.22_25)]",
    border: "border-[oklch(0.7_0.22_25_/_0.3)]",
    glow: "glow-urgent",
  },
  Noise: {
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    border: "border-border/50",
    glow: "",
  },
};

const TONES = [
  { value: "direct" as const, label: "Direct", emoji: "⚡" },
  { value: "warm" as const, label: "Warm", emoji: "🤝" },
  { value: "formal" as const, label: "Formal", emoji: "📋" },
];

export default function FeedPage() {
  const [results, setResults] = useState<TriageResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<TriageResult | null>(null);
  const [filter, setFilter] = useState<EmailCategory | "All">("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Draft state
  const [selectedTone, setSelectedTone] = useState<"direct" | "warm" | "formal">("direct");
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [sentItems, setSentItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTriage();
  }, []);

  const fetchTriage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/triage");
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load triage results");
    } finally {
      setLoading(false);
    }
  };

  const generateDraft = async () => {
    if (!selectedEmail) return;
    setDraftLoading(true);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedEmail.email,
          tone: selectedTone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDraft(data.draft);
        setDraftText(data.draft.draftText);
        toast.success("Draft generated", {
          description: `${selectedTone} tone reply ready`,
        });
      } else {
        toast.error("Failed to generate draft");
      }
    } catch (err) {
      console.error(err);
      toast.error("Draft generation failed");
    } finally {
      setDraftLoading(false);
    }
  };

  const markAsSent = () => {
    if (!selectedEmail) return;
    setSentItems((prev) => new Set(prev).add(selectedEmail.emailId));
    setResults((prev) =>
      prev.map((r) =>
        r.emailId === selectedEmail.emailId ? { ...r, status: "sent" as const } : r
      )
    );
    toast.success("Marked as sent", {
      description: "Reply has been marked as sent",
    });
    setSelectedEmail(null);
    setDraft(null);
    setDraftText("");
  };

  const filteredResults =
    filter === "All" ? results : results.filter((r) => r.category === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Triage Feed</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredResults.length} emails • sorted by priority
          </p>
        </div>

        {/* Filter */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="glass glass-hover"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
          >
            <Filter className="w-3.5 h-3.5 mr-2" />
            {filter}
            <ChevronDown className="w-3 h-3 ml-2" />
          </Button>
          {showFilterMenu && (
            <div className="absolute right-0 top-full mt-1 glass rounded-lg border border-border/50 p-1 z-50 min-w-[140px] shadow-lg">
              {(["All", "Investor", "Customer", "Urgent/Deadline", "Noise"] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setFilter(cat);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left text-xs px-3 py-1.5 rounded-md transition-colors ${
                      filter === cat
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Email Cards */}
      <div className="space-y-2">
        {filteredResults.map((item, i) => {
          const config = CATEGORY_CONFIG[item.category];
          const isSent = sentItems.has(item.emailId);

          return (
            <Card
              key={item.emailId}
              className={`glass glass-hover cursor-pointer transition-all duration-300 animate-in-up ${
                item.priority <= 2 ? config.glow : ""
              } ${isSent ? "opacity-60" : ""}`}
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => {
                setSelectedEmail(item);
                setDraft(null);
                setDraftText("");
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Priority indicator */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}
                  >
                    <span className={`text-xs font-bold ${config.text}`}>
                      P{item.priority}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border ${config.bg} ${config.text} ${config.border}`}
                      >
                        {item.category}
                      </span>
                      {item.deadline && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-[oklch(0.7_0.22_25)]">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(item.deadline).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                      {isSent && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-green-400">
                          <Check className="w-2.5 h-2.5" />
                          Sent
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">
                      {item.email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      From: {item.email.from}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">
                      {item.summary}
                    </p>
                  </div>

                  {/* Action indicator */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    {item.actionRequired && !isSent && (
                      <Badge
                        variant="outline"
                        className="text-[9px] border-[oklch(0.7_0.22_25_/_0.3)] text-[oklch(0.7_0.22_25)]"
                      >
                        Action needed
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.email.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Email Detail Sheet */}
      <Sheet
        open={!!selectedEmail}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEmail(null);
            setDraft(null);
            setDraftText("");
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto glass">
          {selectedEmail && (
            <div className="space-y-6 mt-6">
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <CategoryBadge category={selectedEmail.category} />
                  <Badge variant="outline" className="text-[10px]">
                    Priority {selectedEmail.priority}
                  </Badge>
                </div>
                <SheetTitle className="text-lg mt-2">
                  {selectedEmail.email.subject}
                </SheetTitle>
              </SheetHeader>

              {/* Email Meta */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">From:</span>{" "}
                  {selectedEmail.email.from}
                </p>
                <p>
                  <span className="font-medium text-foreground">Date:</span>{" "}
                  {new Date(selectedEmail.email.date).toLocaleString()}
                </p>
                {selectedEmail.deadline && (
                  <p>
                    <span className="font-medium text-[oklch(0.7_0.22_25)]">
                      Deadline:
                    </span>{" "}
                    {new Date(selectedEmail.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* AI Summary */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium text-primary">
                    AI Summary
                  </span>
                </div>
                <p className="text-xs">{selectedEmail.summary}</p>
              </div>

              {/* Email Body */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email Body
                </h4>
                <div className="p-3 rounded-lg bg-accent/30 text-xs whitespace-pre-wrap leading-relaxed">
                  {selectedEmail.email.body}
                </div>
              </div>

              {/* Draft Section */}
              {selectedEmail.actionRequired && (
                <div className="space-y-3 border-t border-border/50 pt-4">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    Auto-Draft Reply
                  </h4>

                  {/* Tone Selector */}
                  <div className="flex gap-2">
                    {TONES.map((tone) => (
                      <Button
                        key={tone.value}
                        variant={
                          selectedTone === tone.value ? "default" : "outline"
                        }
                        size="sm"
                        className={`text-xs ${
                          selectedTone === tone.value
                            ? ""
                            : "glass"
                        }`}
                        onClick={() => setSelectedTone(tone.value)}
                      >
                        {tone.emoji} {tone.label}
                      </Button>
                    ))}
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={generateDraft}
                    disabled={draftLoading}
                    className="w-full bg-gradient-to-r from-[oklch(0.65_0.15_270)] to-[oklch(0.6_0.2_290)] hover:opacity-90 transition-opacity"
                  >
                    {draftLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate {selectedTone} reply
                  </Button>

                  {/* Draft Editor */}
                  {draft && (
                    <div className="space-y-3 animate-in-up">
                      <Textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        className="min-h-[200px] text-xs bg-accent/30 border-border/50"
                      />
                      <Button
                        onClick={markAsSent}
                        className="w-full"
                        variant="outline"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Mark as Sent
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CategoryBadge({ category }: { category: EmailCategory }) {
  const config = CATEGORY_CONFIG[category];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {category}
    </span>
  );
}
