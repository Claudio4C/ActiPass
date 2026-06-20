import React, { useMemo, useState } from 'react'
import {
  Package, Plus, Minus, Trash2, History, Search, X, Check,
} from 'lucide-react'
import { facilities } from '../../data/municipal/mockData'
import { EQUIPMENT_CATEGORIES, initialEquipment, initialEquipmentHistory } from '../../data/municipal/equipmentData'
import RoomCapacityBadge from '../../components/municipal/RoomCapacityBadge'
import type {
  EquipmentItem, EquipmentHistoryEntry, EquipmentCondition, EquipmentHistoryAction,
} from '../../types/municipal'
import { cn } from '../../lib/utils'

const CONDITION_LABEL: Record<EquipmentCondition, { label: string; cls: string }> = {
  good: { label: 'Bon état', cls: 'bg-emerald-500/10 text-emerald-700' },
  worn: { label: 'Usé', cls: 'bg-amber-500/10 text-amber-700' },
  repair: { label: 'À réparer', cls: 'bg-orange-500/10 text-orange-700' },
  out_of_service: { label: 'Hors service', cls: 'bg-destructive/10 text-destructive' },
}

const ACTION_LABEL: Record<EquipmentHistoryAction, string> = {
  added: 'Ajout',
  removed: 'Retrait',
  adjusted: 'Ajustement',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

const MunicipalMaterielPage: React.FC = () => {
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? '')
  const [items, setItems] = useState<EquipmentItem[]>(initialEquipment)
  const [history, setHistory] = useState<EquipmentHistoryEntry[]>(initialEquipmentHistory)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState(0)

  const [newItem, setNewItem] = useState({
    name: '', category: EQUIPMENT_CATEGORIES[0], roomId: '', quantity: 1,
    condition: 'good' as EquipmentCondition, notes: '',
  })

  const facility = facilities.find(f => f.id === facilityId)

  const facilityItems = useMemo(() => {
    return items
      .filter(i => i.facilityId === facilityId)
      .filter(i =>
        !search.trim() ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [items, facilityId, search])

  const facilityHistory = useMemo(() =>
    history
      .filter(h => h.facilityId === facilityId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [history, facilityId])

  const pushHistory = (
    entry: Omit<EquipmentHistoryEntry, 'id' | 'date' | 'facilityId'>,
  ) => {
    setHistory(prev => [{
      ...entry,
      id: nextId('h'),
      facilityId,
      date: new Date().toISOString(),
    }, ...prev])
  }

  const roomName = (roomId?: string) => {
    if (!roomId || !facility) return 'Commun'
    const room = facility.rooms.find(r => r.id === roomId)
    if (!room) return '—'
    return room.name
  }

  const roomCapacity = (roomId?: string) => {
    if (!roomId || !facility) return undefined
    return facility.rooms.find(r => r.id === roomId)?.capacity
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name.trim()) return
    const item: EquipmentItem = {
      id: nextId('eq'),
      facilityId,
      roomId: newItem.roomId || undefined,
      name: newItem.name.trim(),
      category: newItem.category,
      quantity: newItem.quantity,
      condition: newItem.condition,
      notes: newItem.notes.trim() || undefined,
    }
    setItems(prev => [...prev, item])
    pushHistory({
      equipmentId: item.id,
      itemName: item.name,
      action: 'added',
      quantityChange: item.quantity,
      quantityAfter: item.quantity,
      author: 'Agent municipal',
      note: 'Nouvel article inventorié',
    })
    setNewItem({ name: '', category: EQUIPMENT_CATEGORIES[0], roomId: '', quantity: 1, condition: 'good', notes: '' })
    setShowAdd(false)
  }

  const adjustQuantity = (item: EquipmentItem, delta: number, note?: string) => {
    const next = Math.max(0, item.quantity + delta)
    if (next === item.quantity) return

    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: next } : i))

    const action: EquipmentHistoryAction = next === 0 ? 'removed' : delta > 0 ? 'added' : 'adjusted'
    pushHistory({
      equipmentId: item.id,
      itemName: item.name,
      action,
      quantityChange: delta,
      quantityAfter: next,
      author: 'Agent municipal',
      note,
    })

    if (next === 0) {
      setItems(prev => prev.filter(i => i.id !== item.id))
    }
  }

  const saveEditQty = (item: EquipmentItem) => {
    const delta = editQty - item.quantity
    if (delta !== 0) adjustQuantity(item, delta, 'Modification manuelle de la quantité')
    setEditingId(null)
  }

  const deleteItem = (item: EquipmentItem) => {
    setItems(prev => prev.filter(i => i.id !== item.id))
    pushHistory({
      equipmentId: item.id,
      itemName: item.name,
      action: 'removed',
      quantityChange: -item.quantity,
      quantityAfter: 0,
      author: 'Agent municipal',
      note: 'Article retiré de l\'inventaire',
    })
  }

  const updateCondition = (item: EquipmentItem, condition: EquipmentCondition) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, condition } : i))
  }

  const totalUnits = facilityItems.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Inventaire matériel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Équipements par infrastructure — ajouts, retraits et historique
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ajouter un article
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {facilities.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFacilityId(f.id)}
            className={cn(
              'h-10 px-4 rounded-xl text-sm font-semibold border transition-colors',
              facilityId === f.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:bg-muted',
            )}
          >
            {f.name}
          </button>
        ))}
      </div>

      {facility && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un article…"
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="rounded-xl border border-border bg-card px-4 py-2 flex items-center gap-2 shrink-0">
                <Package className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Articles · unités</p>
                  <p className="text-sm font-bold tabular-nums">{facilityItems.length} · {totalUnits}</p>
                </div>
              </div>
            </div>

            {showAdd && (
              <form onSubmit={handleAdd} className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">Nouvel article — {facility.name}</p>
                  <button type="button" onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-muted">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Désignation</label>
                    <input
                      required
                      value={newItem.name}
                      onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                      className="mt-1 w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                      placeholder="Ex. Tatamis, ballons…"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Catégorie</label>
                    <select
                      value={newItem.category}
                      onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                      className="mt-1 w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                    >
                      {EQUIPMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Salle</label>
                    <select
                      value={newItem.roomId}
                      onChange={e => setNewItem(p => ({ ...p, roomId: e.target.value }))}
                      className="mt-1 w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                    >
                      <option value="">Commun / non affecté</option>
                      {facility.rooms.map(r => (
                        <option key={r.id} value={r.id}>{r.name} — max {r.capacity} pers.</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Quantité</label>
                    <input
                      type="number"
                      min={1}
                      value={newItem.quantity}
                      onChange={e => setNewItem(p => ({ ...p, quantity: Number(e.target.value) }))}
                      className="mt-1 w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">État</label>
                    <select
                      value={newItem.condition}
                      onChange={e => setNewItem(p => ({ ...p, condition: e.target.value as EquipmentCondition }))}
                      className="mt-1 w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                    >
                      {Object.entries(CONDITION_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Notes</label>
                    <input
                      value={newItem.notes}
                      onChange={e => setNewItem(p => ({ ...p, notes: e.target.value }))}
                      className="mt-1 w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                      placeholder="Optionnel"
                    />
                  </div>
                </div>
                <button type="submit" className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                  Enregistrer
                </button>
              </form>
            )}

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {facilityItems.length === 0 ? (
                <p className="p-10 text-center text-sm text-muted-foreground">Aucun article pour ce lieu.</p>
              ) : (
                <div className="divide-y divide-border">
                  {facilityItems.map(item => (
                    <div key={item.id} className="px-5 py-4 hover:bg-muted/20 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">{item.name}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {item.category}
                            </span>
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', CONDITION_LABEL[item.condition].cls)}>
                              {CONDITION_LABEL[item.condition].label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                            <span>{roomName(item.roomId)}</span>
                            {roomCapacity(item.roomId) !== undefined && (
                              <RoomCapacityBadge capacity={roomCapacity(item.roomId)!} />
                            )}
                            {item.notes && <span>· {item.notes}</span>}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {editingId === item.id ? (
                            <>
                              <input
                                type="number"
                                min={0}
                                value={editQty}
                                onChange={e => setEditQty(Number(e.target.value))}
                                className="w-16 h-9 rounded-lg border border-border text-center text-sm font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => saveEditQty(item)}
                                className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
                                aria-label="Valider"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center"
                                aria-label="Annuler"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => adjustQuantity(item, -1)}
                                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                                aria-label="Retirer 1"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditingId(item.id); setEditQty(item.quantity) }}
                                className="min-w-[2.5rem] h-8 px-2 rounded-lg bg-muted font-bold text-sm tabular-nums hover:bg-muted/80"
                              >
                                {item.quantity}
                              </button>
                              <button
                                type="button"
                                onClick={() => adjustQuantity(item, 1)}
                                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                                aria-label="Ajouter 1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <select
                            value={item.condition}
                            onChange={e => updateCondition(item, e.target.value as EquipmentCondition)}
                            className="h-8 text-[10px] rounded-lg border border-border bg-background px-1.5 max-w-[7rem]"
                            aria-label="État du matériel"
                          >
                            {Object.entries(CONDITION_LABEL).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => deleteItem(item)}
                            className="w-8 h-8 rounded-lg text-destructive hover:bg-destructive/10 flex items-center justify-center"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Historique */}
          <aside className="rounded-2xl border border-border bg-card overflow-hidden h-fit lg:sticky lg:top-6">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Historique des mouvements</h2>
            </div>
            <div className="max-h-[32rem] overflow-y-auto divide-y divide-border">
              {facilityHistory.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">Aucun mouvement enregistré.</p>
              ) : (
                facilityHistory.map(entry => (
                  <div key={entry.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{entry.itemName}</p>
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
                        entry.action === 'added' && 'bg-emerald-500/10 text-emerald-700',
                        entry.action === 'removed' && 'bg-destructive/10 text-destructive',
                        entry.action === 'adjusted' && 'bg-amber-500/10 text-amber-700',
                      )}>
                        {ACTION_LABEL[entry.action]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.quantityChange > 0 ? '+' : ''}{entry.quantityChange} → {entry.quantityAfter} en stock
                    </p>
                    {entry.note && <p className="text-[10px] text-muted-foreground mt-1">{entry.note}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {entry.author} · {formatDate(entry.date)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default MunicipalMaterielPage
