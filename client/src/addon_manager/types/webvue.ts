export interface WebVueMessage {
    command: string;
    data: { [index: string]: unknown };
}

export enum NotificationLevels {
    "error",
    "warn",
    "info",
}

export type Notification = {
    level: NotificationLevels;
    message: string;
};
