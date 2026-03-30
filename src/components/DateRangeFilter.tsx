import { useState } from "react";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfQuarter } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

const presets = [
  { label: "Hoje", getRange: () => ({ from: new Date(), to: new Date() }) },
  { label: "Últimos 7 dias", getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Este Mês", getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Mês Passado", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "Trimestre", getRange: () => ({ from: startOfQuarter(new Date()), to: new Date() }) },
];

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(value.from);
  const [customTo, setCustomTo] = useState<Date | undefined>(value.to);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 text-xs font-medium">
          <CalendarIcon className="h-3.5 w-3.5" />
          {value.label}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          <div className="border-r border-border p-2 space-y-0.5 min-w-[140px]">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  const r = p.getRange();
                  onChange({ ...r, label: p.label });
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors",
                  value.label === p.label ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => {}}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors",
                value.label === "Personalizado" ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"
              )}
            >
              Personalizado
            </button>
          </div>
          <div className="p-2">
            <Calendar
              mode="range"
              selected={{ from: customFrom, to: customTo }}
              onSelect={(range) => {
                setCustomFrom(range?.from);
                setCustomTo(range?.to);
                if (range?.from && range?.to) {
                  onChange({
                    from: range.from,
                    to: range.to,
                    label: `${format(range.from, "dd MMM", { locale: ptBR })} - ${format(range.to, "dd MMM", { locale: ptBR })}`,
                  });
                  setOpen(false);
                }
              }}
              numberOfMonths={1}
              className="pointer-events-auto"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function useDefaultDateRange(): DateRange {
  return { from: startOfMonth(new Date()), to: new Date(), label: "Este Mês" };
}
