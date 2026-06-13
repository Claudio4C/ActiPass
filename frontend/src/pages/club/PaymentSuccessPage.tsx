import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

const PaymentSuccessPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-sm w-full bg-card border border-emerald-500/20 rounded-3xl p-8 text-center space-y-5 shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Paiement réussi !</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Votre cotisation a bien été enregistrée. Un reçu vous sera envoyé par e-mail.
          </p>
        </div>
        <button
          onClick={() => navigate(`/club/${orgId}`)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-xl active:scale-95 transition-transform"
        >
          Retour à l'espace membre
        </button>
      </div>
    </div>
  )
}

export default PaymentSuccessPage
