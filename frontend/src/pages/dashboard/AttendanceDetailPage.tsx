import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  CheckSquare,
  QrCode,
  Copy,
  Check,
  Users,
  RefreshCw,
  X,
  Mail,
} from 'lucide-react'
import QRCode from 'react-qr-code'
import { api } from '../../lib/api'

type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

interface AttendanceItem {
  user: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    avatar_url?: string;
  };
  reservation_id: string | null;
  attendance: {
    id: string;
    status: AttendanceStatus;
    type: string;
    comment?: string;
    validated_at?: string | null;
    correction_note?: string;
    corrected_by?: { id: string; firstname: string; lastname: string } | null;
    checked_by?: { id: string; firstname: string; lastname: string } | null;
    created_at: string;
    updated_at: string;
  } | null;
}

interface AttendanceData {
  event: {
    id: string;
    title: string;
    start_date: string;
    end_date: string | null;
    status: string;
  };
  attendances: AttendanceItem[];
  can_modify: boolean;
  past_24h: boolean;
  checkin_qr?: {
    active: boolean;
    expires_at: string | null;
  };
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Présent',
  late: 'En retard',
  absent: 'Absent',
  excused: 'Absent excusé',
}

const avatarColors = [
  'hsl(217,91%,60%)', 'hsl(280,70%,60%)', 'hsl(25,95%,53%)',
  'hsl(160,84%,39%)', 'hsl(340,75%,55%)',
]

const getAvatarColor = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length]

