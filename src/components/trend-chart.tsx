"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendData {
  date: string;
  Investor: number;
  Customer: number;
  "Urgent/Deadline": number;
  Noise: number;
}

const COLORS = {
  Investor: "oklch(0.72 0.2 290)",
  Customer: "oklch(0.7 0.18 230)",
  "Urgent/Deadline": "oklch(0.7 0.22 25)",
  Noise: "oklch(0.45 0.02 250)",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 border border-border/50 shadow-lg">
        <p className="text-xs font-medium text-foreground mb-2">{label}</p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((entry: any) => (
          <div
            key={entry.name}
            className="flex items-center gap-2 text-xs"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function TrendChart({ data }: { data: TrendData[] }) {
  const formattedData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={formattedData}
        margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="oklch(1 0 0 / 0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "oklch(0.6 0 0)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "oklch(0.6 0 0)" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
        />
        <Bar
          dataKey="Investor"
          fill={COLORS.Investor}
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="Customer"
          fill={COLORS.Customer}
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="Urgent/Deadline"
          fill={COLORS["Urgent/Deadline"]}
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="Noise"
          fill={COLORS.Noise}
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
