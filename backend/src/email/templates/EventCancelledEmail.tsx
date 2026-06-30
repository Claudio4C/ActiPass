import { Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout, heading, paragraph } from './EmailLayout';

export interface EventCancelledEmailProps {
  firstname: string;
  eventTitle: string;
  eventDate: string;
  refunded?: boolean;
  unsubscribeUrl?: string;
}

export const EventCancelledEmail: React.FC<EventCancelledEmailProps> = ({
  firstname,
  eventTitle,
  eventDate,
  refunded,
  unsubscribeUrl,
}) => (
  <EmailLayout
    previewText={`Annulation : ${eventTitle}`}
    unsubscribeUrl={unsubscribeUrl}
  >
    <Text style={heading}>Événement annulé</Text>
    <Text style={paragraph}>
      Bonjour {firstname}, nous vous informons que l'événement{' '}
      <strong>{eventTitle}</strong> a été annulé.
    </Text>
    <Section
      style={{
        backgroundColor: '#fef2f2',
        borderLeft: '4px solid #ef4444',
        borderRadius: '8px',
        padding: '12px 16px',
        margin: '0 0 16px',
      }}
    >
      <Text style={{ ...paragraph, margin: 0, color: '#991b1b' }}>
        <strong>Date prévue :</strong> {eventDate}
      </Text>
    </Section>
    {refunded && (
      <Text style={paragraph}>
        Si vous aviez réglé votre place, un remboursement sera effectué
        automatiquement dans les prochains jours.
      </Text>
    )}
    <Text style={{ ...paragraph, marginBottom: 0 }}>
      Nous nous excusons pour la gêne occasionnée.
    </Text>
  </EmailLayout>
);

export default EventCancelledEmail;