const AttendanceDetailPage: React.FC = () => {
  const { organisationId, eventId } = useParams<{ organisationId: string; eventId: string }>()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [originalStatuses, setOriginalStatuses] = useState<Record<string, AttendanceStatus | null>>({})
  const [localAttendances, setLocalAttendances] = useState<Record<string, AttendanceStatus>>({})
  const [comments, setComments] = useState<Record<string, string>>({})

  const [showQrModal, setShowQrModal] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [checkInUrl, setCheckInUrl] = useState<string | null>(null)
  const [qrCopied, setQrCopied] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [deletingAttendanceId, setDeletingAttendanceId] = useState<string | null>(null)

  const [notification, setNotification] = useState<Notification | null>(null)
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (organisationId && eventId) {loadAttendance()}
  }, [organisationId, eventId])

  useEffect(() => {
    if (!notification) {return}
    if (notifTimerRef.current) {clearTimeout(notifTimerRef.current)}
    notifTimerRef.current = setTimeout(() => setNotification(null), 4000)
    return () => {
      if (notifTimerRef.current) {clearTimeout(notifTimerRef.current)}
    }
  }, [notification])

  const showNotif = (type: Notification['type'], message: string) =>
    setNotification({ type, message })

  const loadAttendance = async () => {
    if (!organisationId || !eventId) {return}
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<AttendanceData>(
        `/organisations/${organisationId}/events/${eventId}/attendance`,
      )
      setAttendanceData(data)

      const originals: Record<string, AttendanceStatus | null> = {}
      const locals: Record<string, AttendanceStatus> = {}
      const initialComments: Record<string, string> = {}

      data.attendances.forEach((item) => {
        if (item.attendance) {
          originals[item.user.id] = item.attendance.status
          locals[item.user.id] = item.attendance.status
          if (item.attendance.comment) {initialComments[item.user.id] = item.attendance.comment}
        } else {
          originals[item.user.id] = null
        }
      })

      setOriginalStatuses(originals)
      setLocalAttendances(locals)
      setComments(initialComments)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (userId: string, status: AttendanceStatus) => {
    setLocalAttendances((prev) => ({ ...prev, [userId]: status }))
  }

  const handleCommentChange = (userId: string, comment: string) => {
    setComments((prev) => ({ ...prev, [userId]: comment }))
  }

  const handleSave = async () => {
    if (!organisationId || !eventId) {return}
    try {
      setSaving(true)

      const changedAttendances = Object.entries(localAttendances)
        .filter(([userId, status]) => status !== originalStatuses[userId])
        .map(([user_id, status]) => ({
          user_id,
          status,
          comment: comments[user_id] || undefined,
        }))

      if (changedAttendances.length === 0) {
        showNotif('success', 'Aucun changement à enregistrer.')
        return
      }

      await api.put(`/organisations/${organisationId}/events/${eventId}/attendance/bulk`, {
        attendances: changedAttendances,
      })

      api.clearCache(`/organisations/${organisationId}/events/${eventId}/attendance`)
      api.clearCache(`/organisations/${organisationId}/attendance/summaries`)
      await loadAttendance()
      showNotif('success', 'Présences enregistrées avec succès.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement"
      showNotif('error', message)
    } finally {
      setSaving(false)
    }
  }

  const handleValidate = async () => {
    if (!organisationId || !eventId) {return}
    if (!window.confirm('Valider toutes les présences de cet événement ?')) {return}
    try {
      await api.post(`/organisations/${organisationId}/events/${eventId}/attendance/validate`)
      api.clearCache(`/organisations/${organisationId}/events/${eventId}/attendance`)
      api.clearCache(`/organisations/${organisationId}/attendance/summaries`)
      await loadAttendance()
      showNotif('success', 'Présences validées avec succès.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la validation'
      showNotif('error', message)
    }
  }

  const handleGenerateQrCode = async () => {
    if (!organisationId || !eventId) {return}
    try {
      setQrLoading(true)
      const data = await api.post<{ qr_code: string; event_id: string; expires_at: string; reused?: boolean }>(
        `/organisations/${organisationId}/events/${eventId}/attendance/qr-code`,
        {},
      )
      setQrCode(data.qr_code)
      setCheckInUrl(
        `${window.location.origin}/attendance/${organisationId}/${eventId}/check-in?t=${encodeURIComponent(data.qr_code)}`,
      )
      setShowQrModal(true)
      setQrCopied(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la génération du QR code'
      showNotif('error', message)
    } finally {
      setQrLoading(false)
    }
  }

  const handleRotateQrCode = async () => {
    if (!organisationId || !eventId) {return}
    try {
      setQrLoading(true)
      const data = await api.post<{ qr_code: string; expires_at: string }>(
        `/organisations/${organisationId}/events/${eventId}/attendance/qr-code`,
        { rotate: true },
      )
      setQrCode(data.qr_code)
      setCheckInUrl(
        `${window.location.origin}/attendance/${organisationId}/${eventId}/check-in?t=${encodeURIComponent(data.qr_code)}`,
      )
      setQrCopied(false)
      showNotif('success', 'Nouveau QR généré : les anciens codes ne sont plus valides.')
      api.clearCache(`/organisations/${organisationId}/events/${eventId}/attendance`)
      await loadAttendance()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la régénération'
      showNotif('error', message)
    } finally {
      setQrLoading(false)
    }
  }

  const handleCopyQrCode = async () => {
    const text = checkInUrl || qrCode
    if (!text) {return}
    await navigator.clipboard.writeText(text)
    setQrCopied(true)
    setTimeout(() => setQrCopied(false), 2000)
  }

  const handleDeleteAttendance = async (attendanceId: string, participantLabel: string) => {
    if (!organisationId || !eventId) {return}
    if (!window.confirm(`Supprimer la présence enregistrée pour ${participantLabel} ?`)) {return}
    try {
      setDeletingAttendanceId(attendanceId)
      await api.delete(
        `/organisations/${organisationId}/events/${eventId}/attendance/${attendanceId}`,
      )
      api.clearCache(`/organisations/${organisationId}/events/${eventId}/attendance`)
      api.clearCache(`/organisations/${organisationId}/attendance/summaries`)
      await loadAttendance()
      showNotif('success', 'Présence supprimée.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression'
      showNotif('error', message)
    } finally {
      setDeletingAttendanceId(null)
    }
  }

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 shrink-0 text-[hsl(160,84%,32%)]" />
      case 'late':
        return <Clock className="w-5 h-5 shrink-0 text-amber-600" />
      default:
        return <XCircle className="w-5 h-5 shrink-0 text-destructive" />
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const hasChanges = Object.entries(localAttendances).some(
    ([userId, status]) => status !== originalStatuses[userId],
  )

  const allValidated =
    attendanceData !== null &&
    attendanceData.attendances.length > 0 &&
    attendanceData.attendances.every((a) => a.attendance?.validated_at)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[16rem] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </div>
    )
  }

  if (error || !attendanceData) {
    return (
      <div className="space-y-4">
        <Link
          to={`/dashboard/${organisationId}/attendance`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Retour aux présences
        </Link>
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-destructive text-white">
            <AlertCircle className="w-5 h-5" />
          </span>
          <p className="text-sm font-medium text-foreground pt-1.5">{error || 'Données non disponibles'}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Notification inline */}
        {notification && (
          <div
            className={`rounded-2xl border p-4 flex items-start gap-3 ${
              notification.type === 'success'
                ? 'border-[hsl(160_84%_39%/0.25)] bg-[hsl(160_84%_39%/0.08)]'
                : 'border-destructive/30 bg-destructive/5'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-[hsl(160,84%,32%)] mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-destructive mt-0.5" />
            )}
            <p className="text-sm font-medium text-foreground">{notification.message}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <Link
              to={`/dashboard/${organisationId}/attendance`}
              className="mt-1 shrink-0 w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Retour aux présences"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold text-foreground">{attendanceData.event.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(attendanceData.event.start_date)}
                {attendanceData.event.end_date && ` — ${formatDate(attendanceData.event.end_date)}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateQrCode}
              disabled={qrLoading}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <QrCode className="w-4 h-4 shrink-0" />
              {qrLoading ? 'Préparation…' : 'QR présence'}
            </button>

            {!allValidated && (
              <button
                type="button"
                onClick={handleValidate}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[hsl(160,84%,38%)] text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[hsl(160_84%_39%/0.25)]"
              >
                <CheckSquare className="w-4 h-4 shrink-0" />
                Valider la séance
              </button>
            )}

            {hasChanges && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4 shrink-0" />
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            )}
          </div>
        </div>

        {attendanceData.checkin_qr?.active && attendanceData.checkin_qr.expires_at && (
          <div className="rounded-2xl border border-[hsl(160_84%_39%/0.2)] bg-[hsl(160_84%_39%/0.08)] px-4 py-3 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[hsl(160,84%,32%)] shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              Un QR de pointage est <strong>actif</strong> pour ce cours (valide jusqu’au{' '}
              {formatDate(attendanceData.checkin_qr.expires_at)}). Rouvrir « QR présence » réaffiche le même code ;
              utilisez « Régénérer » dans la fenêtre pour en créer un nouveau.
            </p>
          </div>
        )}

        {/* Avertissement délai 24h */}
        {attendanceData.past_24h && (
          <div
            className={`rounded-2xl border p-4 flex items-start gap-3 ${
              attendanceData.can_modify
                ? 'border-primary/25 bg-primary/5'
                : 'border-amber-500/25 bg-amber-500/10'
            }`}
          >
            <AlertCircle
              className={`w-5 h-5 shrink-0 mt-0.5 ${attendanceData.can_modify ? 'text-primary' : 'text-amber-600'}`}
            />
            <p className="text-sm text-foreground">
              {attendanceData.can_modify
                ? "Délai de 24h dépassé — vous modifiez en tant qu'administrateur."
                : 'Le délai de modification (24h) est dépassé. Seuls les administrateurs peuvent modifier les présences.'}
            </p>
          </div>
        )}

        {/* Grille de présences */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {attendanceData.attendances.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">Aucun participant</h2>
              <p className="text-sm text-muted-foreground">Aucun participant inscrit à cet événement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    {['Participant', 'Statut', 'Commentaire', 'Informations', ''].map((col, i) => (
                      <th
                        key={col || 'actions'}
                        className={`px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-bold ${i === 4 ? 'text-right w-14' : 'text-left'}`}
                        {...(i === 4 ? { 'aria-label': 'Supprimer la présence' } : {})}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendanceData.attendances.map((item) => {
                    const currentStatus = localAttendances[item.user.id]
                    const currentComment = comments[item.user.id] ?? ''

                    return (
                      <tr key={item.user.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {item.user.avatar_url ? (
                              <img
                                src={item.user.avatar_url}
                                alt={`${item.user.firstname} ${item.user.lastname}`}
                                className="shrink-0 w-9 h-9 rounded-xl object-cover ring-1 ring-border"
                              />
                            ) : (
                              <div
                                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                                style={{ backgroundColor: getAvatarColor(item.user.firstname || 'U') }}
                              >
                                {item.user.firstname?.charAt(0) || '?'}{item.user.lastname?.charAt(0) || ''}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {item.user.firstname} {item.user.lastname}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                <Mail className="w-3 h-3 shrink-0" />
                                {item.user.email}
                              </p>
                              {item.reservation_id === null && (
                                <span className="mt-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  Pointage sans réservation
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          {attendanceData.can_modify ? (
                            <select
                              value={currentStatus ?? ''}
                              onChange={(e) =>
                                handleStatusChange(item.user.id, e.target.value as AttendanceStatus)
                              }
                              className={`w-full min-w-[10rem] h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${!currentStatus ? 'text-muted-foreground' : ''}`}
                            >
                              <option value="" disabled>
                                — Choisir —
                              </option>
                              {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex items-center gap-2">
                              {currentStatus ? (
                                <>
                                  {getStatusIcon(currentStatus)}
                                  <span className="text-sm font-medium text-foreground">
                                    {STATUS_LABELS[currentStatus]}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">Non renseigné</span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {attendanceData.can_modify ? (
                            <input
                              type="text"
                              value={currentComment}
                              onChange={(e) => handleCommentChange(item.user.id, e.target.value)}
                              placeholder="Ajouter un commentaire…"
                              className="block w-full min-w-[8rem] h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground italic">
                              {currentComment || 'Aucun commentaire'}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-muted-foreground space-y-1 align-top">
                          {item.attendance?.validated_at && (
                            <div>Validé le {formatDate(item.attendance.validated_at)}</div>
                          )}
                          {item.attendance?.correction_note && (
                            <div className="text-xs text-amber-700 dark:text-amber-400">
                              Correction : {item.attendance.correction_note}
                            </div>
                          )}
                          {item.attendance?.checked_by && (
                            <div className="text-xs">
                              Par : {item.attendance.checked_by.firstname}{' '}
                              {item.attendance.checked_by.lastname}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap align-middle text-right">
                          {attendanceData.can_modify && item.attendance && (
                            <button
                              type="button"
                              title="Supprimer cette présence"
                              disabled={deletingAttendanceId === item.attendance.id}
                              onClick={() =>
                                void handleDeleteAttendance(
                                  item.attendance!.id,
                                  `${item.user.firstname} ${item.user.lastname}`.trim(),
                                )
                              }
                              className="w-8 h-8 rounded-xl inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 transition-colors"
                            >
                              {deletingAttendanceId === item.attendance.id ? (
                                <span className="text-[10px] text-muted-foreground">…</span>
                              ) : (
                                <X className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal QR Code */}
        {showQrModal && qrCode && checkInUrl && (
          <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-bold text-foreground">Pointage — ce cours</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(false)
                  }}
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Fermer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                Chaque cours a son propre QR. Les membres du club scannent ce code (connectés à l’app) pour
                enregistrer leur présence. Le même QR fonctionne pour tous les participants jusqu’à expiration ou
                régénération.
              </p>

              <div className="flex justify-center bg-muted/50 p-4 rounded-2xl border border-border">
                <QRCode value={checkInUrl} size={220} level="M" />
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1">
                <p className="text-xs font-semibold text-foreground">Lien de pointage</p>
                <p className="text-[11px] text-muted-foreground break-all font-mono leading-snug">{checkInUrl}</p>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1">
                <p className="text-xs font-semibold text-foreground">Jeton (affichage)</p>
                <p className="text-center font-mono text-sm font-bold text-foreground tracking-wide break-all">
                  {qrCode.toUpperCase()}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyQrCode}
                  className="flex-1 min-w-[8rem] inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  {qrCopied ? (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 shrink-0" />
                      Copier le lien
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRotateQrCode}
                  disabled={qrLoading}
                  className="flex-1 min-w-[8rem] inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-sm font-semibold hover:bg-amber-500/15 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 shrink-0 ${qrLoading ? 'animate-spin' : ''}`} />
                  Régénérer le QR
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center h-10 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AttendanceDetailPage
