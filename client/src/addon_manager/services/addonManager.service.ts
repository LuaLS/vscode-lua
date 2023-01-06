import * as vscode from "vscode";
import filesystem from "./filesystem.service";
import { createChildLogger } from "./logging.service";
import { LocalAddon } from "../models/localAddon";
import { RemoteAddon } from "../models/remoteAddon";
import GitHub from "./github.service";
import {
    REPOSITORY_DEFAULT_BRANCH,
    REPOSITORY_NAME,
    REPOSITORY_OWNER,
} from "../config";

const localLogger = createChildLogger("Addon Manager");

class AddonManager {
    /** Map of currently installed addons */
    readonly localAddons: Map<string, LocalAddon>;
    /** Map of addons available in the official repository */
    readonly remoteAddons: Map<string, RemoteAddon>;

    constructor() {
        this.localAddons = new Map();
        this.remoteAddons = new Map();
    }

    /** Get an array of the names of enabled addons */
    public get enabledAddons() {
        return Array.from(this.localAddons.values()).filter(
            (addon) => addon.enabled
        );
    }

    /** Retrieve the list of all installed addons */
    public async fetchLocalAddons(installLocation: vscode.Uri) {
        const directoryNodes = await filesystem.readDirectory(installLocation);

        localLogger.verbose("Fetching local addons...");

        for (const node of directoryNodes) {
            // Ignore non-directories
            if (node.type !== vscode.FileType.Directory) {
                localLogger.warn(
                    `Non-directory item found in addons directory`
                );
                continue;
            }

            localLogger.verbose(`Found installed addon "${node.name}"`);

            const addon = new LocalAddon(node.name, node.uri);
            this.localAddons.set(addon.name, addon);
        }
        return this.localAddons;
    }

    /** Retrieve the list of all remote addons */
    public async fetchRemoteAddons() {
        localLogger.verbose("Fetching remote addons");

        const root = await GitHub.repos.tree.get(
            REPOSITORY_OWNER,
            REPOSITORY_NAME,
            REPOSITORY_DEFAULT_BRANCH
        );
        const addonsDirectory = root.tree.find(
            (node) => node.path === "addons"
        );

        if (!addonsDirectory) {
            const err = new Error(
                "Could not find addon directory in remote repository!"
            );
            localLogger.error(err);
            throw err;
        }

        const response = await GitHub.repos.tree.get(
            REPOSITORY_OWNER,
            REPOSITORY_NAME,
            addonsDirectory.sha
        );

        if (response.truncated)
            localLogger.warn("Remote addons list was truncated!");

        for (const node of response.tree) {
            if (node.type !== "tree") continue;

            const remoteAddon = new RemoteAddon(node);
            this.remoteAddons.set(remoteAddon.name, remoteAddon);
        }

        return this.remoteAddons;
    }

    /** Get a page of local addons */
    public getLocalAddonsPage(page: number, pageSize: number): LocalAddon[] {
        const start = (page - 1) * pageSize;
        const addons = Array.from(this.localAddons.values());

        addons.sort((a, b) => a.name.localeCompare(b.name));

        return addons.slice(start, start + pageSize);
    }
    /** Get a page of remote addons */
    public getRemoteAddonsPage(page: number, pageSize: number): RemoteAddon[] {
        const start = (page - 1) * pageSize;
        const addons = Array.from(this.remoteAddons.values());

        addons.sort((a, b) => a.name.localeCompare(b.name));

        return addons.slice(start, start + pageSize);
    }

    public async installAddon(name: string, location: vscode.Uri) {
        const addon = this.remoteAddons.get(name);
        const { uri } = await addon.install(location);
        const localAddon = new LocalAddon(name, uri);
        this.localAddons.set(name, localAddon);
        return localAddon;
    }

    public uninstallAddon(name: string) {
        const addon = this.localAddons.get(name);
        addon.uninstall();
        this.localAddons.delete(name);
    }
}

export default new AddonManager();
