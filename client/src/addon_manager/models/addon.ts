import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import { CONFIG_FILENAME, INFO_FILENAME, LIBRARY_SETTING } from "../config";
import { AddonConfig, AddonInfo } from "../types/addon";
import { WebVue } from "../panels/WebVue";
import {
    applyAddonSettings,
    getLibraries,
    revokeAddonSettings,
    setSetting,
} from "../services/settings.service";
import { git } from "../services/git.service";
import filesystem from "../services/filesystem.service";
import { DiffResultBinaryFile, DiffResultTextFile } from "simple-git";

const localLogger = createChildLogger("Addon");

export class Addon {
    readonly name: string;
    readonly uri: vscode.Uri;

    #displayName?: string;
    /** The description defined in the addon's `config.json`. */
    #description?: string;
    /** The size of the addon in bytes. */
    #size?: number;
    /** Whether or not this addon has a `plugin.lua`. */
    #hasPlugin?: boolean;
    /** Whether or not this addon is currently processing an operation. */
    #processing?: boolean;

    /** Whether or not this addon is enabled. */
    #enabled?: boolean;
    /** A unix timestamp (milliseconds) of when this addon was installed. */
    #installTimestamp?: number;
    /** Whether or not this addon has an update available from GitHub. */
    #hasUpdate?: boolean;
    /** The settings to apply when this addon is enabled. */
    #settings?: Record<string, unknown>;

    constructor(name: string, path: vscode.Uri) {
        this.name = name;
        this.uri = path;

        this.#hasUpdate = false;
    }

    /** Fetch addon info from `info.json` */
    public async fetchInfo() {
        const path = vscode.Uri.joinPath(this.uri, INFO_FILENAME);
        const rawInfo = await filesystem.readFile(path);
        const info = JSON.parse(rawInfo) as AddonInfo;

        this.#displayName = info.name;
        this.#description = info.description;
        this.#size = info.size;
        this.#hasPlugin = info.hasPlugin;

        return {
            name: info.name,
            description: info.description,
            size: info.size,
            hasPlugin: info.hasPlugin,
        };
    }

    public async getConfig() {
        const configURI = vscode.Uri.joinPath(
            this.uri,
            "module",
            CONFIG_FILENAME
        );
        const rawConfig = await filesystem.readFile(configURI);
        const config = JSON.parse(rawConfig);

        return config as AddonConfig;
    }

    public async update() {
        const path = this.uri.path.substring(1);
        return git
            .submoduleUpdate([path])
            .then((message) => localLogger.debug(message));
    }

    public async getIsEnabled(libraryPaths?: string[]) {
        const regex = new RegExp(
            `/sumneko.lua/addonManager/addons/${this.name}`,
            "g"
        );

        if (!libraryPaths) libraryPaths = await getLibraries();
        const index = libraryPaths.findIndex((path) => regex.test(path));
        return index !== -1;
    }

    public async enable() {
        const libraryPaths = await getLibraries();

        const enabled = await this.getIsEnabled(libraryPaths);
        if (enabled) {
            localLogger.warn(`${this.name} is already enabled`);
            this.#enabled = true;
            return;
        }

        // Init submodule
        const path = this.uri.path.substring(1);
        try {
            await git.submoduleInit([path]);
            localLogger.debug("Initialized submodule");
        } catch (e) {
            localLogger.error(e);
            return;
        }

        try {
            await git.submoduleUpdate([path]);
            localLogger.debug("Submodule up to date");
        } catch (e) {
            localLogger.error(e);
            return;
        }

        // Apply setting for Language Server
        const libraryUri = vscode.Uri.joinPath(this.uri, "module", "library");
        const libraryPath = libraryUri.path.substring(1);
        libraryPaths.push(libraryPath);

        const configValues = await this.getConfig();

        try {
            await setSetting(LIBRARY_SETTING, libraryPaths);
            await applyAddonSettings(configValues.settings);
        } catch (e) {
            localLogger.warn(`Failed to apply settings of "${this.name}"`);
            return;
        }

        this.#enabled = true;
        localLogger.info(`Enabled "${this.name}"`);

        return this.setLock(false);
    }

    public async disable() {
        const libraryPaths = await getLibraries();
        const regex = new RegExp(
            `/sumneko.lua/addonManager/addons/${this.name}`,
            "g"
        );
        const index = libraryPaths.findIndex((path) => regex.test(path));

        if (index === -1) {
            localLogger.warn(`"${this.name}" is already disabled`);
            this.#enabled = false;
            return;
        }

        // Remove setting for Language Server
        libraryPaths.splice(index);
        const configValues = await this.getConfig();

        // Revoke settings
        try {
            await setSetting(LIBRARY_SETTING, libraryPaths);
            await revokeAddonSettings(configValues.settings);
        } catch (e) {
            localLogger.error(`Failed to revoke settings of "${this.name}"`);
            return;
        }

        // Remove submodule
        try {
            const moduleURI = vscode.Uri.joinPath(this.uri, "module");
            await filesystem.deleteFile(moduleURI, {
                recursive: true,
                useTrash: false,
            });
        } catch (e) {
            localLogger.error(`Failed to uninstall "${this.name}"`);
            return;
        }

        this.#enabled = false;
        localLogger.info(`Disabled "${this.name}"`);

        return this.setLock(false);
    }

    /** Convert this addon to an object ready for sending to WebVue. */
    public async toJSON() {
        const { name, description, size, hasPlugin } = await this.fetchInfo();
        const enabled = await this.getIsEnabled();
        const installTimestamp = (await git.log()).latest.date;
        const hasUpdate = this.#hasUpdate;

        return {
            name: this.name,
            displayName: name,
            description,
            enabled,
            hasPlugin,
            installTimestamp,
            size,
            hasUpdate,
            processing: this.#processing,
        };
    }

    public checkForUpdate(modified: DiffResultTextFile[]) {
        this.#hasUpdate = false;
        if (
            modified.findIndex((modifiedItem) =>
                modifiedItem.file.includes(this.name)
            ) !== -1
        ) {
            localLogger.info(`Found update for "${this.name}"`);
            this.#hasUpdate = true;
        }
        return this.#hasUpdate;
    }

    public async setLock(state: boolean) {
        this.#processing = state;
        return this.sendToWebVue();
    }

    /** Send this addon to WebVue. */
    public async sendToWebVue() {
        WebVue.sendMessage("addAddon", { addons: await this.toJSON() });
    }
}
