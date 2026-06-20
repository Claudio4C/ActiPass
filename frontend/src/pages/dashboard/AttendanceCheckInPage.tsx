import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { AlertCircle, CheckCircle, Loader2, User } from 'lucide-react'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/errors'
import { useAuth } from '../../contexts/AuthContext'

type QrChoice = { user_id: string; firstname: string; lastname: string; relation: 'self' | 'child' }

type ValidateResponse =
  | { result: 'choose_attendee'; choices: QrChoice[] }
  | {
      result: 'completed'
      attendance: {
        id: string
        user_id: string
        status: string
        type: string
        validated_at?: string | null
        updated_at: string
      }
      attendee: { id: string; firstname: string; lastname: string }
    }

/**
 * Pointage par QR : /dashboard/:organisationId/attendance/:eventId/check-in?t=TOKEN
 * Connexion obligatoire. Si plusieurs personnes éligibles (vous + enfants), choix puis validation.
 */
const AttendanceCheckInPage: React.FC = () => {
  const { user } = useAuth()
  const location = useLocation()
  const { organisationId, eventId } = useParams<{ organisationId: string; eventId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('t')?.trim() ?? ''

  const [phase, setPhase] = useState<
    'need_login' | 'loading' | 'choose' | 'submitting' | 'success' | 'error'
  >(() => (user ? 'loading' : 'need_login'))
  const [message, setMessage] = useState('')
  const [choices, setChoices] = useState<QrChoice[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const loginHref = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`

  const submitValidate = useCallback(
    async (forUserId?: string) => {
      if (!organisationId || !eventId || !token) return
      setPhase((prev) => (prev === 'choose' && forUserId ? 'submitting' : 'loading'))
      setMessage('')
      try {
        const body: { qr_code: string; for_user_id?: string } = { qr_code: token }
        if (forUserId) body.for_user_id = forUserId

        const res = await api.post<ValidateResponse>(
          `/organisations/${organisationId}/events/${eventId}/attendance/qr-code/validate`,
          body,
        )

        if (res.result === 'choose_attendee') {
          setChoices(res.choices)
          setSelectedUserId(null)
          setPhase('choose')
          return
        }

        if (res.result === 'completed') {
          const who = `${res.attendee.firstname} ${res.attendee.lastname}`.trim()
          setMessage(
            who
              ? `Présence enregistrée pour ${who}.`
              : 'Présence enregistrée pour ce cours.',
          )
          setPhase('success')
        }
      } catch (e) {
        setPhase('error')
        setMessage(getErrorMessage(e instanceof Error ? e : new Error(String(e))))
      }
    },
    [organisationId, eventId, token],
  )

  useEffect(() => {
    if (!organisationId || !eventId) {
      setPhase('error')
      setMessage('Lien de pointage incomplet.')
      return
    }
    if (!token) {
      setPhase('error')
      setMessage('Lien invalide : le code du QR est manquant.')
      return
    }
    if (!user) {
      setPhase('need_login')
      return
    }
    void submitValidate()
  }, [organisationId, eventId, token, user, submitValidate])

  const confirmSelection = () => {
    if (!selectedUserId) {
      setMessage('Choisissez pour qui enregistrer la présence, puis validez.')
      return
    }
    void submitValidate(selectedUserId)
  }

  const relationLabel = (r: QrChoice['relation']) => (r === 'self' ? 'Moi' : 'Enfant')

  return (
    <div className="max-w-md mx-auto mt-10 sm:mt-16 px-4 pb-12">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center space-y-4">
        {(phase === 'loading' || phase === 'submitting') && (
          <>
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <p className="text-gray-700 font-medium">Vérification du pointage…</p>
          </>
        )}

        {phase === 'submitting' && (
          <>
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <p className="text-gray-700 font-medium">Enregistrement en cours…</p>
          </>
        )}

        {phase === 'need_login' && (
          <>
            <User className="w-12 h-12 text-indigo-600 mx-auto" />
            <p className="text-gray-800 text-sm leading-relaxed">
              Connectez-vous pour enregistrer une présence avec ce QR code. Le compte utilisé sera celui
              pointé (vous ou un enfant après choix).
            </p>
            <Link
              to={loginHref}
              className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700"
            >
              Se connecter
            </Link>
            <Link to="/home" className="block text-sm text-gray-600 hover:text-gray-900">
              Retour à l’accueil
            </Link>
          </>
        )}

        {phase === 'choose' && (
          <>
            <p className="text-gray-900 font-semibold text-left w-full">Pour qui pointez-vous la présence ?</p>
            <p className="text-xs text-gray-500 text-left w-full">
              Plusieurs personnes de votre foyer sont éligibles à ce cours. Sélectionnez une option puis
              validez.
            </p>
            <div className="w-full space-y-2 text-left">
              {choices.map((c) => (
                <label
                  key={c.user_id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedUserId === c.user_id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="attendee"
                    className="accent-indigo-600"
                    checked={selectedUserId === c.user_id}
                    onChange={() => {
                      setSelectedUserId(c.user_id)
                      setMessage('')
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {c.firstname} {c.lastname}
                    </p>
                    <p className="text-xs text-gray-500">{relationLabel(c.relation)}</p>
                  </div>
                </label>
              ))}
            </div>
            {message && <p className="text-sm text-amber-700 text-left w-full">{message}</p>}
            <button
              type="button"
              onClick={confirmSelection}
              disabled={!selectedUserId}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              Valider la présence
            </button>
          </>
        )}

        {phase === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <p className="text-gray-900 font-semibold">{message}</p>
            <Link
              to="/home"
              className="inline-block mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Retour à l’accueil
            </Link>
          </>
        )}

        {phase === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
            <p className="text-gray-800 text-sm leading-relaxed">{message}</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              {!user && (
                <Link to={loginHref} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                  Se connecter
                </Link>
              )}
              <Link to="/home" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Accueil
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AttendanceCheckInPage
