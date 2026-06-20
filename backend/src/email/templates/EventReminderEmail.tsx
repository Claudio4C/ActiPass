import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout, ctaButton, heading, paragraph } from './EmailLayout';

export interface EventReminderEmailProps {
  firstname: string;
  eventTitle: string;
  eventDate: string;
  location?: string;
  ctaUrl: string;
  unsubscribeUrl?: string;
}

export const EventReminderEmail: React.FC<EventReminderEmailProps> = ({
  firstname,
  eventTitle,
  eventDate,
  location,
  ctaUrl,
  unsubscribeUrl,
}) => (
  <EmailLayout previewText={`Rappel : ${eventTitle} demain`} unsubscribeUrl={unsubscribeUrl}>
    <Text style={heading}>Rappel de séance</Text>
    <Text style={paragraph}>
      Bonjour {firstname}, on vous attend bientôt pour <strong>{eventTitle}</strong>.
    </Text>
    <Section
      style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '16px 20px',
        margin: '0 0 16px',
      }}
    >
      <Text style={{ ...paragraph, margin: location ? '0 0 6px' : 0 }}>
        <strong>Quand :</strong> {eventDate}
      </Text>
      {location && (
        <Text style={{ ...paragraph, margin: 0 }}>
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

export default EventReminderEmail;
