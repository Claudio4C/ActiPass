import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout, ctaButton, heading, paragraph } from './EmailLayout';

export interface PaymentReceivedEmailProps {
  firstname: string;
  amount: string;
  label: string;
  date: string;
  ctaUrl: string;
  unsubscribeUrl?: string;
}

export const PaymentReceivedEmail: React.FC<PaymentReceivedEmailProps> = ({
  firstname,
  amount,
  label,
  date,
  ctaUrl,
  unsubscribeUrl,
}) => (
  <EmailLayout previewText={`Paiement de ${amount} confirmé`} unsubscribeUrl={unsubscribeUrl}>
    <Text style={heading}>Paiement confirmé</Text>
    <Text style={paragraph}>
      Bonjour {firstname}, nous confirmons la bonne réception de votre paiement.
    </Text>
    <Section
      style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '16px 20px',
        margin: '0 0 16px',
      }}
    >
      <Text style={{ ...paragraph, margin: '0 0 6px' }}>
        <strong>Montant :</strong> {amount}
      </Text>
      <Text style={{ ...paragraph, margin: '0 0 6px' }}>
        <strong>Pour :</strong> {label}
      </Text>
      <Text style={{ ...paragraph, margin: 0 }}>
        <strong>Date :</strong> {date}
      </Text>
    </Section>
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Button href={ctaUrl} style={ctaButton}>
        Voir mon reçu
      </Button>
    </Section>
  </EmailLayout>
);

export default PaymentReceivedEmail;
