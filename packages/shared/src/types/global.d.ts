import type { MessageCreate, MessageDelete, MessageUpdate } from './gateway.ts';

declare global {
  interface WindowEventMap {
    gateway_message_create: CustomEvent<MessageCreate>;
    gateway_message_update: CustomEvent<MessageUpdate>;
    gateway_message_delete: CustomEvent<MessageDelete>;
  }
}
