import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

type DateFilterType = "day" | "month" | "year" | "range";

// Tema customizado específico para o DateFilter, diferente do TelegramTheme
type DateFilterTheme = {
  textColor?: string;
  hintColor?: string;
  buttonColor?: string;
  accentColor?: string;
};

type DateFilterProps = {
  value: [string | null, string | null];
  onChange: (value: [string | null, string | null]) => void;
  buttonClassName?: string;
  theme?: DateFilterTheme;
};

export function DateFilter({ value, onChange, buttonClassName, theme }: DateFilterProps) {
  const [datePickerStep, setDatePickerStep] = useState<"type" | "selection">("type");
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("range");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [monthYearView, setMonthYearView] = useState<"months" | "years">("months");

  // Array de anos para seleção (5 anos para trás e 5 anos para frente)
  const years = Array.from(
    { length: 11 }, 
    (_, i) => new Date().getFullYear() - 5 + i
  );

  // Função para formatar a exibição do filtro de data
  const getDateFilterDisplay = () => {
    if (value[0] && value[1]) {
      if (new Date(value[0]).toISOString().slice(0, 10) === new Date(value[1]).toISOString().slice(0, 10)) {
        // Exibição para dia único
        return `Dia: ${format(new Date(value[0]), "dd/MM/yyyy", { locale: ptBR })}`;
      } else if (
        value[0].endsWith('-01') && 
        new Date(value[1]).getDate() === new Date(new Date(value[1]).getFullYear(), new Date(value[1]).getMonth() + 1, 0).getDate() &&
        new Date(value[0]).getMonth() === new Date(value[1]).getMonth() &&
        new Date(value[0]).getFullYear() === new Date(value[1]).getFullYear()
      ) {
        // Exibição para mês
        return `Mês: ${format(new Date(value[0]), "MMMM/yyyy", { locale: ptBR })}`;
      } else if (
        value[0].endsWith('-01-01') && value[1].endsWith('-12-31') &&
        new Date(value[0]).getFullYear() === new Date(value[1]).getFullYear()
      ) {
        // Exibição para ano
        return `Ano: ${new Date(value[0]).getFullYear()}`;
      } else {
        // Exibição para período personalizado
        return `${format(new Date(value[0]), "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(value[1]), "dd/MM/yyyy", { locale: ptBR })}`;
      }
    } else if (value[0]) {
      return `A partir de: ${format(new Date(value[0]), "dd/MM/yyyy", { locale: ptBR })}`;
    } else if (value[1]) {
      return `Até: ${format(new Date(value[1]), "dd/MM/yyyy", { locale: ptBR })}`;
    } else {
      return "Período";
    }
  };

  // Estado para controlar a abertura/fechamento do popover
  const [open, setOpen] = useState(false);

  // Manipulador para selecionar um mês em um ano específico
  const handleMonthSelect = (month: number) => {
    const startOfMonth = `${selectedYear}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(selectedYear, month + 1, 0).getDate();
    const endOfMonth = `${selectedYear}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
    
    onChange([startOfMonth, endOfMonth]);
    setDatePickerStep("type");
    setOpen(false); // Fecha o popover após seleção
  };

  // Manipulador para selecionar um ano
  const handleYearSelect = (year: number) => {
    if (dateFilterType === "year") {
      // Se estamos filtrando por ano, aplica o filtro diretamente
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;
      onChange([startOfYear, endOfYear]);
      setDatePickerStep("type");
      setOpen(false); // Fecha o popover após seleção
    } else {
      // Se estamos no modo de seleção de mês, apenas atualiza o ano selecionado
      setSelectedYear(year);
      setMonthYearView("months");
    }
  };

  // Limpar o filtro de data
  const clearDateFilter = () => {
    onChange([null, null]);
    setDatePickerStep("type");
    setOpen(false); // Fecha o popover após limpar
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!value[0] && !value[1]}
          className={`data-[empty=true]:text-muted-foreground w-full justify-start text-left text-xs font-normal ${buttonClassName || ""}`}
          style={{ color: theme?.textColor }}
        >
          <CalendarIcon className="mr-1 h-4 w-4" style={{ color: theme?.hintColor }} />
          {getDateFilterDisplay()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        {datePickerStep === "type" ? (
          <div className="space-y-2">
            <h4 className="font-medium text-sm mb-2" style={{ color: theme?.textColor }}>Como deseja filtrar?</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="h-auto py-3 flex-col items-center justify-center" 
                onClick={() => {
                  setDateFilterType("day");
                  setDatePickerStep("selection");
                }}
              >
                <div className="text-2xl mb-1">📅</div>
                <div className="text-xs font-medium">Por dia</div>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-3 flex-col items-center justify-center" 
                onClick={() => {
                  setDateFilterType("month");
                  setDatePickerStep("selection");
                  setMonthYearView("months");
                  setSelectedYear(new Date().getFullYear());
                }}
              >
                <div className="text-2xl mb-1">📆</div>
                <div className="text-xs font-medium">Por mês</div>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-3 flex-col items-center justify-center" 
                onClick={() => {
                  setDateFilterType("year");
                  setDatePickerStep("selection");
                }}
              >
                <div className="text-2xl mb-1">🗓️</div>
                <div className="text-xs font-medium">Por ano</div>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-3 flex-col items-center justify-center" 
                onClick={() => {
                  setDateFilterType("range");
                  setDatePickerStep("selection");
                }}
              >
                <div className="text-2xl mb-1">⏱️</div>
                <div className="text-xs font-medium">Período</div>
              </Button>
            </div>
            {(value[0] || value[1]) && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2" 
                style={{ color: theme?.hintColor }}
                onClick={clearDateFilter}
              >
                Limpar filtro de data
              </Button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDatePickerStep("type")}
                className="text-xs px-2 h-7"
                style={{ color: theme?.hintColor }}
              >
                &larr; Voltar
              </Button>
              <div className="text-xs font-medium" style={{ color: theme?.textColor }}>
                {dateFilterType === "day" && "Selecione um dia"}
                {dateFilterType === "month" && (
                  monthYearView === "months" 
                    ? `Selecione um mês de ${selectedYear}` 
                    : "Selecione o ano"
                )}
                {dateFilterType === "year" && "Selecione um ano"}
                {dateFilterType === "range" && "Selecione um período"}
              </div>
              {dateFilterType === "month" && monthYearView === "months" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMonthYearView("years")}
                  className="text-xs px-2 h-7"
                >
                  {selectedYear} ▾
                </Button>
              )}
              {dateFilterType === "month" && monthYearView === "years" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {}}
                  className="text-xs px-2 h-7 invisible"
                >
                  &nbsp;
                </Button>
              )}
            </div>

            {dateFilterType === "day" && (
              <Calendar
                mode="single"
                selected={value[0] ? new Date(value[0]) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const formattedDate = date.toISOString().slice(0, 10);
                    onChange([formattedDate, formattedDate]);
                    setDatePickerStep("type");
                    setOpen(false); // Fecha o popover após seleção
                  }
                }}
                initialFocus
                locale={ptBR}
              />
            )}

            {dateFilterType === "month" && monthYearView === "months" && (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(selectedYear, i, 1);
                  const monthName = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
                  
                  const isSelected = value[0]?.startsWith(`${selectedYear}-${String(i + 1).padStart(2, '0')}`);
                  
                  return (                  <Button
                    key={i}
                    variant={isSelected ? "default" : "outline"}
                    className="h-auto py-2 text-center flex-col items-center justify-center"
                    onClick={() => handleMonthSelect(i)}
                    style={isSelected ? { backgroundColor: theme?.accentColor, color: '#fff' } : {}}
                  >
                    <div className="text-xs uppercase font-medium">{monthName}</div>
                  </Button>
                  );
                })}
              </div>
            )}

            {(dateFilterType === "month" && monthYearView === "years" || dateFilterType === "year") && (
              <div className="grid grid-cols-3 gap-2">
                {years.map((year) => {
                  const isSelected = 
                    dateFilterType === "year" 
                      ? value[0]?.startsWith(`${year}-`) 
                      : year === selectedYear;
                  
                  return (                  <Button
                    key={year}
                    variant={isSelected ? "default" : "outline"}
                    className="h-auto py-2 text-center"
                    onClick={() => handleYearSelect(year)}
                    style={isSelected ? { backgroundColor: theme?.accentColor, color: '#fff' } : {}}
                  >
                    <div className="text-sm font-medium">{year}</div>
                  </Button>
                  );
                })}
              </div>
            )}

            {dateFilterType === "range" && (
              <Calendar
                mode="range"
                selected={
                  value[0] || value[1]
                    ? {
                        from: value[0] ? new Date(value[0]) : undefined,
                        to: value[1] ? new Date(value[1]) : undefined,
                      }
                    : undefined
                }
                onSelect={(range) => {
                  if (range && 'from' in range) {
                    onChange([
                      range.from ? range.from.toISOString().slice(0, 10) : null,
                      range.to ? range.to.toISOString().slice(0, 10) : null,
                    ]);
                    if (range.from && range.to) {
                      setDatePickerStep("type");
                      setOpen(false); // Fecha o popover quando um intervalo completo for selecionado
                    }
                  }
                }}
                initialFocus
                locale={ptBR}
              />
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
