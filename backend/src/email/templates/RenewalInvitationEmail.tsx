import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout, ctaButton, heading, paragraph } from './EmailLayout';

export interface RenewalInvitationEmailProps {
  firstname: string;
  organisationName: string;
  seasonName: string;
  deadline?: string;
  ctaUrl: string;
  unsubscribeUrl?: string;
}

export const RenewalInvitationEmail: React.FC<RenewalInvitationEmailProps> = ({
  firstname,
  organisationName,
  seasonName,
  deadline,
  ctaUrl,
  unsubscribeUrl,
}) => (
  <EmailLayout
    previewText={`Renouvelez votre adhésion à ${organisationName}`}
    unsubscribeUrl={unsubscribeUrl}
  >
    <Text style={heading}>C'est l'heure de renouveler !</Text>
    <Text style={paragraph}>
      Bonjour {firstname}, la saison <strong>{seasonName}</strong> arrive à son terme chez{' '}
      <strong>{organisationName}</strong>. Renouvelez votre adhésion pour continuer à profiter de
      vos activités sans interruption.
    </Text>
    {deadline && (
      <Text style={paragraph}>
        Pensez-y avant le <strong>{deadline}</strong>.
      </Text>
    )}
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Button href={ctaUrl} style={ctaButton}>
        Renouveler mon adhésion
      </Button>
    </Section>
  </EmailLayout>
);

export default RenewalInvitationEmail;
