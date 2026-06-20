import React from 'react'
import { Link } from 'react-router-dom'
import { FileDown, ChevronRight, Building2, Users } from 'lucide-react'
import ActionRequiredPanel from '../../components/municipal/ActionRequiredPanel'
import PilotKpiGrid from '../../components/municipal/PilotKpiGrid'
import SmartRecommendations from '../../components/municipal/SmartRecommendations'
import TerritoryMapPreview from '../../components/municipal/TerritoryMapPreview'
import ScoreRing from '../../components/municipal/ScoreRing'
import RoomCapacityBadge from '../../components/municipal/RoomCapacityBadge'
import {
  requiredActions, pilotKpis, smartRecommendations, territoryPoints, associationProfiles,
  getFacilityMaintenance,
} from '../../data/municipal/pilotData'
import { facilities, MUNICIPALITY, revenueByMonth, KPI } from '../../data/municipal/mockData'

const fmtEuro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const MunicipalOverviewPage: React.FC = () => {
  const maxRevenue = Math.max(...revenueByMonth.map(m => m.amount))
  const criticalCount = requiredActions.filter(a => a.priority === 'critical').length
  const openTickets = facilities.reduce((n, f) => {
    const m = getFacilityMaintenance(f.id)
    return n + (m?.tickets.filter(t => t.status !== 'resolved').length ?? 0)
  }, 0)

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* En-tête pilotage */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Centre de pilotage</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
            {MUNICIPALITY.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            En moins de 30 secondes : actions urgentes, coûts, opportunités et risques patrimoine.
          </p>
        </div>
        <Link
          to="/municipalite/dashboard/rapports"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 shrink-0"
        >
          <FileDown className="w-4 h-4" />
          Générer rapport élu
        </Link>
      </div>

      {/* 1. Actions requises — priorité absolue */}
      <ActionRequiredPanel actions={requiredActions} />

      {/* Synthèse rapide 4 piliers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Actions urgentes', value: String(criticalCount), hint: 'À traiter', color: 'text-destructive' },
          { label: 'Coûts engagés', value: '15,6 k€', hint: 'Maintenance ce trimestre', color: 'text-foreground' },
          { label: 'Valeur à capter', value: '+4 800 €', hint: 'Économies détectées', color: 'text-emerald-700' },
          { label: 'Équipements à risque', value: String(openTickets), hint: 'Tickets ouverts', color: 'text-amber-700' },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">{item.label}</p>
            <p className={`text-xl font-display font-bold mt-1 ${item.color}`}>{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.hint}</p>
          </div>
        ))}
      </div>

      {/* 2. KPIs cliquables */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Indicateurs</p>
        <PilotKpiGrid kpis={pilotKpis} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <SmartRecommendations items={smartRecommendations} />

          {/* Revenus — conservé mais secondaire */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Revenus locatifs</p>
            <p className="font-display text-2xl font-bold mt-1 tabular-nums">{fmtEuro(KPI.rentalRevenue.value)}</p>
            <div className="flex items-end gap-2 h-28 mt-4">
              {revenueByMonth.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full max-w-[2rem] rounded-t-md bg-primary/70"
                    style={{ height: `${(m.amount / maxRevenue) * 100}%`, minHeight: 4 }}
                  />
                  <span className="text-[9px] text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <TerritoryMapPreview points={territoryPoints} />
          <Link
            to="/municipalite/dashboard/carte"
            className="block text-center text-xs font-bold text-primary hover:underline -mt-2"
          >
            Ouvrir la carte complète
          </Link>

          {/* Conformité associations */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold text-sm">Conformité associations</p>
              <Link to="/municipalite/dashboard/associations" className="text-xs text-primary font-bold">
                Tout voir
              </Link>
            </div>
            <div className="divide-y divide-border">
              {associationProfiles.map(a => (
                <Link
                  key={a.id}
                  to={`/municipalite/dashboard/associations/${a.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40"
                >
                  <ScoreRing score={a.complianceScore} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground">{a.sport}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Salles & capacités */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Salles & capacité maximale</p>
            <p className="text-xs text-muted-foreground">Effectif réglementaire par salle</p>
          </div>
          <Link to="/municipalite/dashboard/infrastructures" className="text-xs font-bold text-primary inline-flex items-center gap-1">
            Infrastructures <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {facilities.flatMap(f =>
            f.rooms.map(room => (
              <Link
                key={room.id}
                to={`/municipalite/dashboard/infrastructures/${room.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30"
              >
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{room.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{f.name}</p>
                </div>
                <RoomCapacityBadge capacity={room.capacity} />
              </Link>
            )),
          )}
        </div>
      </div>

      {/* Patrimoine rapide */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Patrimoine à surveiller</p>
            <p className="text-xs text-muted-foreground">{facilities.length} équipements</p>
          </div>
          <Link to="/municipalite/dashboard/patrimoine" className="text-xs font-bold text-primary inline-flex items-center gap-1">
            Module maintenance <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {facilities.map(f => {
            const m = getFacilityMaintenance(f.id)
            return (
              <Link
                key={f.id}
                to={`/municipalite/dashboard/patrimoine/${f.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30"
              >
                <Building2 className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground">Santé {m?.healthScore ?? '—'}/100</p>
                </div>
                {m && <ScoreRing score={m.healthScore} size="sm" />}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/5 to-transparent p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <Users className="w-8 h-8 text-primary shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-foreground">Vie associative & conventions</p>
          <p className="text-sm text-muted-foreground mt-1">
            Coffre-fort documentaire, assurances, dirigeants et score de conformité par association.
          </p>
        </div>
        <Link
          to="/municipalite/dashboard/associations/a1"
          className="text-sm font-bold text-primary shrink-0"
        >
          Exemple Judo Club →
        </Link>
      </div>
    </div>
  )
}

export default MunicipalOverviewPage
