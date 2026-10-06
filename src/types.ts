import type { components } from './generated/api';

// Naming aliases only. All wire fields come from the backend OpenAPI contract.
export type Chat = components['schemas']['MiniChatResponse'];
export type Attachment = components['schemas']['AttachmentResponse'];
export type MessageVersion = components['schemas']['MessageVersionResponse'];
export type Message = components['schemas']['MiniMessageResponse'];
export type ReplyMessage = components['schemas']['MiniReplyResponse'];
export type ChatPage = components['schemas']['MiniChatPage'];
export type MessagePage = components['schemas']['MiniMessagePage'];
export type SearchResults = components['schemas']['MiniSearchResponse'];
export type MediaLink = components['schemas']['MediaLinkResponse'];
