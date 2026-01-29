import type { MouseEventHandler } from "react";

interface BuildStudentDetailsLabelArgs {
  gradeGroup?: string;
  scholarLevel?: string;
  enrollment?: string;
}

const buildStudentDetailsLabel = ({
  gradeGroup,
  scholarLevel,
  enrollment,
}: BuildStudentDetailsLabelArgs): string => {
  const details: string[] = [];

  if (gradeGroup) details.push(`Grupo: ${gradeGroup}`);
  if (scholarLevel) details.push(`Nivel: ${scholarLevel}`);
  if (enrollment) details.push(`Matrícula: ${enrollment}`);

  return details.join(" · ");
};

const getInitials = (value?: string): string => {
  if (!value || typeof value !== "string") return "";

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
};

// Props comunes que se pueden aplicar tanto a <button> como a <a>
interface NameButtonProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export interface StudentTableCellProps {
  name?: string;
  fallbackName?: string;

  gradeGroup?: string;
  scholarLevel?: string;
  enrollment?: string;

  // Un solo onClick que sirve para <button> y <a>
  onClick?: MouseEventHandler<HTMLElement>;
  href?: string;

  disabled?: boolean;
  className?: string;

  avatarText?: string;
  avatarFallback?: string;

  metaLabel?: string;

  nameButtonProps?: NameButtonProps;
}

const StudentTableCell = ({
  name,
  fallbackName = "—",
  gradeGroup,
  scholarLevel,
  enrollment,
  onClick,
  href,
  disabled = false,
  className = "",
  avatarText,
  avatarFallback,
  metaLabel,
  nameButtonProps = {},
}: StudentTableCellProps) => {
  const metaValue = buildStudentDetailsLabel({
    gradeGroup,
    scholarLevel,
    enrollment,
  });

  const hasName = typeof name === "string" && name.trim() !== "";
  const displayName = hasName ? name!.trim() : fallbackName;
  const computedInitials = getInitials(hasName ? name : "");
  const avatarContent = (avatarText ?? computedInitials) || avatarFallback;

  const wrapperClassName = ["table__student-wrapper text-start", className]
    .filter(Boolean)
    .join(" ");

  const {
    className: ignoredClassName,
    type,
    disabled: customDisabled,
    ...restButtonProps
  } = nameButtonProps;

  const buttonClassName = ["table__student-button", ignoredClassName]
    .filter(Boolean)
    .join(" ");

  const isButtonDisabled = customDisabled ?? disabled;
  const linkHref =
    typeof href === "string" && href.trim() ? href.trim() : undefined;

  const renderMeta = () => {
    if (!metaValue) return null;

    if (metaLabel) {
      return (
        <span className="table__student-meta">
          {metaLabel} <strong>{metaValue}</strong>
        </span>
      );
    }

    return <span className="table__student-meta">{metaValue}</span>;
  };

  const interactive = typeof onClick === "function" || linkHref;

  // Handler específico para el anchor, tipado correctamente
  const handleLinkClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (isButtonDisabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event as unknown as React.MouseEvent<HTMLElement>);
  };

  if (interactive) {
    return (
      <div className={["d-flex gap-2", wrapperClassName].filter(Boolean).join(" ")}>
        <span className="avatar-circle" aria-hidden="true">
          {avatarContent}
        </span>

        <div className="d-flex flex-column justify-content-center">
          {linkHref ? (
            <a
              href={linkHref}
              className={['btn d-flex text-start p-0 gap-3 text-uppercase', buttonClassName].filter(Boolean).join(" ")}
              aria-disabled={isButtonDisabled}
              onClick={handleLinkClick}
              {...restButtonProps}
            >
              {displayName}
            </a>
          ) : (
            <button
              type={type ?? "button"}
              className={['btn d-flex text-start p-0 gap-3 text-uppercase', buttonClassName].filter(Boolean).join(" ")}
              disabled={isButtonDisabled}
              onClick={
                onClick as unknown as React.MouseEventHandler<HTMLButtonElement>
              }
              {...restButtonProps}
            >
              {displayName}
            </button>
          )}

          {renderMeta()}
        </div>
      </div>
    );
  }

  // Versión no interactiva
  return (
    <div className={["d-flex align-items-center gap-3", wrapperClassName].filter(Boolean).join(" ")}>
      <div className="avatar-circle">{avatarContent}</div>

      <div className="d-flex flex-column">
        <span className="fw-semibold text-black">{displayName}</span>
        {renderMeta()}
      </div>
    </div>
  );
};

export default StudentTableCell;
