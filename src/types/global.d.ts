import type { Message } from './messages';

declare global {
  interface WindowEventMap {
    gateway_message: CustomEvent<Message>;
  }
}
