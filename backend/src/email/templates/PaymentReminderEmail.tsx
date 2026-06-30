import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout, ctaButton, heading, paragraph } from './EmailLayout';

export interface PaymentReminderEmailProps {
  firstname: string;
  organisationName: string;
  ctaUrl: string;
  unsubscribeUrl?: string;
}

export const PaymentReminderEmail: React.FC<PaymentReminderEmailProps> = ({
  firstname,
  organisationName,
  ctaUrl,
  unsubscribeUrl,
}) => (
  <EmailLayout
    previewText={`Rappel de paiement — ${organisationName}`}
    unsubscribeUrl={unsubscribeUrl}
  >
    <Text style={heading}>Bonjour {firstname},</Text>
    <Text style={paragraph}>
      Nous vous rappelons qu'un paiement est en attente pour votre adhésion à{' '}
      <strong>{organisationName}</strong>.
    </Text>
    <Text style={paragraph}>
      Réglez votre cotisation dès maintenant pour conserver un accès complet à
      votre espace membre.
    </Text>
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Button href={ctaUrl} style={ctaButton}>
        Régler ma cotisation
      </Button>
    </Section>
  </EmailLayout>
);

export default PaymentReminderEmail;
