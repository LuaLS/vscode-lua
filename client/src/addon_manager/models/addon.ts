import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import { CONFIG_FILENAME, INFO_FILENAME, LIBRARY_SETTING } from "../config";
import { AddonConfig, AddonInfo } from "../types/addon";
import { WebVue } from "../panels/WebVue";
import {
    applyAddonSettings,
    getLibraryPaths,
    revokeAddonSettings,
} from "../services/settings.service";
import { git } from "../services/git.service";
import filesystem from "../services/filesystem.service";
import { DiffResultTextFile } from "simple-git";
import { getConfig, setConfig } from "../../languageserver";

const localLogger = createChildLogger("Addon");

export class Addon {
    readonly name: string;
    readonly uri: vscode.Uri;

    #displayName?: string;
    /** Whether or not this addon is currently processing an operation. */
    #processing?: boolean;
    /** The workspace folders that this addon is enabled in. */
    #enabled: boolean[];
    /** Whether or not this addon has an update available from git. */
    #hasUpdate?: boolean;
    /** Whether or not this addon is installed */
    #installed: boolean;

    constructor(name: string, path: vscode.Uri) {
        this.name = name;
        this.uri = path;

        this.#enabled = [];
        this.#hasUpdate = false;
        this.#installed = false;
    }

    public get displayName() {
        return this.#displayName ?? this.name;
    }

    /** Fetch addon info from `info.json` */
    public async fetchInfo() {
        const path = vscode.Uri.joinPath(this.uri, INFO_FILENAME);
        const rawInfo = await filesystem.readFile(path);
        const info = JSON.parse(rawInfo) as AddonInfo;

        this.#displayName = info.name;

        return {
            name: info.name,
            description: info.description,
            size: info.size,
            hasPlugin: info.hasPlugin,
        };
    }

    /** Get the `config.json` for this addon. */
    public async getConfigurationFile() {
        const configURI = vscode.Uri.joinPath(
            this.uri,
            "module",
            CONFIG_FILENAME
        );

        try {
            const rawConfig = await filesystem.readFile(configURI);
            const config = JSON.parse(rawConfig);
            return config as AddonConfig;
        } catch (e) {
            localLogger.error(
                `Failed to read config.json file for ${this.name} (${e})`
            );
            throw e;
        }
    }

    /** Update this addon using git. */
    public async update() {
        return git
            .submoduleUpdate([this.uri.fsPath])
            .then((message) => localLogger.debug(message));
    }

    /** Check whether this addon is enabled, given an array of enabled library paths.
     * @param libraryPaths An array of paths from the `Lua.workspace.library` setting.
     */
    public checkIfEnabled(libraryPaths: string[]) {
        const regex = new RegExp(
            `[/\\\\]+sumneko.lua[/\\\\]+addonManager[/\\\\]+addons[/\\\\]+${this.name}`,
            "g"
        );

        const index = libraryPaths.findIndex((path) => regex.test(path));
        return index !== -1;
    }

