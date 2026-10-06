// Generated from contracts/openapi.json. Do not edit; run npm run contracts:sync.
export interface paths {
    "/api/chats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Chats */
        get: operations["adminChats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/chats/{chat_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Chat */
        get: operations["adminChat"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/chats/{chat_id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Chat Messages */
        get: operations["adminChatMessages"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cron/media-cleanup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Cleanup */
        get: operations["mediaCleanup"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cron/media-jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Recover Media Jobs */
        get: operations["mediaJobRecovery"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/messages/{message_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Message */
        get: operations["adminMessage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Search */
        get: operations["adminSearch"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Stats */
        get: operations["adminStats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health */
        get: operations["health"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Ready */
        get: operations["readiness"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/mini-api/chats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Chats */
        get: operations["miniChats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/mini-api/chats/{chat_id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Chat Messages */
        get: operations["miniChatMessages"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/mini-api/media/{attachment_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Media */
        get: operations["miniMedia"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/mini-api/media/{attachment_id}/url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Media Url */
        get: operations["miniMediaUrl"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/mini-api/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Search */
        get: operations["miniSearch"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/telegram/webhook": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Webhook */
        post: operations["telegramWebhook"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** AdminAttachmentResponse */
        AdminAttachmentResponse: {
            /** Available */
            available: boolean;
            /** Expires At */
            expires_at?: string | null;
            /** File Name */
            file_name?: string | null;
            /** File Size */
            file_size?: number | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Local Path */
            local_path?: string | null;
            /** Mime Type */
            mime_type?: string | null;
            /** Saved By Reply */
            saved_by_reply: boolean;
            /** Stored Size Bytes */
            stored_size_bytes?: number | null;
            /** Type */
            type: string;
        };
        /** AdminChatPage */
        AdminChatPage: {
            /** Items */
            items: components["schemas"]["AdminChatResponse"][];
            /** Next Cursor */
            next_cursor?: string | null;
        };
        /** AdminChatResponse */
        AdminChatResponse: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Telegram Chat Id */
            telegram_chat_id: number;
            /** Title */
            title: string | null;
            /** Type */
            type: string;
            /** Username */
            username: string | null;
        };
        /** AdminMessageDetail */
        AdminMessageDetail: {
            /** Attachments */
            attachments: components["schemas"]["AdminAttachmentResponse"][];
            /** Caption */
            caption?: string | null;
            /**
             * Chat Id
             * Format: uuid
             */
            chat_id: string;
            /** Deleted At */
            deleted_at?: string | null;
            /** Edited At */
            edited_at?: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Is Deleted */
            is_deleted: boolean;
            /** Message Type */
            message_type: string;
            /** Reply To Message Id */
            reply_to_message_id?: string | null;
            /** Reply To Telegram Message Id */
            reply_to_telegram_message_id?: number | null;
            /** Sender User Id */
            sender_user_id?: string | null;
            /**
             * Sent At
             * Format: date-time
             */
            sent_at: string;
            /** Telegram Message Id */
            telegram_message_id: number;
            /** Text */
            text?: string | null;
            /** Unversioned Attachments */
            unversioned_attachments?: components["schemas"]["AttachmentResponse"][];
            /** Versions */
            versions?: components["schemas"]["MessageVersionResponse"][];
        };
        /** AdminMessagePage */
        AdminMessagePage: {
            /** Items */
            items: components["schemas"]["AdminMessageResponse"][];
            /** Next Cursor */
            next_cursor?: string | null;
        };
        /** AdminMessageResponse */
        AdminMessageResponse: {
            /** Attachments */
            attachments: components["schemas"]["AttachmentResponse"][];
            /** Caption */
            caption?: string | null;
            /**
             * Chat Id
             * Format: uuid
             */
            chat_id: string;
            /** Deleted At */
            deleted_at?: string | null;
            /** Edited At */
            edited_at?: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Is Deleted */
            is_deleted: boolean;
            /** Message Type */
            message_type: string;
            /** Reply To Message Id */
            reply_to_message_id?: string | null;
            /** Reply To Telegram Message Id */
            reply_to_telegram_message_id?: number | null;
            /** Sender User Id */
            sender_user_id?: string | null;
            /**
             * Sent At
             * Format: date-time
             */
            sent_at: string;
            /** Telegram Message Id */
            telegram_message_id: number;
            /** Text */
            text?: string | null;
            /** Unversioned Attachments */
            unversioned_attachments?: components["schemas"]["AttachmentResponse"][];
            /** Versions */
            versions?: components["schemas"]["MessageVersionResponse"][];
        };
        /** AdminSearchResponse */
        AdminSearchResponse: {
            /** Items */
            items: components["schemas"]["AdminMessageResponse"][];
        };
        /** AttachmentResponse */
        AttachmentResponse: {
            /** Available */
            available: boolean;
            /** Expires At */
            expires_at?: string | null;
            /** File Name */
            file_name?: string | null;
            /** File Size */
            file_size?: number | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Mime Type */
            mime_type?: string | null;
            /** Saved By Reply */
            saved_by_reply: boolean;
            /** Stored Size Bytes */
            stored_size_bytes?: number | null;
            /** Type */
            type: string;
        };
        /** CleanupResponse */
        CleanupResponse: {
            /** Deleted */
            deleted: number;
            /** Failed */
            failed: number;
        };
        /** ErrorResponse */
        ErrorResponse: {
            /** Detail */
            detail: string;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** HealthResponse */
        HealthResponse: {
            /**
             * Status
             * @constant
             */
            status: "ok";
        };
        /** MediaLinkResponse */
        MediaLinkResponse: {
            /** Direct */
            direct: boolean;
            /** Url */
            url: string;
            /** Valid Until */
            valid_until: string | null;
        };
        /** MessageVersionResponse */
        MessageVersionResponse: {
            /** Attachments */
            attachments: components["schemas"]["AttachmentResponse"][];
            /** Caption */
            caption?: string | null;
            /** Edited At */
            edited_at?: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Kind
             * @enum {string}
             */
            kind: "original" | "edit" | "legacy";
            /** Message Type */
            message_type?: string | null;
            /**
             * Observed At
             * Format: date-time
             */
            observed_at: string;
            /** Text */
            text?: string | null;
        };
        /** MiniChatPage */
        MiniChatPage: {
            /** Items */
            items: components["schemas"]["MiniChatResponse"][];
            /** Next Cursor */
            next_cursor?: string | null;
        };
        /** MiniChatResponse */
        MiniChatResponse: {
            /** Chat Type */
            chat_type: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Last Message At */
            last_message_at?: string | null;
            /** Title */
            title: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** MiniMessagePage */
        MiniMessagePage: {
            /** Items */
            items: components["schemas"]["MiniMessageResponse"][];
            /** Next Cursor */
            next_cursor?: string | null;
        };
        /** MiniMessageResponse */
        MiniMessageResponse: {
            /** Attachments */
            attachments: components["schemas"]["AttachmentResponse"][];
            /** Caption */
            caption?: string | null;
            /**
             * Chat Id
             * Format: uuid
             */
            chat_id: string;
            /** Deleted At */
            deleted_at?: string | null;
            /** Edited At */
            edited_at?: string | null;
            /**
             * Has Reply
             * @default false
             */
            has_reply: boolean;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Is Deleted */
            is_deleted: boolean;
            /** Is Outgoing */
            is_outgoing: boolean;
            /** Message Type */
            message_type: string;
            reply_to?: components["schemas"]["MiniReplyResponse"] | null;
            /** Reply To Telegram Message Id */
            reply_to_telegram_message_id?: number | null;
            /** Sender Name */
            sender_name: string;
            /**
             * Sent At
             * Format: date-time
             */
            sent_at: string;
            /** Telegram Message Id */
            telegram_message_id: number;
            /** Text */
            text?: string | null;
            /** Unversioned Attachments */
            unversioned_attachments?: components["schemas"]["AttachmentResponse"][];
            /** Versions */
            versions?: components["schemas"]["MessageVersionResponse"][];
        };
        /** MiniReplyResponse */
        MiniReplyResponse: {
            /** Attachments */
            attachments: components["schemas"]["AttachmentResponse"][];
            /** Caption */
            caption?: string | null;
            /**
             * Chat Id
             * Format: uuid
             */
            chat_id: string;
            /** Deleted At */
            deleted_at?: string | null;
            /** Edited At */
            edited_at?: string | null;
            /**
             * Has Reply
             * @default false
             */
            has_reply: boolean;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Is Deleted */
            is_deleted: boolean;
            /** Is Outgoing */
            is_outgoing: boolean;
            /** Message Type */
            message_type: string;
            /** Reply To Telegram Message Id */
            reply_to_telegram_message_id?: number | null;
            /** Sender Name */
            sender_name: string;
            /**
             * Sent At
             * Format: date-time
             */
            sent_at: string;
            /** Telegram Message Id */
            telegram_message_id: number;
            /** Text */
            text?: string | null;
        };
        /** MiniSearchResponse */
        MiniSearchResponse: {
            /** Items */
            items: components["schemas"]["MiniMessageResponse"][];
        };
        /** RecoveryResponse */
        RecoveryResponse: {
            /** Scheduled */
            scheduled: number;
        };
        /** StatsResponse */
        StatsResponse: {
            /** Messages Last 24 Hours */
            messages_last_24_hours: number;
            /** Messages Last 7 Days */
            messages_last_7_days: number;
            /** Total Chats */
            total_chats: number;
            /** Total Deleted Messages */
            total_deleted_messages: number;
            /** Total Edited Messages */
            total_edited_messages: number;
            /** Total Media Attachments */
            total_media_attachments: number;
            /** Total Stored Messages */
            total_stored_messages: number;
        };
        /** ValidationError */
        ValidationError: {
            /** Context */
            ctx?: Record<string, never>;
            /** Input */
            input?: unknown;
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
        };
        /** WebhookResponse */
        WebhookResponse: {
            /** Ok */
            ok: boolean;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    adminChats: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string | null;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminChatPage"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    adminChat: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                chat_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminChatResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    adminChatMessages: {
        parameters: {
            query?: {
                limit?: number;
                before?: string | null;
                after?: string | null;
                sender_id?: string | null;
                include_deleted?: boolean;
                cursor?: string | null;
            };
            header?: {
                authorization?: string | null;
            };
            path: {
                chat_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminMessagePage"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    mediaCleanup: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CleanupResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    mediaJobRecovery: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RecoveryResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    adminMessage: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                message_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminMessageDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    adminSearch: {
        parameters: {
            query: {
                q: string;
                chat_id?: string | null;
                sender_id?: string | null;
                date_from?: string | null;
                date_to?: string | null;
                include_deleted?: boolean;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminSearchResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    adminStats: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatsResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    health: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
        };
    };
    readiness: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
        };
    };
    miniChats: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string | null;
            };
            header?: {
                "x-telegram-init-data"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MiniChatPage"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    miniChatMessages: {
        parameters: {
            query?: {
                before?: string | null;
                limit?: number;
                cursor?: string | null;
            };
            header?: {
                "x-telegram-init-data"?: string | null;
            };
            path: {
                chat_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MiniMessagePage"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    miniMedia: {
        parameters: {
            query?: never;
            header?: {
                "x-telegram-init-data"?: string | null;
            };
            path: {
                attachment_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    miniMediaUrl: {
        parameters: {
            query?: never;
            header?: {
                "x-telegram-init-data"?: string | null;
            };
            path: {
                attachment_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MediaLinkResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    miniSearch: {
        parameters: {
            query: {
                q: string;
                limit?: number;
            };
            header?: {
                "x-telegram-init-data"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MiniSearchResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    telegramWebhook: {
        parameters: {
            query?: never;
            header?: {
                "x-telegram-bot-api-secret-token"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WebhookResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
