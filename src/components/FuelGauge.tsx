interface FuelGaugeProps {
  value: number; // 0–7
  onChange?: (value: number) => void;
  size?: 'sm' | 'lg';
  showLabels?: boolean;
}

const TOTAL_SEGMENTS = 7;

export default function FuelGauge({
  value,
  onChange,
  size = 'lg',
  showLabels = true,
}: FuelGaugeProps) {
  const isInteractive = onChange !== undefined;
  const segments = Array.from({ length: TOTAL_SEGMENTS }, (_, i) => i + 1);

  const segHeight = size === 'lg' ? 'h-8' : 'h-4';
  const segWidth = size === 'lg' ? 'flex-1 min-w-[28px]' : 'flex-1 min-w-[10px]';
  const gap = size === 'lg' ? 'gap-1' : 'gap-0.5';
  const rounded = size === 'lg' ? 'rounded-md' : 'rounded-sm';

  function getSegColor(idx: number): string {
    const isActive = idx <= value;
    if (idx === 1) {
      return isActive
        ? 'bg-red-500 ring-red-500/30'
        : 'bg-slate-200 ring-slate-200';
    }
    if (idx <= 4) {
      return isActive
        ? 'bg-blue-500 ring-blue-500/30'
        : 'bg-slate-200 ring-slate-200';
    }
    return isActive
      ? 'bg-green-500 ring-green-500/30'
      : 'bg-slate-200 ring-slate-200';
  }

  return (
    <div className="select-none">
      {showLabels && (
        <div className={`mb-1 flex items-center justify-between text-xs font-semibold ${size === 'lg' ? 'text-sm' : 'text-[10px]'}`}>
          <span className="text-red-600">E</span>
          <span className="text-slate-500">
            {value > 0 ? `${value}/${TOTAL_SEGMENTS}` : 'Kosong'}
          </span>
          <span className="text-green-600">F</span>
        </div>
      )}
      <div className={`flex items-center ${gap}`}>
        {segments.map((seg) => (
          <button
            key={seg}
            type={isInteractive ? 'button' : undefined}
            disabled={!isInteractive}
            onClick={isInteractive ? () => onChange!(seg) : undefined}
            className={`${segWidth} ${segHeight} ${rounded} ${getSegColor(seg)} ring-1 transition-all duration-150 ${
              isInteractive
                ? 'cursor-pointer hover:scale-110 hover:brightness-110 active:scale-95'
                : 'cursor-default'
            }`}
            aria-label={`${seg} bar`}
            title={isInteractive ? `Pilih ${seg} bar` : undefined}
          />
        ))}
      </div>
      {isInteractive && size === 'lg' && (
        <button
          type="button"
          onClick={() => onChange!(0)}
          className={`mt-2 rounded-lg px-3 py-1 text-xs font-medium transition ${
            value === 0
              ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tangki Kosong (0 bar)
        </button>
      )}
    </div>
  );
}