    /** Get the enabled state for this addon in all opened workspace folders */
    public async getEnabled() {
        const folders = await getLibraryPaths();

        // Check all workspace folders for a path that matches this addon
        const folderStates = folders.map((entry) => {
            return {
                folder: entry.folder,
                enabled: this.checkIfEnabled(entry.paths),
            };
        });

        folderStates.forEach(
            (entry) => (this.#enabled[entry.folder.index] = entry.enabled)
        );

        const moduleURI = vscode.Uri.joinPath(this.uri, "module");
        this.#installed =
            (await filesystem.exists(moduleURI)) &&
            (await filesystem.readDirectory(moduleURI, { recursive: false }))
                .length > 0;

        return folderStates;
    }

    public async enable(folder: vscode.WorkspaceFolder) {
        const librarySetting = ((await getConfig(
            LIBRARY_SETTING,
            folder.uri
        )) ?? []) as string[];

        const enabled = await this.checkIfEnabled(librarySetting);
        if (enabled) {
            localLogger.warn(`${this.name} is already enabled`);
            this.#enabled[folder.index] = true;
            return;
        }

        // Init submodule
        try {
            await git.submoduleInit([this.uri.fsPath]);
            localLogger.debug("Initialized submodule");
        } catch (e) {
            localLogger.warn(`Unable to initialize submodule for ${this.name}`);
            localLogger.warn(e);
            throw e;
        }

        try {
            await git.submoduleUpdate([this.uri.fsPath]);
            localLogger.debug("Submodule up to date");
        } catch (e) {
            localLogger.warn(`Unable to update submodule for ${this.name}`);
            localLogger.warn(e);
            throw e;
        }

        // Apply addon settings
        const libraryUri = vscode.Uri.joinPath(this.uri, "module", "library");

        const configValues = await this.getConfigurationFile();

        try {
            await setConfig([
                {
                    action: "add",
                    key: LIBRARY_SETTING,
                    value: filesystem.unixifyPath(libraryUri),
                    uri: folder.uri,
                },
            ]);
            if (configValues.settings) {
                await applyAddonSettings(folder, configValues.settings);
                localLogger.info(`Applied addon settings for ${this.name}`);
            }
        } catch (e) {
            localLogger.warn(`Failed to apply settings of "${this.name}"`);
            localLogger.warn(e);
            return;
        }

        this.#enabled[folder.index] = true;
        localLogger.info(`Enabled "${this.name}"`);
    }

    public async disable(folder: vscode.WorkspaceFolder, silent = false) {
        const librarySetting = ((await getConfig(
            LIBRARY_SETTING,
            folder.uri
        )) ?? []) as string[];

        const regex = new RegExp(
            `[/\\\\]+sumneko.lua[/\\\\]+addonManager[/\\\\]+addons[/\\\\]+${this.name}`,
            "g"
        );
        const index = librarySetting.findIndex((path) => regex.test(path));

        if (index === -1) {
            if (!silent) localLogger.warn(`"${this.name}" is already disabled`);
            this.#enabled[folder.index] = false;
            return;
        }

        // Remove this addon from the library list
        librarySetting.splice(index, 1);
        const result = await setConfig([
            {
                action: "set",
                key: LIBRARY_SETTING,
                value: librarySetting,
                uri: folder.uri,
            },
        ]);
        if (!result) {
            localLogger.error(
                `Failed to update ${LIBRARY_SETTING} when disabling ${this.name}`
            );
            return;
        }

        // Remove addon settings if installed
        if (this.#installed) {
            const configValues = await this.getConfigurationFile();
            try {
                if (configValues.settings)
                    await revokeAddonSettings(folder, configValues.settings);
            } catch (e) {
                localLogger.error(
                    `Failed to revoke settings of "${this.name}"`
                );
                return;
            }
        }

        this.#enabled[folder.index] = false;
        localLogger.info(`Disabled "${this.name}"`);
    }

    public async uninstall() {
        for (const folder of vscode.workspace.workspaceFolders) {
            await this.disable(folder, true);
        }
        const moduleURI = vscode.Uri.joinPath(this.uri, "module");
        await filesystem.deleteFile(moduleURI, {
            recursive: true,
            useTrash: false,
        });
        localLogger.info(`Uninstalled ${this.name}`);
        this.#installed = false;
        this.setLock(false);
    }

    /** Convert this addon to an object ready for sending to WebVue. */
    public async toJSON() {
        await this.getEnabled();

        const { name, description, size, hasPlugin } = await this.fetchInfo();
        const enabled = this.#enabled;
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
            installed: this.#installed,
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

    /** Get a list of options for a quick picker that lists the workspace
     * folders that the addon is enabled/disabled in.
     * @param enabledState The state the addon must be in in a folder to be included.
     * `true` will only return the folders that the addon is **enabled** in.
     * `false` will only return the folders that the addon is **disabled** in
     */
    public async getQuickPickerOptions(enabledState: boolean) {
        return (await this.getEnabled())
            .filter((entry) => entry.enabled === enabledState)
            .map((entry) => {
                return {
                    label: entry.folder.name,
                    detail: entry.folder.uri.path,
                };
            });
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
