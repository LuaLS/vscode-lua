/** `config.json` file structure for an addon */
export type AddonConfig = {
    name: string;
    description: string;
    settings: { [index: string]: Object };
};

export interface Addon {
    /** Name of the addon */
    name: string;

    /** Whether the addon is currently enabled or not */
    enabled: boolean;

    /** A description of the addon */
    description?: string;

    /** Size of the addon in bytes */
    size: number;

    /** Whether the tree was too large and was truncated */
    treeTruncated?: boolean;

    /** UNIX timestamp (milliseconds) of when the addon was committed */
    installDate?: number;

    /** If the addon includes a `plugin.lua` */
    hasPlugin?: boolean;
}
