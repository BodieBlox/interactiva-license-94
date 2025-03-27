
import * as React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface ChartProps {
  data: any;
  className?: string;
}

export const BarChart = ({ data, className }: ChartProps) => {
  return (
    <ChartContainer config={{}} className={cn("w-full h-full", className)}>
      <RechartsBarChart data={data.labels.map((label: string, i: number) => ({
        name: label,
        value: data.datasets[0].data[i],
      }))}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
        <Bar 
          dataKey="value" 
          fill={data.datasets[0].backgroundColor} 
          name={data.datasets[0].label} 
        />
      </RechartsBarChart>
    </ChartContainer>
  );
};

export const LineChart = ({ data, className }: ChartProps) => {
  return (
    <ChartContainer config={{}} className={cn("w-full h-full", className)}>
      <RechartsLineChart 
        data={data.labels.map((label: string, i: number) => ({
          name: label,
          value: data.datasets[0].data[i],
        }))}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={data.datasets[0].borderColor} 
          fill={data.datasets[0].backgroundColor}
          name={data.datasets[0].label}
        />
      </RechartsLineChart>
    </ChartContainer>
  );
};

export const PieChart = ({ data, className }: ChartProps) => {
  return (
    <ChartContainer config={{}} className={cn("w-full h-full", className)}>
      <RechartsPieChart>
        <Pie
          data={data.labels.map((label: string, i: number) => ({
            name: label,
            value: data.datasets[0].data[i],
          }))}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.labels.map((_: any, index: number) => (
            <Cell key={`cell-${index}`} fill={data.datasets[0].backgroundColor[index]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
      </RechartsPieChart>
    </ChartContainer>
  );
};
