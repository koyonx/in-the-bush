import type { CardInfo } from "../types";

interface Props {
  card: CardInfo;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  selected?: boolean;
  label?: string;
}

export function CardDisplay({
  card,
  faceDown = false,
  size = "md",
  onClick,
  selected = false,
  label,
}: Props) {
  const sizeClasses = {
    sm: "w-12 h-16 text-lg",
    md: "w-16 h-22 text-2xl",
    lg: "w-20 h-28 text-3xl",
  };

  const baseClasses = `${sizeClasses[size]} rounded-lg flex flex-col items-center justify-center font-bold transition-all border-2`;

  if (faceDown) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className={`${baseClasses} bg-indigo-900 border-indigo-700 ${onClick ? "cursor-pointer hover:border-amber-400" : ""} ${selected ? "border-amber-400 ring-2 ring-amber-400/50" : ""}`}
          onClick={onClick}
        >
          <span className="text-indigo-400">?</span>
        </div>
        {label && <span className="text-xs text-gray-400">{label}</span>}
      </div>
    );
  }

  const isBlank = card.card_type === "blank";
  const display = isBlank ? "×" : card.value;
  const colorClasses = isBlank
    ? "bg-gray-700 border-gray-500 text-gray-300"
    : card.value === 5
      ? "bg-red-900/80 border-red-500 text-red-300"
      : "bg-gray-800 border-gray-500 text-white";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${baseClasses} ${colorClasses} ${onClick ? "cursor-pointer hover:border-amber-400" : ""} ${selected ? "border-amber-400 ring-2 ring-amber-400/50" : ""}`}
        onClick={onClick}
      >
        <span>{display}</span>
      </div>
      {label && <span className="text-xs text-gray-400">{label}</span>}
    </div>
  );
}
