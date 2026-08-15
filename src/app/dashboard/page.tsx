"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  TrendingUp,
  Users,
  Mail,
  Clock,
  Zap,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TriageResult, DashboardStats, EmailCategory } from "@/lib/types";
import { TrendChart } from "@/components/trend-chart";
import { DeadlineList } from "@/components/deadline-list";
import { toast } from "sonner";

function computeStats(results: TriageResult[]): DashboardStats {
  const openLoops = results.filter(
    (r) => r.status === "open" && r.actionRequired
  ).length;

  const categoryCount = (cat: EmailCategory) =>
    results.filter((r) => r.category === cat).length;

  // Compute deadlines
  const now = new Date();
  const deadlines = results
    .filter((r) => r.deadline)
    .map((r) => {
      const deadlineDate = new Date(r.deadline!);
      const daysLeft = Math.ceil(
        (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        emailId: r.emailId,
        subject: r.email.subject,
        deadline: r.deadline!,
        daysLeft,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Compute category trends by date
  const dateMap = new Map<
    string,
    { Investor: number; Customer: number; "Urgent/Deadline": number; Noise: number }
  >();

  results.forEach((r) => {
    const date = new Date(r.email.date).toISOString().split("T")[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, { Investor: 0, Customer: 0, "Urgent/Deadline": 0, Noise: 0 });
    }
    const entry = dateMap.get(date)!;
    entry[r.category]++;
  });

  const categoryTrends = Array.from(dateMap.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalEmails: results.length,
    openLoops,
    urgentCount: categoryCount("Urgent/Deadline"),
    investorCount: categoryCount("Investor"),
    customerCount: categoryCount("Customer"),
    noiseCount: categoryCount("Noise"),
    deadlines,
    categoryTrends,
  };
}

const statCards = [
  {
    key: "openLoops" as const,
    label: "Open Loops",
    icon: Zap,
    color: "text-[oklch(0.7_0.22_25)]",
    bgColor: "bg-[oklch(0.7_0.22_25_/_0.1)]",
    borderColor: "border-[oklch(0.7_0.22_25_/_0.2)]",
  },
  {
    key: "investorCount" as const,
    label: "Investor",
    icon: TrendingUp,
    color: "text-[oklch(0.72_0.2_290)]",
    bgColor: "bg-[oklch(0.72_0.2_290_/_0.1)]",
    borderColor: "border-[oklch(0.72_0.2_290_/_0.2)]",
  },
  {
    key: "customerCount" as const,
    label: "Customer",
    icon: Users,
    color: "text-[oklch(0.7_0.18_230)]",
    bgColor: "bg-[oklch(0.7_0.18_230_/_0.1)]",
    borderColor: "border-[oklch(0.7_0.18_230_/_0.2)]",
  },
  {
    key: "urgentCount" as const,
    label: "Urgent",
    icon: AlertTriangle,
    color: "text-[oklch(0.7_0.22_25)]",
    bgColor: "bg-[oklch(0.7_0.22_25_/_0.1)]",
    borderColor: "border-[oklch(0.7_0.22_25_/_0.2)]",
  },
  {
    key: "totalEmails" as const,
    label: "Total Emails",
    icon: Mail,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-border/50",
  },
];

export default function DashboardPage() {
  const [results, setResults] = useState<TriageResult[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTriage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/triage");
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setStats(computeStats(data.results));
        toast.success("Inbox triaged successfully", {
          description: `${data.results.length} emails classified`,
        });
      } else {
        toast.error("Failed to triage emails");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to triage agent");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriage();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[oklch(0.75_0.15_270)] to-[oklch(0.65_0.2_290)] flex items-center justify-center animate-pulse-slow">
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Triaging your inbox...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              AI agents are classifying and prioritizing emails
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI chief-of-staff has triaged{" "}
            <span className="font-medium text-foreground">
              {stats?.totalEmails}
            </span>{" "}
            emails
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTriage}
          className="glass glass-hover"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Re-triage
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats &&
          statCards.map((card, i) => (
            <Card
              key={card.key}
              className={`glass glass-hover ${card.borderColor} animate-in-up`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 rounded-lg ${card.bgColor} flex items-center justify-center`}
                  >
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <span className="text-2xl font-bold">
                    {stats[card.key]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {card.label}
                </p>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Charts + Deadlines Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="glass lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Email Volume by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && <TrendChart data={stats.categoryTrends} />}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-[oklch(0.7_0.22_25)]" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && <DeadlineList deadlines={stats.deadlines} />}
          </CardContent>
        </Card>
      </div>

      {/* Recent Priority Items */}
      <Card className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-[oklch(0.7_0.22_25)]" />
            High Priority Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {results
              .filter((r) => r.priority <= 2)
              .slice(0, 5)
              .map((item, i) => (
                <div
                  key={item.emailId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors animate-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex-shrink-0">
                    <CategoryBadge category={item.category} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.summary}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="flex-shrink-0 text-[10px]"
                  >
                    P{item.priority}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryBadge({ category }: { category: EmailCategory }) {
  const config = {
    Investor: {
      bg: "bg-[oklch(0.72_0.2_290_/_0.15)]",
      text: "text-[oklch(0.72_0.2_290)]",
      border: "border-[oklch(0.72_0.2_290_/_0.3)]",
    },
    Customer: {
      bg: "bg-[oklch(0.7_0.18_230_/_0.15)]",
      text: "text-[oklch(0.7_0.18_230)]",
      border: "border-[oklch(0.7_0.18_230_/_0.3)]",
    },
    "Urgent/Deadline": {
      bg: "bg-[oklch(0.7_0.22_25_/_0.15)]",
      text: "text-[oklch(0.7_0.22_25)]",
      border: "border-[oklch(0.7_0.22_25_/_0.3)]",
    },
    Noise: {
      bg: "bg-muted/50",
      text: "text-muted-foreground",
      border: "border-border/50",
    },
  };

  const c = config[category];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${c.bg} ${c.text} ${c.border}`}
    >
      {category}
    </span>
  );
}
