import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout, ctaButton, heading, paragraph } from './EmailLayout';

export interface VerificationEmailProps {
  verificationUrl: string;
}

export const VerificationEmail: React.FC<VerificationEmailProps> = ({ verificationUrl }) => (
  <EmailLayout previewText="Vérifiez votre compte Ikivio">
    <Text style={heading}>Bienvenue !</Text>
    <Text style={paragraph}>
      Merci de vous être inscrit sur <strong>Ikivio</strong>. Pour activer votre compte et accéder
      à toutes nos fonctionnalités, veuillez vérifier votre adresse e-mail.
    </Text>
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Button href={verificationUrl} style={ctaButton}>
        Vérifier mon compte
      </Button>
    </Section>
    <Text style={paragraph}>
      Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte sur Ikivio, vous pouvez
      ignorer cet email en toute sécurité.
    </Text>
  </EmailLayout>
);

export default VerificationEmail;
