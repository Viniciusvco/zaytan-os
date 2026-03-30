import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filterGroups?: FilterGroup[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
}

export function ContextFilters({ search, onSearchChange, searchPlaceholder = "Buscar...", filterGroups = [], activeFilters = {}, onFilterChange }: Props) {
  const activeCount = Object.values(activeFilters).filter(v => v !== "all").length;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {filterGroups.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 text-xs">
              <Filter className="h-3.5 w-3.5" />
              Filtros
              {activeCount > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px]">{activeCount}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-3">
              {filterGroups.map((group) => (
                <div key={group.key}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{group.label}</p>
                  <div className="flex flex-wrap gap-1">
                    {group.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => onFilterChange?.(group.key, opt.value)}
                        className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                          (activeFilters[group.key] || "all") === opt.value
                            ? "bg-primary/10 text-primary font-medium"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
