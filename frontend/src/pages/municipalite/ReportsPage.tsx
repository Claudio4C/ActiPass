import React from 'react'
import { Link } from 'react-router-dom'
import { FileDown, Sparkles, BarChart3, AlertTriangle } from 'lucide-react'
import { revenueByMonth, KPI } from '../../data/municipal/mockData'
import { requiredActions, smartRecommendations } from '../../data/municipal/pilotData'

const fmtEuro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const MunicipalReportsPage: React.FC = () => {
  const [generating, setGenerating] = React.useState(false)
  const [done, setDone] = React.useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    setDone(false)
    setTimeout(() => {
      setGenerating(false)
      setDone(true)
    }, 2200)
  }

  const maxRevenue = Math.max(...revenueByMonth.map(m => m.amount))

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Rapports élus</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Synthèse automatique — indicateurs, alertes et recommandations
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0"
        >
          <FileDown className="w-4 h-4" />
          {generating ? 'Génération…' : 'Générer rapport élu'}
        </button>
      </div>

      {done && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-800">
          Rapport PDF généré (démo) — <span className="font-semibold">rapport-elu-T2-2026.pdf</span>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Aperçu</p>
          <h2 className="font-display text-xl font-bold mt-1">Rapport trimestriel — Collectivité</h2>
          <p className="text-xs text-muted-foreground mt-1">Période : avril – juin 2026</p>
        </div>

        <div className="p-6 space-y-8">
          <section>
            <h3 className="text-sm font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Indicateurs clés</h3>
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              {[
                { label: 'Occupation', value: `${KPI.occupancyRate.value}%`, delta: '+4,2 %' },
                { label: 'Revenus mensuels', value: fmtEuro(KPI.rentalRevenue.value), delta: '+8,1 %' },
                { label: 'Associations conformes', value: '87 %', delta: '21/24' },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-border p-4">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">{item.label}</p>
                  <p className="text-xl font-display font-bold mt-1">{item.value}</p>
                  <p className="text-xs text-emerald-700 mt-1">{item.delta}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" /> Alertes</h3>
            <ul className="mt-3 space-y-2">
              {requiredActions.filter(a => a.priority !== 'opportunity').slice(0, 3).map(a => (
                <li key={a.id} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-foreground font-medium shrink-0">•</span>
                  {a.title}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Recommandations</h3>
            <ul className="mt-3 space-y-2">
              {smartRecommendations.slice(0, 3).map(r => (
                <li key={r.id} className="text-sm">
                  <span className="font-medium text-foreground">{r.title}</span>
                  <span className="text-muted-foreground"> — {r.description}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold">Évolution des revenus</h3>
            <div className="flex items-end gap-2 h-32 mt-4">
              {revenueByMonth.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full max-w-[2rem] rounded-t-md bg-primary/70"
                    style={{ height: `${(m.amount / maxRevenue) * 100}%`, minHeight: 6 }}
                  />
                  <span className="text-[9px] text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Le PDF final inclura graphiques, cartographie simplifiée et annexes conventions.{' '}
        <Link to="/municipalite/dashboard/carte" className="text-primary font-medium hover:underline">
          Voir la carte territoriale
        </Link>
      </p>
    </div>
  )
}

export default MunicipalReportsPage
