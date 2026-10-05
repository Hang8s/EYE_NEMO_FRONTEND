export type Chat = { id: string; title: string; chat_type: string; updated_at: string; last_message_at?: string | null };
export type Attachment = { id: string; type: string; file_name?: string; mime_type?: string; available: boolean; saved_by_reply: boolean; expires_at?: string | null; stored_size_bytes?: number | null };
export type Message = { id: string; text?: string; caption?: string; message_type: string; sent_at: string; edited_at?: string; is_deleted: boolean; is_outgoing: boolean; sender_name: string; attachments: Attachment[]; has_reply?: boolean; reply_to_telegram_message_id?: number | null; reply_to?: ReplyMessage | null };
export type ReplyMessage = Omit<Message, 'reply_to'>;
export type Page<T> = { items: T[]; next_cursor?: string | null };
