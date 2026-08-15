"use client";

import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Deadline {
  emailId: string;
  subject: string;
  deadline: string;
  daysLeft: number;
}

export function DeadlineList({ deadlines }: { deadlines: Deadline[] }) {
  if (deadlines.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <CheckCircle2 className="w-4 h-4 mr-2" />
        <span className="text-sm">No upcoming deadlines</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {deadlines.map((d, i) => (
        <div
          key={d.emailId}
          className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/30 transition-colors animate-in-up"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex-shrink-0 mt-0.5">
            {d.daysLeft <= 1 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.7_0.22_25)]" />
            ) : d.daysLeft <= 3 ? (
              <Clock className="w-3.5 h-3.5 text-[oklch(0.75_0.2_60)]" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{d.subject}</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(d.deadline).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <span
            className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${
              d.daysLeft <= 1
                ? "bg-[oklch(0.7_0.22_25_/_0.15)] text-[oklch(0.7_0.22_25)]"
                : d.daysLeft <= 3
                ? "bg-[oklch(0.75_0.2_60_/_0.15)] text-[oklch(0.75_0.2_60)]"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {d.daysLeft <= 0
              ? "Overdue"
              : d.daysLeft === 1
              ? "Tomorrow"
              : `${d.daysLeft}d left`}
          </span>
        </div>
      ))}
    </div>
  );
}
