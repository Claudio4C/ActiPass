import * as React from 'react';

import { WelcomeEmail, WelcomeEmailProps } from './WelcomeEmail';
import { PaymentReceivedEmail, PaymentReceivedEmailProps } from './PaymentReceivedEmail';
import { DocumentDecisionEmail, DocumentDecisionEmailProps } from './DocumentDecisionEmail';
import { EventReminderEmail, EventReminderEmailProps } from './EventReminderEmail';
import { RenewalInvitationEmail, RenewalInvitationEmailProps } from './RenewalInvitationEmail';
import { VerificationEmail, VerificationEmailProps } from './VerificationEmail';
import { PasswordResetEmail, PasswordResetEmailProps } from './PasswordResetEmail';
import { AccountWelcomeEmail, AccountWelcomeEmailProps } from './AccountWelcomeEmail';
import { MembershipRejectedEmail, MembershipRejectedEmailProps } from './MembershipRejectedEmail';
import { PaymentReminderEmail, PaymentReminderEmailProps } from './PaymentReminderEmail';
import { EventCancelledEmail, EventCancelledEmailProps } from './EventCancelledEmail';
import { WaitlistPromotedEmail, WaitlistPromotedEmailProps } from './WaitlistPromotedEmail';
import { BroadcastEmail, BroadcastEmailProps } from './BroadcastEmail';

export {
  WelcomeEmail,
  PaymentReceivedEmail,
  DocumentDecisionEmail,
  EventReminderEmail,
  RenewalInvitationEmail,
  VerificationEmail,
  PasswordResetEmail,
  AccountWelcomeEmail,
  MembershipRejectedEmail,
  PaymentReminderEmail,
  EventCancelledEmail,
  WaitlistPromotedEmail,
  BroadcastEmail,
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
  MembershipRejectedEmail: MembershipRejectedEmailProps;
  PaymentReminderEmail: PaymentReminderEmailProps;
  EventCancelledEmail: EventCancelledEmailProps;
  WaitlistPromotedEmail: WaitlistPromotedEmailProps;
  BroadcastEmail: BroadcastEmailProps;
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
  MembershipRejectedEmail,
  PaymentReminderEmail,
  EventCancelledEmail,
  WaitlistPromotedEmail,
  BroadcastEmail,
};
