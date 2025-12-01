import { ChangeEvent, FormEvent, ReactNode } from "react";

export interface SearchInputProps {
  value: string | number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  icon?: ReactNode;
  inputProps?: Record<string, unknown>;
  wrapperProps?: Record<string, unknown>;
  showClearButton?: boolean;
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
  placeholder,
  className = "",
  inputClassName = "",
  icon = DefaultIcon,
  inputProps = {},
  wrapperProps = {},
  showClearButton = true,
  clearButtonAriaLabel = "Borrar filtro",
}: SearchInputProps) => {
  // Wrapper dinámico → form si recibe onSubmit, si no solo div
  const Wrapper = (onSubmit ? "form" : "div") as const;

  const {
    className: wrapperClassName = "",
    onSubmit: wrapperOnSubmit,
    ...restWrapperProps
  } = (wrapperProps || {}) as {
    className?: string;
    onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  } & Record<string, unknown>;

  const {
    className: inputClassNameProp = "",
    ...restInputProps
  } = (inputProps || {}) as {
    className?: string;
  } & Record<string, unknown>;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (onSubmit) {
      event.preventDefault();
      onSubmit(event);
    }

    wrapperOnSubmit?.(event);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }

    onChange({ target: { value: "" } } as ChangeEvent<HTMLInputElement>);
  };

  return (
    <Wrapper
      className={["search-input", className, wrapperClassName]
        .filter(Boolean)
        .join(" ")}
      {...(onSubmit && { onSubmit: handleSubmit })}
      {...restWrapperProps}
    >
      <span className="search-input__icon" aria-hidden="true">
        {icon}
      </span>

      <input
        type="search"
        className={[
          "form-control search-input__field",
          inputClassName,
          inputClassNameProp,
        ]
          .filter(Boolean)
          .join(" ")}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...restInputProps}
      />

      {showClearButton && value ? (
        <button
          type="button"
          className="btn search-input__clear"
          onClick={handleClear}
          aria-label={clearButtonAriaLabel}
        >
          ×
        </button>
      ) : null}
    </Wrapper>
  );
};

export default SearchInput;
