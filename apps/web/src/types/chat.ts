import type { MessageSummary } from '@chat/shared';

export interface PendingMessage extends MessageSummary {
  pending?: boolean;
  failed?: boolean;
}
