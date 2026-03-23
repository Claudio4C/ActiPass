import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';

// Doit correspondre exactement à l'enum AttendanceStatus du schéma Prisma
type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

interface AttendanceItem {
  user: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    avatar_url?: string;
  };
  reservation_id: string;
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
    start_date: string; // aliasé depuis start_time côté backend
    end_date: string | null;
    status: string;
  };
  attendances: AttendanceItem[];
  can_modify: boolean;
  past_24h: boolean; // délai dépassé (info pour afficher le warning même aux admins)
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
};

const AttendanceDetailPage: React.FC = () => {
  const { organisationId, eventId } = useParams<{ organisationId: string; eventId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Statuts originaux (depuis l'API) — null = pas de présence enregistrée
  const [originalStatuses, setOriginalStatuses] = useState<Record<string, AttendanceStatus | null>>({});
  // Statuts modifiés localement — uniquement les entrées explicitement touchées
  const [localAttendances, setLocalAttendances] = useState<Record<string, AttendanceStatus>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCopied, setQrCopied] = useState(false);

  const [notification, setNotification] = useState<Notification | null>(null);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (organisationId && eventId) loadAttendance();
  }, [organisationId, eventId]);

  // Auto-dismiss notification après 4s
  useEffect(() => {
    if (!notification) return;
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setNotification(null), 4000);
    return () => {
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    };
  }, [notification]);

  const showNotif = (type: Notification['type'], message: string) =>
    setNotification({ type, message });

  const loadAttendance = async () => {
    if (!organisationId || !eventId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<AttendanceData>(
        `/organisations/${organisationId}/events/${eventId}/attendance`
      );
      setAttendanceData(data);

      const originals: Record<string, AttendanceStatus | null> = {};
      const locals: Record<string, AttendanceStatus> = {};
      const initialComments: Record<string, string> = {};

      data.attendances.forEach((item) => {
        if (item.attendance) {
          originals[item.user.id] = item.attendance.status;
          locals[item.user.id] = item.attendance.status;
          if (item.attendance.comment) initialComments[item.user.id] = item.attendance.comment;
        } else {
          // Pas de présence enregistrée : on track null, on ne pré-sélectionne rien
          originals[item.user.id] = null;
        }
      });

      setOriginalStatuses(originals);
      setLocalAttendances(locals);
      setComments(initialComments);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (userId: string, status: AttendanceStatus) => {
    setLocalAttendances((prev) => ({ ...prev, [userId]: status }));
  };

  const handleCommentChange = (userId: string, comment: string) => {
    setComments((prev) => ({ ...prev, [userId]: comment }));
  };

  const handleSave = async () => {
    if (!organisationId || !eventId) return;
    try {
      setSaving(true);

      // N'envoyer que les présences réellement modifiées ou nouvellement définies
      const changedAttendances = Object.entries(localAttendances)
        .filter(([userId, status]) => status !== originalStatuses[userId])
        .map(([user_id, status]) => ({
          user_id,
          status,
          comment: comments[user_id] || undefined,
        }));

      if (changedAttendances.length === 0) {
        showNotif('success', 'Aucun changement à enregistrer.');
        return;
      }

      await api.put(`/organisations/${organisationId}/events/${eventId}/attendance/bulk`, {
        attendances: changedAttendances,
      });

      api.clearCache(`/organisations/${organisationId}/events/${eventId}/attendance`);
      api.clearCache(`/organisations/${organisationId}/attendance/summaries`);
      await loadAttendance();
      showNotif('success', 'Présences enregistrées avec succès.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      showNotif('error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!organisationId || !eventId) return;
    if (!window.confirm('Valider toutes les présences de cet événement ?')) return;
    try {
      await api.post(`/organisations/${organisationId}/events/${eventId}/attendance/validate`);
      api.clearCache(`/organisations/${organisationId}/events/${eventId}/attendance`);
      api.clearCache(`/organisations/${organisationId}/attendance/summaries`);
      await loadAttendance();
      showNotif('success', 'Présences validées avec succès.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la validation';
      showNotif('error', message);
    }
  };

  const handleGenerateQrCode = async () => {
    if (!organisationId || !eventId) return;
    try {
      const data = await api.post<{ qr_code: string; event_id: string; expires_at: string }>(
        `/organisations/${organisationId}/events/${eventId}/attendance/qr-code`
      );
      setQrCode(data.qr_code);
      setShowQrModal(true);
      setQrCopied(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la génération du QR code';
      showNotif('error', message);
    }
  };

  const handleCopyQrCode = async () => {
    if (!qrCode) return;
    await navigator.clipboard.writeText(qrCode);
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Changement détecté : statut différent de l'original (y compris null → status)
  const hasChanges = Object.entries(localAttendances).some(
    ([userId, status]) => status !== originalStatuses[userId]
  );

  // Valider : montrer le bouton si au moins une présence n'est pas encore validée
  const allValidated =
    attendanceData !== null &&
    attendanceData.attendances.length > 0 &&
    attendanceData.attendances.every((a) => a.attendance?.validated_at);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !attendanceData) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Link
            to={`/dashboard/${organisationId}/attendance`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <p className="text-red-800 font-medium">{error || 'Données non disponibles'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Notification inline */}
        {notification && (
          <div
            className={`rounded-lg p-4 flex items-center space-x-3 border ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={`/dashboard/${organisationId}/attendance`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{attendanceData.event.title}</h1>
              <p className="text-gray-600 mt-1">
                {formatDate(attendanceData.event.start_date)}
                {attendanceData.event.end_date && ` — ${formatDate(attendanceData.event.end_date)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleGenerateQrCode}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </button>

            {!allValidated && (
              <button
                onClick={handleValidate}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Valider la séance
              </button>
            )}

            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            )}
          </div>
        </div>

        {/* Avertissement délai 24h */}
        {attendanceData.past_24h && (
          <div className={`border rounded-lg p-4 flex items-center space-x-2 ${
            attendanceData.can_modify
              ? 'bg-blue-50 border-blue-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${attendanceData.can_modify ? 'text-blue-600' : 'text-yellow-600'}`} />
            <p className={`text-sm ${attendanceData.can_modify ? 'text-blue-800' : 'text-yellow-800'}`}>
              {attendanceData.can_modify
                ? 'Délai de 24h dépassé — vous modifiez en tant qu\'administrateur.'
                : 'Le délai de modification (24h) est dépassé. Seuls les administrateurs peuvent modifier les présences.'}
            </p>
          </div>
        )}

        {/* Grille de présences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {attendanceData.attendances.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Aucun participant inscrit à cet événement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-indigo-50 to-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Participant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Commentaire
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Informations
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {attendanceData.attendances.map((item) => {
                    const currentStatus = localAttendances[item.user.id];
                    const currentComment = comments[item.user.id] ?? '';

                    return (
                      <tr key={item.user.id} className="hover:bg-indigo-50/50 transition-colors">
                        {/* Participant */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.user.avatar_url ? (
                              <img
                                src={item.user.avatar_url}
                                alt={`${item.user.firstname} ${item.user.lastname}`}
                                className="h-12 w-12 rounded-full ring-2 ring-gray-100"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center ring-2 ring-gray-100">
                                <span className="text-white font-semibold text-sm">
                                  {item.user.firstname[0]}{item.user.lastname[0]}
                                </span>
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {item.user.firstname} {item.user.lastname}
                              </div>
                              <div className="text-sm text-gray-500">{item.user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Statut */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attendanceData.can_modify ? (
                            <select
                              value={currentStatus ?? ''}
                              onChange={(e) =>
                                handleStatusChange(item.user.id, e.target.value as AttendanceStatus)
                              }
                              className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:text-sm bg-white ${
                                !currentStatus ? 'text-gray-400' : ''
                              }`}
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
                            <div className="flex items-center space-x-2">
                              {currentStatus ? (
                                <>
                                  {getStatusIcon(currentStatus)}
                                  <span className="text-sm font-medium text-gray-900">
                                    {STATUS_LABELS[currentStatus]}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-400 italic">Non renseigné</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Commentaire */}
                        <td className="px-6 py-4">
                          {attendanceData.can_modify ? (
                            <input
                              type="text"
                              value={currentComment}
                              onChange={(e) => handleCommentChange(item.user.id, e.target.value)}
                              placeholder="Ajouter un commentaire..."
                              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:text-sm bg-white"
                            />
                          ) : (
                            <span className="text-sm text-gray-500 italic">
                              {currentComment || 'Aucun commentaire'}
                            </span>
                          )}
                        </td>

                        {/* Informations */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-y-1">
                          {item.attendance?.validated_at && (
                            <div>Validé le {formatDate(item.attendance.validated_at)}</div>
                          )}
                          {item.attendance?.correction_note && (
                            <div className="text-xs text-yellow-600">
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal QR Code */}
        {showQrModal && qrCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Code de pointage</h3>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Affichez ce code aux participants pour qu'ils puissent valider leur présence.
              </p>

              {/* Code affiché large */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                <div className="text-center font-mono text-2xl font-bold text-indigo-700 tracking-widest break-all">
                  {qrCode.toUpperCase()}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCopyQrCode}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  {qrCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copier le code
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendanceDetailPage;
