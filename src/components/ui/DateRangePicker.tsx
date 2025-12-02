import { useEffect, useMemo, useState } from "react";
import "./date-range-picker.css";

export type DateGranularity = "day" | "month" | "year";

export interface DateRangePickerProps {
  /** Nivel de detalle para el selector de fecha */
  granularity?: DateGranularity;
  /** Llave usada para la fecha de inicio en el objeto de respuesta */
  startKey?: string;
  /** Llave usada para la fecha de fin en el objeto de respuesta */
  endKey?: string;
  /** Valores controlados desde el exterior */
  value?: Record<string, string | null>;
  /** Valores iniciales cuando no se usa modo controlado */
  defaultValue?: Record<string, string | null>;
  /** Notifica cambios en las fechas seleccionadas */
  onChange?: (range: Record<string, string | null>) => void;
  /** Etiqueta visible para la fecha de inicio */
  startLabel?: string;
  /** Etiqueta visible para la fecha de fin */
  endLabel?: string;
  className?: string;
  helperText?: string;
}

const labelByGranularity: Record<DateGranularity, string> = {
  day: "Selecciona días",
  month: "Selecciona meses",
  year: "Selecciona años",
};

function resolveRange(
  startKey: string,
  endKey: string,
  source?: Record<string, string | null>,
) {
  return {
    [startKey]: source?.[startKey] ?? null,
    [endKey]: source?.[endKey] ?? null,
  } satisfies Record<string, string | null>;
}

export function DateRangePicker({
  granularity = "day",
  startKey = "startDate",
  endKey = "endDate",
  value,
  defaultValue,
  onChange,
  startLabel = "Fecha de inicio",
  endLabel = "Fecha de fin",
  className = "",
  helperText,
}: DateRangePickerProps) {
  const [range, setRange] = useState<Record<string, string | null>>(() =>
    resolveRange(startKey, endKey, value ?? defaultValue),
  );

  useEffect(() => {
    if (value) {
      setRange(resolveRange(startKey, endKey, value));
    }
  }, [value, startKey, endKey]);

  const inputConfig = useMemo(() => {
    if (granularity === "month") {
      return { type: "month", placeholder: "AAAA-MM" } as const;
    }

    if (granularity === "year") {
      return { type: "number", placeholder: "AAAA", min: 1900, max: 2100 } as const;
    }

    return { type: "date", placeholder: "AAAA-MM-DD" } as const;
  }, [granularity]);

  const handleChange = (key: string, rawValue: string) => {
    const parsedValue = rawValue.trim() === "" ? null : rawValue;
    const nextRange = {
      ...resolveRange(startKey, endKey, range),
      [key]: parsedValue,
    } satisfies Record<string, string | null>;

    setRange(nextRange);
    onChange?.(nextRange);
  };

  const startValue = range[startKey] ?? "";
  const endValue = range[endKey] ?? "";

  return (
    <section className={["date-range-picker", className].filter(Boolean).join(" ")}>
      <header className="date-range-picker__header">
        <div className="date-range-picker__title">Rango de fechas</div>
        <span className="date-range-picker__granularity">{labelByGranularity[granularity]}</span>
      </header>

      <div className="date-range-picker__fields">
        <label className="date-range-picker__field">
          <span className="date-range-picker__label">{startLabel}</span>
          <input
            {...inputConfig}
            value={startValue}
            className="date-range-picker__input"
            onChange={(event) => handleChange(startKey, event.target.value)}
          />
        </label>

        <label className="date-range-picker__field">
          <span className="date-range-picker__label">{endLabel}</span>
          <input
            {...inputConfig}
            value={endValue}
            className="date-range-picker__input"
            onChange={(event) => handleChange(endKey, event.target.value)}
          />
        </label>
      </div>

      {helperText ? <p className="date-range-picker__helper">{helperText}</p> : null}
    </section>
  );
}
