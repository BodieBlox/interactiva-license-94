
// Re-export chart components from charts.tsx
export { BarChart, LineChart, PieChart } from './charts';

// Define our own chart container and tooltip components instead of importing from Radix
export const ChartContainer = ({ children, className, config, ...props }: React.HTMLAttributes<HTMLDivElement> & { config?: any }) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

export const ChartTooltipContent = (props: any) => {
  const { active, payload, label } = props;
  
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded shadow-md p-2 text-sm">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  
  return null;
};

export const ChartLegendContent = (props: any) => {
  const { payload } = props;
  
  return (
    <ul className="flex flex-wrap gap-4 justify-center mt-2">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center gap-1">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};
