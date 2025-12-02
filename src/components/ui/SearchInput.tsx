import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;

  /** Optional submit handler */
  onSubmit?: () => void;

  /** Optional clear handler */
  onClear?: () => void;

  placeholder?: string;
  className?: string;
  inputClassName?: string;
  icon?: ReactNode;

  /** Extra props forwarded to <input> */
  inputProps?: Record<string, unknown>;

  /** Extra props forwarded to wrapper */
  wrapperProps?: Record<string, unknown>;

  /** Display clear button (default: true) */
  showClearButton?: boolean;

  /** Debounce delay for input changes (ms). If undefined → no debounce. */
  debounceMs?: number;

  /** Aria label for clear button */
  clearButtonAriaLabel?: string;
}

const DefaultIcon = (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    className="search-input__svg"
  >
    <path
      d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SearchInput = ({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder,
  className = "",
  inputClassName = "",
  icon = DefaultIcon,
  inputProps = {},
  wrapperProps = {},
  showClearButton = true,
  debounceMs,
  clearButtonAriaLabel = "Clear search",
}: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [internalValue, setInternalValue] = useState(value);

  // Sync value coming from parent
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounce logic
  useEffect(() => {
    if (debounceMs == null) return;

    const handler = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [debounceMs, internalValue, onChange, value]);

  const triggerOnChange = (val: string) => {
    if (debounceMs != null) {
      setInternalValue(val);
    } else {
      onChange(val);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && onSubmit) {
      event.preventDefault();
      onSubmit();
    }

    if (event.key === "Escape") {
      handleClear();
    }
  };

  const handleClear = () => {
    onClear?.();
    triggerOnChange("");
    setInternalValue("");

    // Keep focus on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.();
  };

  const content = (
    <>
      <span className="search-input__icon" aria-hidden="true">
        {icon}
      </span>

      <input
        ref={inputRef}
        className={[
          "form-control search-input__field",
          inputClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        value={internalValue}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        onChange={(e) => triggerOnChange(e.target.value)}
        {...inputProps}
      />

      {showClearButton && internalValue && (
        <button
          type="button"
          className="search-input__clear"
          aria-label={clearButtonAriaLabel}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClear();
          }}
        >
          ×
        </button>
      )}
    </>
  );

  if (onSubmit) {
    return (
      <form
        className={["search-input", className].filter(Boolean).join(" ")}
        onSubmit={handleSubmit}
        {...wrapperProps}
      >
        {content}
      </form>
    );
  }

  return (
    <div
      className={["search-input", className].filter(Boolean).join(" ")}
      {...wrapperProps}
    >
      {content}
    </div>
  );
};

export default SearchInput;
