import type { CardInfo } from "../types";

interface Props {
  card: CardInfo;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  selected?: boolean;
  label?: string;
  highlighted?: boolean;
  animate?: boolean;
}

export function CardDisplay({
  card,
  faceDown = false,
  size = "md",
  onClick,
  selected = false,
  label,
  highlighted = false,
  animate = false,
}: Props) {
  const sizeClasses = {
    sm: "w-11 h-16 text-base rounded-lg",
    md: "w-16 h-24 text-2xl rounded-xl",
    lg: "w-20 h-30 text-3xl rounded-2xl",
  };

  const baseClasses = `${sizeClasses[size]} flex flex-col items-center justify-center font-black transition-all duration-300 border-3 shadow-md ${animate ? "animate-scale-in" : ""}`;

  if (faceDown) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={`${baseClasses} bg-[var(--oink-dark)] border-[var(--oink-dark)] text-[var(--oink-gray)] ${
            onClick ? "cursor-pointer hover:scale-105 hover:shadow-lg hover:border-[var(--oink-orange)] active:scale-95" : ""
          } ${selected ? "border-[var(--oink-orange)] ring-3 ring-[var(--oink-orange)]/30 scale-105" : ""}`}
          onClick={onClick}
        >
          <span className="opacity-40">?</span>
        </div>
        {label && <span className="text-xs text-[var(--oink-gray)] font-medium">{label}</span>}
      </div>
    );
  }

  const isBlank = card.card_type === "blank";
  const display = isBlank ? "x" : card.value;

  const getCardStyle = () => {
    if (isBlank) return "bg-[var(--oink-light-gray)] border-[var(--oink-light-gray)] text-[var(--oink-gray)]";
    if (card.value === 5) return "bg-[var(--oink-red)] border-[var(--oink-red)] text-white";
    return "bg-white border-[var(--oink-light-gray)] text-[var(--oink-dark)]";
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`${baseClasses} ${getCardStyle()} ${
          onClick ? "cursor-pointer hover:scale-105 hover:shadow-lg active:scale-95" : ""
        } ${selected ? "border-[var(--oink-orange)] ring-3 ring-[var(--oink-orange)]/30 scale-105" : ""} ${
          highlighted ? "border-[var(--oink-yellow)] ring-3 ring-[var(--oink-yellow)]/30" : ""
        }`}
        onClick={onClick}
      >
        <span>{display}</span>
      </div>
      {label && (
        <span className={`text-xs font-medium ${highlighted ? "text-[var(--oink-red)] font-bold" : "text-[var(--oink-gray)]"}`}>
          {label}
        </span>
      )}
    </div>
  );
}
