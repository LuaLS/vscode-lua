export interface WebVueMessage {
    command: string;
    data: { [index: string]: any };
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
