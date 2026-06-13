import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { XCircle } from 'lucide-react'

const PaymentCancelPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-sm w-full bg-card border border-border rounded-3xl p-8 text-center space-y-5 shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
          <XCircle className="w-8 h-8 text-muted-foreground shrink-0" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Paiement annulé</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Votre paiement n'a pas été finalisé. Aucun montant n'a été débité.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate(`/club/${orgId}/payment`)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-xl active:scale-95 transition-transform"
          >
            Réessayer
          </button>
          <button
            onClick={() => navigate(`/club/${orgId}`)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Retour à l'espace membre
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentCancelPage
