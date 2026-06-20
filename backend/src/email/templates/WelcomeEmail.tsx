import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout, ctaButton, heading, paragraph } from './EmailLayout';

export interface WelcomeEmailProps {
  firstname: string;
  organisationName: string;
  ctaUrl: string;
  unsubscribeUrl?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  firstname,
  organisationName,
  ctaUrl,
  unsubscribeUrl,
}) => (
  <EmailLayout previewText={`Bienvenue chez ${organisationName} !`} unsubscribeUrl={unsubscribeUrl}>
    <Text style={heading}>Bienvenue {firstname} !</Text>
    <Text style={paragraph}>
      Votre adhésion à <strong>{organisationName}</strong> est confirmée. Vous pouvez dès
      maintenant accéder à votre espace membre pour consulter le planning, vos documents et vos
      prochains événements.
    </Text>
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Button href={ctaUrl} style={ctaButton}>
        Accéder à mon espace
      </Button>
    </Section>
  </EmailLayout>
);

export default WelcomeEmail;
