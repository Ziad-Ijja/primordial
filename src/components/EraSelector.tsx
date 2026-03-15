import type { PeriodData } from '../data/types'

interface EraSelectorProps {
  periods: PeriodData[]
  selectedPeriodId: string
  onSelect: (periodId: string) => void
}

export function EraSelector({
  periods,
  selectedPeriodId,
  onSelect,
}: EraSelectorProps) {
  return (
    <section className="instrument-panel">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
          Era selector
        </p>
        <h2 className="mt-2 font-display text-2xl text-stone-50">V1 periods</h2>
      </div>

      <div className="grid gap-3">
        {periods.map((period) => {
          const isActive = period.id === selectedPeriodId

          return (
            <button
              key={period.id}
              type="button"
              onClick={() => onSelect(period.id)}
              className={[
                'rounded-2xl border px-4 py-4 text-left transition',
                isActive
                  ? 'border-amber-300/50 bg-amber-300/10 shadow-[0_0_0_1px_rgba(251,191,36,0.2)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl text-stone-50">{period.name}</p>
                  <p className="mt-1 text-sm text-stone-400">{period.dateRange}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-stone-400">
                  {period.dataState}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                {period.description}
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}