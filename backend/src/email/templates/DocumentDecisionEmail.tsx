import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout, ctaButton, heading, paragraph } from './EmailLayout';

export interface DocumentDecisionEmailProps {
  firstname: string;
  documentName: string;
  approved: boolean;
  rejectionReason?: string;
  ctaUrl: string;
  unsubscribeUrl?: string;
}

export const DocumentDecisionEmail: React.FC<DocumentDecisionEmailProps> = ({
  firstname,
  documentName,
  approved,
  rejectionReason,
  ctaUrl,
  unsubscribeUrl,
}) => (
  <EmailLayout
    previewText={approved ? `${documentName} validé` : `${documentName} refusé`}
    unsubscribeUrl={unsubscribeUrl}
  >
    <Text style={heading}>{approved ? 'Document validé' : 'Document refusé'}</Text>
    <Text style={paragraph}>
      Bonjour {firstname}, votre document <strong>{documentName}</strong>{' '}
      {approved
        ? 'a été validé par votre club.'
        : "n'a pas pu être validé par votre club."}
    </Text>
    {!approved && rejectionReason && (
      <Section
        style={{
          backgroundColor: '#fef2f2',
          borderRadius: '12px',
          padding: '16px 20px',
          margin: '0 0 16px',
        }}
      >
        <Text style={{ ...paragraph, margin: 0, color: '#b91c1c' }}>
          <strong>Motif :</strong> {rejectionReason}
        </Text>
      </Section>
    )}
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Button href={ctaUrl} style={ctaButton}>
        {approved ? 'Voir mes documents' : 'Renvoyer un document'}
      </Button>
    </Section>
  </EmailLayout>
);

export default DocumentDecisionEmail;
