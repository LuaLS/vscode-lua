import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import {
    CONFIG_FILENAME,
    LIBRARY_SETTING_NAME,
    LIBRARY_SETTING_SECTION,
    PLUGIN_FILENAME,
} from "../config";
import filesystem from "../services/filesystem.service";
import { Addon, AddonConfig } from "../types/addon";
import { getSetting, setSetting } from "../services/settings.service";
import { WebVue } from "../panels/WebVue";
import addonManager from "../services/addonManager.service";

const localLogger = createChildLogger("Addon");

export class LocalAddon implements Addon {
    readonly uri: vscode.Uri;
    readonly name: string;

    #displayName?: string;
    #description?: string;
    #size?: number;
    #enabled?: boolean;
    #hasPlugin?: boolean;

    #installTimestamp?: number;
    #hasUpdate?: boolean;

    constructor(name: string, uri: vscode.Uri) {
        this.name = name;
        this.uri = uri;
        this.#enabled = undefined;
    }

    public set enabled(state: boolean) {
        let librarySetting: string[] = [];

        try {
            librarySetting = getSetting<string[]>(
                LIBRARY_SETTING_NAME,
                LIBRARY_SETTING_SECTION,
                []
            );
        } catch (e) {
            vscode.window
                .showInformationMessage(e, "Open Folder")
                .then((result) => {
                    if (!result) return;
                    vscode.commands.executeCommand(
                        "workbench.action.files.openFolder"
                    );
                });
            return;
        }

        const regex = new RegExp(`/sumneko.lua/addons/${this.name}`, "g");
        const index = librarySetting.findIndex((path) => regex.test(path));

        localLogger.info(index);

        if (state) {
            if (index > -1) {
                localLogger.warn(`${this.name} is already enabled!`);
                return;
            }
            const path = this.uri.path.substring(1);
            librarySetting.push(path);
            setSetting(
                LIBRARY_SETTING_NAME,
                LIBRARY_SETTING_SECTION,
                librarySetting
            );
        } else {
            if (index === -1) {
                localLogger.warn(`${this.name} is already disabled!`);
                return;
            }
            librarySetting.splice(index, 1);
            setSetting(
                LIBRARY_SETTING_NAME,
                LIBRARY_SETTING_SECTION,
                librarySetting
            );
        }

        localLogger.info(
            `${this.name} has been ${state ? "enabled" : "disabled"}!`
        );
    }

    public async toJSON() {
        const { displayName, description } = await this.getConfig();
        const enabled = await this.getEnabled();
        const hasPlugin = await this.getHasPlugin();
        const installTimestamp = await this.getVersionInfo();
        const size = await this.calculateSize();
        const hasUpdate = await this.hasUpdate();

        return {
            name: this.name,
            displayName,
            description,
            enabled,
            hasPlugin,
            installTimestamp,
            size,
            hasUpdate,
        };
    }

    public async sendToWebVue() {
        WebVue.sendMessage("addLocalAddon", await this.toJSON());
    }

    /** Get the `config.json` values for this addon */
    public async getConfig() {
        if (this.#displayName && this.#description)
            return {
                displayName: this.#displayName,
                description: this.#description,
            };

        try {
            const configURI = vscode.Uri.joinPath(this.uri, CONFIG_FILENAME);
            const rawConfig = await filesystem.readFile(configURI);
            const config = JSON.parse(rawConfig) as AddonConfig;

            this.#displayName = config.name;
            this.#description = config.description;

            return {
                displayName: config.name,
                description: config.description,
            };
        } catch (e) {
            localLogger.warn(`Failed to get config file for ${this.name}!`);
            throw e;
        }
    }

    /** Get the install timestamp (milliseconds) for this addon */
    public async getVersionInfo() {
        if (this.#installTimestamp) return this.#installTimestamp;

        try {
            const versionURI = vscode.Uri.joinPath(this.uri, ".version");
            const version = Number(await filesystem.readFile(versionURI));

            this.#installTimestamp = version;

            return version;
        } catch (e) {
            localLogger.warn(`Failed to get version info for ${this.name}!`);
        }
    }

    /** Get whether this addon has a plugin or not */
    public async getHasPlugin() {
        if (this.#hasPlugin) return this.#hasPlugin;

        try {
            const pluginURI = vscode.Uri.joinPath(this.uri, PLUGIN_FILENAME);
            const hasPlugin = await filesystem.exists(pluginURI);
            this.#hasPlugin = hasPlugin;
            return hasPlugin;
        } catch (e) {
            localLogger.warn(`Failed to check if ${this.name} has a plugin!`);
        }
    }

    /** Get whether this addon is enabled or not
     * @throws When a workspace is not open
     */
    public async getEnabled(librarySetting?: string[]) {
        try {
            const regex = new RegExp(`sumneko.lua\/addons\/${this.name}`, "g");

            if (!librarySetting) {
                librarySetting = getSetting(
                    LIBRARY_SETTING_NAME,
                    LIBRARY_SETTING_SECTION,
                    []
                ) as string[];
            }

            const enabled = librarySetting.some((path) => regex.test(path));
            this.#enabled = enabled;
            return enabled;
        } catch (e) {
            localLogger.warn(`Failed to get enabled state of ${this.name}!`);
            throw e;
        }
    }

    /** Calculate the size of this addon. A relatively slow process due to it having to recurse through the entire directory */
    public async calculateSize() {
        if (this.#size) return this.#size;

        try {
            const size = await filesystem.getDirectorySize(this.uri);
            this.#size = size;
            return size;
        } catch (e) {
            localLogger.warn(`Failed to calculate size of ${this.name}!`);
        }
    }

    public async hasUpdate() {
        if (this.#hasUpdate) return this.#hasUpdate;

        const remoteVersion = Array.from(
            addonManager.remoteAddons.values()
        ).find((remote) => remote.name === this.name);

        if (!remoteVersion) {
            localLogger.warn(`Remote version of "${this.name}" not found!`);
            return;
        }

        const remoteTimestamp = await remoteVersion.getLatestCommit();
        const localTimestamp = await this.getVersionInfo();

        if (remoteTimestamp > localTimestamp) {
            localLogger.info(`Update available for "${this.name}"`);
            return true;
        }

        return false;
    }

    /** Uninstalls this addon */
    public async uninstall() {
        localLogger.info(`Uninstalling "${this.name}"`);
        return filesystem.deleteFile(this.uri, {
            recursive: true,
            useTrash: true,
        });
    }
}
