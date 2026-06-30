import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout, ctaButton, heading, paragraph } from './EmailLayout';

export interface MembershipRejectedEmailProps {
  firstname: string;
  organisationName: string;
  reason?: string;
  ctaUrl: string;
  unsubscribeUrl?: string;
}

export const MembershipRejectedEmail: React.FC<MembershipRejectedEmailProps> = ({
  firstname,
  organisationName,
  reason,
  ctaUrl,
  unsubscribeUrl,
}) => (
  <EmailLayout
    previewText={`Votre demande d'adhésion à ${organisationName}`}
    unsubscribeUrl={unsubscribeUrl}
  >
    <Text style={heading}>Bonjour {firstname},</Text>
    <Text style={paragraph}>
      Nous vous informons que votre demande d'adhésion à{' '}
      <strong>{organisationName}</strong> n'a pas pu être acceptée.
    </Text>
    {reason && (
      <Section
        style={{
          backgroundColor: '#fef2f2',
          borderLeft: '4px solid #ef4444',
          borderRadius: '8px',
          margin: '0 0 16px',
          padding: '12px 16px',
        }}
      >
        <Text style={{ ...paragraph, margin: 0, color: '#991b1b' }}>
          <strong>Motif :</strong> {reason}
        </Text>
      </Section>
    )}
    <Text style={paragraph}>
      Si vous pensez qu'il s'agit d'une erreur ou souhaitez obtenir plus
      d'informations, n'hésitez pas à contacter directement le club.
    </Text>
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Button href={ctaUrl} style={ctaButton}>
        Découvrir d'autres clubs
      </Button>
    </Section>
  </EmailLayout>
);

export default MembershipRejectedEmail;
