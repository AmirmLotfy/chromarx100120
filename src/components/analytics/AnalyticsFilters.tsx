
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Filter, Download, X } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 }
];

const AnalyticsFilters = ({ onDateChange, onFilterChange, onExport }: AnalyticsFiltersProps) => {
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
  });
  const [isOpen, setIsOpen] = useState(false);

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
      <div className="flex flex-wrap gap-2">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Analytics Filters</SheetTitle>
              <SheetDescription>
                Customize your analytics view
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-200px)] mt-4">
              <div className="space-y-4 pr-4">
                {/* Date Range Selection */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Date Range</h4>
                  <div className="flex flex-wrap gap-2">
                    {presetRanges.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        onClick={() => handlePresetSelect(preset.days)}
                        className="h-8"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {date.from ? (
                          <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          <span>Pick a date range</span>
                        )}
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

                {/* Productivity Filter */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Minimum Productivity Score</h4>
                  <Select
                    value={filters.minProductivity?.toString()}
                    onValueChange={(value) =>
                      handleFilterChange({ minProductivity: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select minimum score" />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 25, 50, 75].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Active Filters Display */}
                {(filters.domains.length > 0 ||
                  filters.categories.length > 0 ||
                  filters.minProductivity) && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Active Filters</h4>
                    <div className="flex flex-wrap gap-2">
                      {filters.domains.map((domain) => (
                        <Badge
                          key={domain}
                          variant="secondary"
                          className="cursor-pointer"
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
                          className="cursor-pointer"
                          onClick={() =>
                            handleFilterChange({
                              categories: filters.categories.filter(
                                (c) => c !== category
                              ),
                            })
                          }
                        >
                          {category}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                      {filters.minProductivity && (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() =>
                            handleFilterChange({ minProductivity: undefined })
                          }
                        >
                          Min: {filters.minProductivity}%
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={onExport}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
};

export default AnalyticsFilters;
