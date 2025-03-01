
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

interface AnalyticsFiltersProps {
  onDateChange: (range: { from: Date; to: Date }) => void;
  onFilterChange: (filters: AnalyticsFilters) => void;
  onExport: () => void;
}

export interface AnalyticsFilters {
  domains: string[];
  categories: string[];
  minProductivity?: number;
}

const presetRanges = [
  { label: "Today", days: 0 },
  { label: "Week", days: 7 },
  { label: "Month", days: 30 },
  { label: "Quarter", days: 90 }
];

const AnalyticsFilters = ({ onDateChange, onFilterChange }: AnalyticsFiltersProps) => {
  const [date, setDate] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [filters, setFilters] = useState<AnalyticsFilters>({
    domains: [],
    categories: [],
    minProductivity: 0
  });

  const handleDateSelect = (range: { from: Date; to: Date }) => {
    setDate(range);
    onDateChange(range);
  };

  const handleFilterChange = (newFilters: Partial<AnalyticsFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handlePresetSelect = (days: number) => {
    const to = new Date();
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    handleDateSelect({ from, to });
  };

  return (
    <div className="space-y-4">
      {/* Date Range Selection */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium">Time Period</h4>
        <div className="flex flex-wrap gap-2">
          {presetRanges.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => handlePresetSelect(preset.days)}
              className="h-7 px-3 text-xs rounded-full"
            >
              {preset.label}
            </Button>
          ))}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-3 text-xs rounded-full">
                <CalendarIcon className="h-3 w-3 mr-1" />
                Custom
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                selected={date}
                onSelect={(range: any) => handleDateSelect(range)}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="text-xs text-muted-foreground pt-1">
          {format(date.from, "MMM d, yyyy")} - {format(date.to, "MMM d, yyyy")}
        </div>
      </div>

      {/* Productivity Filter */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <h4 className="text-xs font-medium">Minimum Productivity</h4>
          <span className="text-xs font-medium">{filters.minProductivity}%</span>
        </div>
        <Slider
          value={[filters.minProductivity || 0]}
          min={0}
          max={100}
          step={5}
          onValueChange={(values) => handleFilterChange({ minProductivity: values[0] })}
          className="py-1"
        />
      </div>

      {/* Active Filters Display */}
      {(filters.domains.length > 0 || filters.categories.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium">Active Filters</h4>
          <div className="flex flex-wrap gap-1.5">
            {filters.domains.map((domain) => (
              <Badge
                key={domain}
                variant="secondary"
                className="text-xs py-0.5 px-2 rounded-full hover:bg-muted/60 cursor-pointer"
                onClick={() =>
                  handleFilterChange({
                    domains: filters.domains.filter((d) => d !== domain),
                  })
                }
              >
                {domain}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {filters.categories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="text-xs py-0.5 px-2 rounded-full hover:bg-muted/60 cursor-pointer"
                onClick={() =>
                  handleFilterChange({
                    categories: filters.categories.filter((c) => c !== category),
                  })
                }
              >
                {category}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsFilters;
