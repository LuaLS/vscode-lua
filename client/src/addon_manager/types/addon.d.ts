import { Uri } from "vscode";

export type AddonConfig = {
    name: string;
    description: string;
    settings: { [index: string]: Object };
};

export type AddonInfo = {
    name: string;
    description: string;
    size: number;
    hasPlugin: boolean;
}

export interface Addon {
    readonly name: string;
    readonly uri: Uri;

    displayName?: string;
    description?: string;
    size?: number;
    hasPlugin?: boolean;
    processing?: boolean;
}
