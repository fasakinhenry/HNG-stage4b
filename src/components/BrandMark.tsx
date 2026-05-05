interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white font-bold text-sm">
        W
      </div>
      {!compact ? (
        <div>
          <div className="brand-title text-lg font-bold leading-none text-[var(--text)]">WhisperBox</div>
        </div>
      ) : null}
    </div>
  );
}

