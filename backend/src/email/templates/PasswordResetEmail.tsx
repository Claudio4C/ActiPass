import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout, ctaButton, heading, paragraph } from './EmailLayout';

export interface PasswordResetEmailProps {
  resetUrl: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({ resetUrl }) => (
  <EmailLayout previewText="Réinitialisez votre mot de passe Ikivio">
    <Text style={heading}>Réinitialisation de mot de passe</Text>
    <Text style={paragraph}>
      Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte{' '}
      <strong>Ikivio</strong>.
    </Text>
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Button href={resetUrl} style={ctaButton}>
        Réinitialiser mon mot de passe
      </Button>
    </Section>
    <Text style={paragraph}>
      Ce lien expire dans 24 heures et ne peut être utilisé qu'une seule fois. Si vous n'avez pas
      demandé cette réinitialisation, ignorez cet email — votre mot de passe actuel reste inchangé.
    </Text>
  </EmailLayout>
);

export default PasswordResetEmail;
