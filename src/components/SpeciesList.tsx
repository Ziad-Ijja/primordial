import type { PeriodData } from '../data/types'

interface SpeciesListProps {
  period: PeriodData
  selectedSpeciesId: string | null
  onSelect: (speciesId: string | null) => void
}

export function SpeciesList({
  period,
  selectedSpeciesId,
  onSelect,
}: SpeciesListProps) {
  return (
    <section className="instrument-panel">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Species browser
          </p>
          <h2 className="mt-2 font-display text-2xl text-stone-50">Species</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-stone-300">
          {period.species.length} loaded
        </span>
      </div>

      {period.species.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-black/15 px-4 py-5 text-sm leading-6 text-stone-300">
          No species records are bundled yet for {period.name}. This panel is ready
          for sourced fauna and flora entries once the dataset is prepared.
        </div>
      ) : (
        <div className="grid gap-3">
          {period.species.map((species) => {
            const isActive = species.id === selectedSpeciesId

            return (
              <button
                key={species.id}
                type="button"
                onClick={() => onSelect(species.id)}
                className={[
                  'rounded-2xl border px-4 py-4 text-left transition',
                  isActive
                    ? 'border-cyan-300/45 bg-cyan-400/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-lg text-stone-100">{species.name}</p>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-stone-400">
                    {species.type}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-400">{species.taxonomy}</p>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}