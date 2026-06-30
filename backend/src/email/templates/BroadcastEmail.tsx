import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout, ctaButton, heading, paragraph } from './EmailLayout';

export interface BroadcastEmailProps {
  firstname: string;
  organisationName: string;
  subject: string;
  message: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
}

export const BroadcastEmail: React.FC<BroadcastEmailProps> = ({
  firstname,
  organisationName,
  subject,
  message,
  ctaUrl,
  unsubscribeUrl,
}) => (
  <EmailLayout
    previewText={`${subject} — ${organisationName}`}
    unsubscribeUrl={unsubscribeUrl}
  >
    <Text style={heading}>Bonjour {firstname},</Text>
    <Text style={{ ...paragraph, color: '#64748b', marginBottom: '8px' }}>
      Message de <strong>{organisationName}</strong>
    </Text>
    <Section
      style={{
        borderLeft: '3px solid #3b82f6',
        paddingLeft: '16px',
        margin: '20px 0',
        backgroundColor: '#f8fafc',
        borderRadius: '0 8px 8px 0',
        padding: '16px 16px 16px 20px',
      }}
    >
      <Text style={{ ...paragraph, margin: 0, whiteSpace: 'pre-wrap' }}>{message}</Text>
    </Section>
    {ctaUrl && (
      <Section style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={ctaUrl} style={ctaButton}>
          Voir mon espace club
        </Button>
      </Section>
    )}
  </EmailLayout>
);

export default BroadcastEmail;
