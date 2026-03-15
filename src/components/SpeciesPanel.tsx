import type { PeriodData, Species } from '../data/types'

interface SpeciesPanelProps {
  period: PeriodData
  species: Species | null
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">{label}</p>
      <p className="mt-2 text-sm text-stone-200">{value}</p>
    </div>
  )
}

export function SpeciesPanel({ period, species }: SpeciesPanelProps) {
  return (
    <section className="instrument-panel">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Species fact sheet
          </p>
          <h2 className="mt-2 font-display text-2xl text-stone-50">
            {species ? species.name : `${period.name} dataset pending`}
          </h2>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-stone-300">
          {species ? species.reconstructionConfidence : 'No record selected'}
        </span>
      </div>

      {species ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-white/8 to-white/0 p-5">
              <p className="text-sm leading-7 text-stone-200">{species.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Taxonomy" value={species.taxonomy} />
              <DetailRow label="Habitat" value={species.habitat ?? 'Unknown'} />
              <DetailRow label="Diet" value={species.diet ?? 'Unknown'} />
              <DetailRow
                label="Length"
                value={species.length_cm ? `${species.length_cm} cm` : 'Unknown'}
              />
            </div>
          </div>

          <div className="rounded-[26px] border border-dashed border-white/15 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-stone-500">
              Model viewer hook
            </p>
            <p className="mt-4 text-sm leading-7 text-stone-300">
              The Babylon creature viewer scaffold exists in the workspace and is ready
              to load a GLB once vetted assets are added to the public models folders.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm text-stone-400">
              Model path: {species.modelPath ?? 'Not assigned'}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[26px] border border-dashed border-white/15 bg-black/20 p-5">
            <p className="text-sm leading-7 text-stone-300">
              The panel is live, but no sourced species are loaded yet for {period.name}.
              Add vetted records to the root data files and associated GLB assets under
              the public models directory to activate the full species workflow.
            </p>
          </div>
          <div className="grid gap-3">
            <DetailRow label="Expected records" value="8 to 10 fauna and flora entries" />
            <DetailRow label="Models" value={`GLB assets in /public/models/${period.id}`} />
            <DetailRow
              label="Scientific rule"
              value="Do not publish invented measurements or uncertain reconstructions as facts."
            />
          </div>
        </div>
      )}
    </section>
  )
}