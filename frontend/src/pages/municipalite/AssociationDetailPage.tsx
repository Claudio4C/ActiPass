import React from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, FileText, Shield, Users, Euro, AlertCircle, CheckCircle2, XCircle,
} from 'lucide-react'
import ScoreRing from '../../components/municipal/ScoreRing'
import { getAssociationProfile } from '../../data/municipal/pilotData'
import { cn } from '../../lib/utils'
import type { DocumentStatus } from '../../types/municipal'

const docStatusLabel: Record<DocumentStatus, { text: string; cls: string }> = {
  valid: { text: 'Valide', cls: 'bg-emerald-500/10 text-emerald-700' },
  expiring: { text: 'Expire bientôt', cls: 'bg-amber-500/10 text-amber-700' },
  missing: { text: 'Manquant', cls: 'bg-destructive/10 text-destructive' },
  expired: { text: 'Expiré', cls: 'bg-destructive/10 text-destructive' },
}

const MunicipalAssociationDetailPage: React.FC = () => {
  const { associationId } = useParams<{ associationId: string }>()
  const profile = associationId ? getAssociationProfile(associationId) : undefined

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Association introuvable.</p>
        <Link to="/municipalite/dashboard/associations" className="text-primary text-sm font-medium mt-2 inline-block">
          Retour à la liste
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1100px]">
      <Link
        to="/municipalite/dashboard/associations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Associations
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-foreground">{profile.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {profile.sport} · {profile.members} membres · Convention jusqu'au {profile.conventionUntil}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-5 shrink-0">
          <ScoreRing score={profile.complianceScore} size="lg" />
          <div>
            <p className="text-sm font-bold text-foreground">Score de conformité</p>
            <ul className="mt-2 space-y-1">
              {profile.complianceChecks.map(c => (
                <li key={c.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  {c.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Coffre-fort documentaire */}
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Coffre-fort documentaire</h2>
          </div>
          <ul className="divide-y divide-border">
            {profile.documents.map(doc => (
              <li key={doc.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{doc.name}</p>
                  {doc.expiresAt && <p className="text-[10px] text-muted-foreground">Échéance {doc.expiresAt}</p>}
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', docStatusLabel[doc.status].cls)}>
                  {docStatusLabel[doc.status].text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Assurances & conventions */}
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Assurances & conventions</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Assurance RC</p>
              <p className="text-sm font-semibold mt-1">Expire le {profile.insuranceExpiry}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Convention de mise à disposition</p>
              <p className="text-sm font-semibold mt-1">Valide jusqu'au {profile.conventionUntil}</p>
            </div>
          </div>
        </section>

        {/* Dirigeants */}
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Dirigeants</h2>
          </div>
          <ul className="divide-y divide-border">
            {profile.leaders.map(l => (
              <li key={l.id} className="px-5 py-3">
                <p className="text-sm font-medium">{l.name}</p>
                <p className="text-xs text-muted-foreground">{l.role}{l.email ? ` · ${l.email}` : ''}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Subventions & incidents */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Euro className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Historique des subventions</h2>
            </div>
            <ul className="divide-y divide-border">
              {profile.subsidies.map(s => (
                <li key={s.id} className="px-5 py-3 flex justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.year}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums">{s.amount.toLocaleString('fr-FR')} €</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Historique des incidents</h2>
            </div>
            {profile.incidents.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">Aucun incident signalé.</p>
            ) : (
              <ul className="divide-y divide-border">
                {profile.incidents.map(i => (
                  <li key={i.id} className="px-5 py-3">
                    <p className="text-sm">{i.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{i.date} · {i.status}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default MunicipalAssociationDetailPage
