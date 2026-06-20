import * as React from 'react';

import { WelcomeEmail, WelcomeEmailProps } from './WelcomeEmail';
import { PaymentReceivedEmail, PaymentReceivedEmailProps } from './PaymentReceivedEmail';
import { DocumentDecisionEmail, DocumentDecisionEmailProps } from './DocumentDecisionEmail';
import { EventReminderEmail, EventReminderEmailProps } from './EventReminderEmail';
import { RenewalInvitationEmail, RenewalInvitationEmailProps } from './RenewalInvitationEmail';
import { VerificationEmail, VerificationEmailProps } from './VerificationEmail';
import { PasswordResetEmail, PasswordResetEmailProps } from './PasswordResetEmail';
import { AccountWelcomeEmail, AccountWelcomeEmailProps } from './AccountWelcomeEmail';

export {
  WelcomeEmail,
  PaymentReceivedEmail,
  DocumentDecisionEmail,
  EventReminderEmail,
  RenewalInvitationEmail,
  VerificationEmail,
  PasswordResetEmail,
  AccountWelcomeEmail,
};

export interface EmailTemplateDataMap {
  WelcomeEmail: WelcomeEmailProps;
  PaymentReceivedEmail: PaymentReceivedEmailProps;
  DocumentDecisionEmail: DocumentDecisionEmailProps;
  EventReminderEmail: EventReminderEmailProps;
  RenewalInvitationEmail: RenewalInvitationEmailProps;
  VerificationEmail: VerificationEmailProps;
  PasswordResetEmail: PasswordResetEmailProps;
  AccountWelcomeEmail: AccountWelcomeEmailProps;
}

export type EmailTemplateName = keyof EmailTemplateDataMap;

export const emailTemplateComponents: {
  [K in EmailTemplateName]: React.FC<EmailTemplateDataMap[K]>;
} = {
  WelcomeEmail,
  PaymentReceivedEmail,
  DocumentDecisionEmail,
  EventReminderEmail,
  RenewalInvitationEmail,
  VerificationEmail,
  PasswordResetEmail,
  AccountWelcomeEmail,
};
