import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout, ctaButton, heading, paragraph } from './EmailLayout';

export interface WaitlistPromotedEmailProps {
  firstname: string;
  eventTitle: string;
  eventDate: string;
  location?: string;
  ctaUrl: string;
  unsubscribeUrl?: string;
}

export const WaitlistPromotedEmail: React.FC<WaitlistPromotedEmailProps> = ({
  firstname,
  eventTitle,
  eventDate,
  location,
  ctaUrl,
  unsubscribeUrl,
}) => (
  <EmailLayout
    previewText={`Une place s'est libérée pour ${eventTitle} !`}
    unsubscribeUrl={unsubscribeUrl}
  >
    <Text style={heading}>Bonne nouvelle, {firstname} !</Text>
    <Text style={paragraph}>
      Une place s'est libérée pour <strong>{eventTitle}</strong>. Vous étiez en liste
      d'attente — vous êtes maintenant inscrit(e) et votre place est confirmée.
    </Text>
    <Section
      style={{
        backgroundColor: '#f0fdf4',
        borderLeft: '4px solid #10b981',
        borderRadius: '8px',
        padding: '12px 16px',
        margin: '0 0 16px',
      }}
    >
      <Text style={{ ...paragraph, margin: location ? '0 0 6px' : 0, color: '#065f46' }}>
        <strong>Quand :</strong> {eventDate}
      </Text>
      {location && (
        <Text style={{ ...paragraph, margin: 0, color: '#065f46' }}>
          <strong>Où :</strong> {location}
        </Text>
      )}
    </Section>
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Button href={ctaUrl} style={ctaButton}>
        Voir l'événement
      </Button>
    </Section>
  </EmailLayout>
);

export default WaitlistPromotedEmail;
