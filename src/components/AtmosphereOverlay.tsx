import type { PeriodData } from '../data/types'

interface AtmosphereOverlayProps {
  period: PeriodData
}

function formatMetric(value: number | null, suffix: string) {
  if (value === null) {
    return 'Pending'
  }

  return `${value}${suffix}`
}

export function AtmosphereOverlay({ period }: AtmosphereOverlayProps) {
  const metrics = [
    { label: 'O2', value: formatMetric(period.atmosphere.o2Percent, '%') },
    { label: 'CO2', value: formatMetric(period.atmosphere.co2Ppm, ' ppm') },
    {
      label: 'Avg temp',
      value: formatMetric(period.atmosphere.avgTempCelsius, ' C'),
    },
    {
      label: 'Pressure',
      value: formatMetric(period.atmosphere.pressureAtm, ' atm'),
    },
    {
      label: 'Sea level',
      value: formatMetric(period.atmosphere.seaLevelMeters, ' m'),
    },
  ]

  return (
    <section className="rounded-[26px] border border-white/10 bg-black/20 p-4">
      <div className="mb-4 border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
          Environmental overlay
        </p>
        <h3 className="mt-2 font-display text-xl text-stone-50">Atmosphere</h3>
        <p className="mt-2 text-sm leading-6 text-stone-300">
          Values remain intentionally blank until they are replaced by sourced
          GEOCARB-aligned estimates.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {metrics.map((metric) => (
          <div key={metric.label} className="metric-card">
            <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
              {metric.label}
            </p>
            <p className="mt-3 font-display text-2xl text-stone-100">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}