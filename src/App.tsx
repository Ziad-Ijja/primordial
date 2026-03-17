import { useState } from 'react'
import { Globe } from './components/Globe'
import { periods } from './data/periods'

function App() {
  const [selectedPeriodId, setSelectedPeriodId] = useState(periods[0]?.id ?? '')
  const [cloudsVisible, setCloudsVisible] = useState(true)
  const [rotationEnabled, setRotationEnabled] = useState(true)
  const selectedPeriod =
    periods.find((period) => period.id === selectedPeriodId) ?? periods[0]
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(
    selectedPeriod?.species[0]?.id ?? null,
  )

  const selectedSpecies =
    selectedPeriod?.species.find((species) => species.id === selectedSpeciesId) ??
    selectedPeriod?.species[0] ??
    null

  const handlePeriodSelect = (periodId: string) => {
    const nextPeriod = periods.find((period) => period.id === periodId)
    setSelectedPeriodId(periodId)
    setSelectedSpeciesId(nextPeriod?.species[0]?.id ?? null)
  }

  if (!selectedPeriod) {
    return null
  }

  const metricRows = [
    {
      label: 'O2',
      value:
        selectedPeriod.atmosphere.o2Percent === null
          ? 'Pending'
          : `${selectedPeriod.atmosphere.o2Percent}%`,
    },
    {
      label: 'CO2',
      value:
        selectedPeriod.atmosphere.co2Ppm === null
          ? 'Pending'
          : `${selectedPeriod.atmosphere.co2Ppm} ppm`,
    },
    {
      label: 'Temp',
      value:
        selectedPeriod.atmosphere.avgTempCelsius === null
          ? 'Pending'
          : `${selectedPeriod.atmosphere.avgTempCelsius} C`,
    },
    {
      label: 'Pressure',
      value:
        selectedPeriod.atmosphere.pressureAtm === null
          ? 'Pending'
          : `${selectedPeriod.atmosphere.pressureAtm} atm`,
    },
  ]

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#02060d] text-stone-100">
      <div className="pointer-events-none absolute inset-0 space-bg" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(136,174,255,0.22),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(0,0,0,0.5),transparent_55%)]" />

      <Globe
        period={selectedPeriod}
        immersive
        className="absolute inset-0"
        cloudsVisible={cloudsVisible}
        rotationEnabled={rotationEnabled}
      />

      <aside className="absolute left-3 top-3 z-30 hidden h-[calc(100vh-24px)] w-[56px] flex-col items-center gap-3 rounded-2xl border border-white/15 bg-black/35 px-2 py-3 backdrop-blur md:flex">
        <button type="button" className="map-btn" aria-label="Menu">
          <span className="block h-[2px] w-4 bg-white/90" />
          <span className="mt-1 block h-[2px] w-4 bg-white/90" />
          <span className="mt-1 block h-[2px] w-4 bg-white/90" />
        </button>
        <button type="button" className="map-btn" aria-label="Search">
          <span className="h-3.5 w-3.5 rounded-full border border-white/90" />
          <span className="-mt-[1px] ml-3 block h-2 w-[2px] -rotate-45 bg-white/90" />
        </button>
        <button type="button" className="map-btn" aria-label="Layers">
          <span className="block h-[2px] w-4 bg-white/90" />
          <span className="mt-1 block h-[2px] w-4 bg-white/90" />
        </button>
      </aside>

      <div className="absolute left-4 top-4 z-20 w-[calc(100%-1rem)] space-y-3 md:left-20 md:top-4 md:w-[min(840px,calc(100%-7rem))]">
        <div className="earth-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/85">
          Primordial
          <span className="h-1 w-1 rounded-full bg-white/70" />
          Immersive Mode
        </div>

        <div className="earth-glass flex flex-wrap gap-2 rounded-2xl p-2">
          {periods.map((period) => {
            const active = period.id === selectedPeriod.id

            return (
              <button
                key={period.id}
                type="button"
                onClick={() => handlePeriodSelect(period.id)}
                className={[
                  'rounded-xl px-3 py-2 text-left transition md:px-4',
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-black/20 text-white/75 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                <p className="font-display text-sm md:text-base">{period.name}</p>
                <p className="text-[10px] tracking-[0.18em] text-white/60">{period.dateRange}</p>
              </button>
            )
          })}
        </div>
      </div>

      <section className="absolute bottom-4 left-4 z-20 w-[calc(100%-1rem)] max-w-[520px] space-y-3 md:left-20">
        <article className="earth-glass rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/65">
            {selectedPeriod.name}
          </p>
          <h1 className="mt-2 font-display text-2xl leading-tight text-white md:text-3xl">
            {selectedPeriod.dateRange}
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/80">
            {selectedPeriod.description}
          </p>
        </article>

        <article className="earth-glass rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/65">
              Species focus
            </p>
            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] tracking-[0.16em] text-white/70">
              {selectedPeriod.species.length} records
            </span>
          </div>

          {selectedSpecies ? (
            <>
              <p className="font-display text-xl text-white">{selectedSpecies.name}</p>
              <p className="mt-1 text-sm text-white/70">{selectedSpecies.taxonomy}</p>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/85">
                {selectedSpecies.description}
              </p>
            </>
          ) : (
            <p className="text-sm leading-6 text-white/80">
              Aucun taxon charge pour cette ere. Ajoute des especes sourcees dans les
              fichiers data pour activer la fiche detail.
            </p>
          )}
        </article>
      </section>

      <section className="absolute right-4 top-[104px] z-20 hidden w-[280px] space-y-3 lg:block">
        <article className="earth-glass rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/65">
            Atmosphere
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {metricRows.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-white/15 bg-black/20 p-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                  {metric.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-white/90">{metric.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-white/65">
            Valeurs affichees en attente de mesures sourcees GEOCARB.
          </p>
        </article>

        <article className="earth-glass rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/65">
            Globe Period
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCloudsVisible((prev) => !prev)}
              className={[
                'rounded-lg border px-2.5 py-1.5 text-xs transition',
                cloudsVisible
                  ? 'border-cyan-200/60 bg-cyan-300/20 text-cyan-50'
                  : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              Nuages: {cloudsVisible ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={() => setRotationEnabled((prev) => !prev)}
              className={[
                'rounded-lg border px-2.5 py-1.5 text-xs transition',
                rotationEnabled
                  ? 'border-cyan-200/60 bg-cyan-300/20 text-cyan-50'
                  : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              Rotation: {rotationEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
