import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./date-range-picker.css";
import { formatDate } from "../../utils/formatDate";

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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const inputConfig = useMemo(() => {
    if (granularity === "month") {
      return { type: "month", placeholder: "AAAA-MM" } as const;
    }

    if (granularity === "year") {
      return { type: "number", placeholder: "AAAA", min: 1900, max: 2100 } as const;
    }

    return { type: "date", placeholder: "AAAA-MM-DD" } as const;
  }, [granularity]);

  const controlledRange = useMemo(
    () => (value ? resolveRange(startKey, endKey, value) : null),
    [endKey, startKey, value],
  );

  const currentRange = controlledRange ?? range;

  const handleChange = (key: string, rawValue: string) => {
    const parsedValue = rawValue.trim() === "" ? null : rawValue;
    const nextRange = {
      ...resolveRange(startKey, endKey, currentRange),
      [key]: parsedValue,
    } satisfies Record<string, string | null>;

    if (!value) {
      setRange(nextRange);
    }
    onChange?.(nextRange);
  };

  const startValue = currentRange[startKey] ?? "";
  const endValue = currentRange[endKey] ?? "";

  const formatDisplayValue = useCallback(
    (value: string | null) => {
      if (!value) return "";

      if (granularity === "month") {
        return formatDate(value, "es-ES", { year: "numeric", month: "long" });
      }

      if (granularity === "year") {
        return formatDate(`${value}-01-01`, "es-ES", { year: "numeric" });
      }

      return value;
    },
    [granularity],
  );

  const clearRange = () => {
    const emptyRange = resolveRange(startKey, endKey, { [startKey]: null, [endKey]: null });

    if (!value) {
      setRange(emptyRange);
    }

    onChange?.(emptyRange);
  };

  const displayLabel = useMemo(() => {
    const formattedStart = formatDisplayValue(startValue);
    const formattedEnd = formatDisplayValue(endValue);

    if (formattedStart && formattedEnd) {
      return `${formattedStart} - ${formattedEnd}`;
    }

    if (formattedStart) {
      return `${formattedStart} →`;
    }

    if (formattedEnd) {
      return `← ${formattedEnd}`;
    }

    return "Selecciona un rango";
  }, [formatDisplayValue, startValue, endValue]);

  return (
    <div className={["date-range-picker__container", className].filter(Boolean).join(" ")} ref={containerRef}>
      <button
        type="button"
        className="date-range-picker__toggle"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div
          className="date-range-picker__clear"
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            clearRange();
          }}
          aria-label="Limpiar rango"
        >
          <span aria-hidden="true">×</span>
        </div>
        <div className="date-range-picker__toggle-content">
          <div className="date-range-picker__toggle-label">
            <span className="date-range-picker__title">Rango de fechas</span>
            <span className="date-range-picker__granularity">{labelByGranularity[granularity]}</span>
          </div>
          <span className="date-range-picker__toggle-value">{displayLabel}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`date-range-picker__chevron${isOpen ? " date-range-picker__chevron--open" : ""}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.086l3.71-3.855a.75.75 0 1 1 1.08 1.04l-4.24 4.4a.75.75 0 0 1-1.08 0l-4.24-4.4a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen ? (
        <section className="date-range-picker" role="dialog" aria-label="Selector de rango de fechas">
          <div className="date-range-picker__actions">
            <button type="button" className="date-range-picker__clear-button" onClick={clearRange}>
              Borrar filtro
            </button>
          </div>
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
      ) : null}
    </div>
  );
}
