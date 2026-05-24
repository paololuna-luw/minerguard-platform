type BrandLogoProps = {
  compact?: boolean;
};

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border border-[#d8dee4] bg-white shadow-sm">
        <svg viewBox="0 0 96 96" className="h-10 w-10" aria-hidden="true">
          <path
            d="M10 76 18 47 36 24 47 35 58 25 77 49 86 76H61L56 61H39L34 76H10Z"
            fill="#172f36"
          />
          <path
            d="M30 76 34 48 42 40H54L63 51 66 76H55L52 58H44L41 76H30Z"
            fill="#ffffff"
          />
          <path d="M37 82h28L56 68H46L37 82Z" fill="#263d44" />
          <path d="M32 86h38" stroke="#9aa8b0" strokeLinecap="round" strokeWidth="4" />
          <path d="M38 78h26" stroke="#9aa8b0" strokeLinecap="round" strokeWidth="4" />
          <path d="M42 70h18" stroke="#9aa8b0" strokeLinecap="round" strokeWidth="4" />
          <path
            d="M45 60c-3-4-6-8-6-13a9 9 0 0 1 18 0c0 5-3 9-6 13l-3 4-3-4Z"
            fill="#8bbf9f"
          />
          <circle cx="48" cy="47" r="4.5" fill="#172f36" />
          <circle cx="48" cy="22" r="6" fill="#3f8b79" />
          <path
            d="M28 16c11-12 29-12 40 0"
            fill="none"
            stroke="#3f8b79"
            strokeLinecap="round"
            strokeWidth="7"
          />
          <path
            d="M36 25c7-8 17-8 24 0"
            fill="none"
            stroke="#7db28e"
            strokeLinecap="round"
            strokeWidth="7"
          />
          <circle cx="73" cy="65" r="15" fill="#ffffff" stroke="#7db28e" strokeWidth="5" />
          <path
            d="M61 66h6l3-9 5 18 4-15 3 6h5"
            fill="none"
            stroke="#7db28e"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
        </svg>
      </div>
      {!compact ? (
        <div>
          <p className="text-lg font-semibold leading-none text-[#172026]">MinerGuard</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#52616b]">Safety Monitor</p>
        </div>
      ) : null}
    </div>
  );
}
