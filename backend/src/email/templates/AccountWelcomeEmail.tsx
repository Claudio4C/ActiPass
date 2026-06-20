import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout, ctaButton, heading, paragraph } from './EmailLayout';

export interface AccountWelcomeEmailProps {
  firstname: string;
  dashboardUrl: string;
}

export const AccountWelcomeEmail: React.FC<AccountWelcomeEmailProps> = ({
  firstname,
  dashboardUrl,
}) => (
  <EmailLayout previewText={`Bienvenue ${firstname} sur Ikivio !`}>
    <Text style={heading}>Bienvenue {firstname} !</Text>
    <Text style={paragraph}>
      Votre compte <strong>Ikivio</strong> a été vérifié avec succès. Vous pouvez maintenant
      profiter de toutes nos fonctionnalités pour gérer votre association : membres, événements,
      paiements, communication et rapports.
    </Text>
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Button href={dashboardUrl} style={ctaButton}>
        Accéder à mon tableau de bord
      </Button>
    </Section>
  </EmailLayout>
);

export default AccountWelcomeEmail;
