import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import {
    ADDONS_DIRECTORY,
    CONFIG_FILENAME,
    PLUGIN_FILENAME,
    REPOSITORY_NAME,
    REPOSITORY_OWNER,
} from "../config";
import { Addon, AddonConfig } from "../types/addon";
import GitHub from "../services/github.service";
import dayjs from "dayjs";
import filesystem from "../services/filesystem.service";
import { WebVue } from "../panels/WebVue";

const localLogger = createChildLogger("Remote Addon");

/** An addon (directory) from the [official GitHub repository](https://github.com/carsakiller/LLS-Addons).
 *
 * Its data needs to be retrieved asynchronously using the GitHub Rest API.
 */
export class RemoteAddon implements Addon {
    /** Name of the addon. */
    readonly name: string;
    /** A uri that points to this addon directory in the GitHub API. */
    readonly uri: vscode.Uri;
    /** The [sha hash](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects#Tree-Objects) for this addon directory in the remote git tree. */
    readonly sha: string;

    /** The display name defined in the addon's `config.json`. */
    #displayName?: string;
    /** The description defined in the addon's `config.json`. */
    #description?: string;
    /** The size of the addon in bytes. */
    #size?: number;
    /** Whether or not this addon has a `plugin.lua`. */
    #hasPlugin?: boolean;

    /** A unix timestamp (milliseconds) of when the latest commit for this
     * addon was. This is used for version checking.*/
    #latestCommitTimestamp?: number;
    /** A flat array containing the Git tree for this addon. */
    #tree?: GitHub.repos.GitTreeNode[];

    constructor(node: GitHub.repos.GitTreeNode) {
        this.name = node.path;
        this.uri = vscode.Uri.parse(node.url, true);
        this.sha = node.url.split("/").at(-1);
    }

    /** Convert this addon to an object ready for sending to WebVue. */
    public async toJSON() {
        const { displayName, description } = await this.getConfig();
        const { size, hasPlugin } = await this.getTree();
        const latestCommitTimestamp = await this.getLatestCommit();

        return {
            name: this.name,
            sha: this.sha,
            uri: this.uri.toString(),
            displayName,
            description,
            size,
            hasPlugin,
            latestCommitTimestamp,
        };
    }

    /** Send this addon to WebVue. */
    public async sendToWebVue() {
        WebVue.sendMessage("addRemoteAddon", await this.toJSON());
    }

    /** Get the values from the `config.json` for this addon from GitHub. */
    public async getConfig() {
        if (this.#displayName && this.#description)
            return {
                displayName: this.#displayName,
                description: this.#description,
            };

        const path = `${ADDONS_DIRECTORY}/${this.name}/${CONFIG_FILENAME}`;

        try {
            const config = await GitHub.repos.downloadFile<AddonConfig>(
                REPOSITORY_OWNER,
                REPOSITORY_NAME,
                path,
                "json"
            );

            this.#displayName = config.name;
            this.#description = config.description;

            return {
                displayName: config.name,
                description: config.description,
            };
        } catch (e) {
            localLogger.warn(
                `Could not download configuration file for ${this.name}`
            );
            throw e;
        }
    }

    /** Get the git tree for this addon from GitHub. */
    public async getTree() {
        if (this.#tree && this.#size && this.#hasPlugin)
            return {
                tree: this.#tree,
                size: this.#size,
                hasPlugin: this.#hasPlugin,
            };

        try {
            const result = await GitHub.repos.getTree(
                REPOSITORY_OWNER,
                REPOSITORY_NAME,
                this.sha,
                true
            );

            this.#tree = result.tree;

            this.#size = result.tree
                .filter((node) => node.type === "blob")
                .reduce((sum, node) => sum + node.size, 0);

            this.#hasPlugin = result.tree.some(
                (node) => node.path === PLUGIN_FILENAME
            );

            return {
                tree: this.#tree,
                size: this.#size,
                hasPlugin: this.#hasPlugin,
            };
        } catch (e) {
            localLogger.warn(`Could not get tree for ${this.name}`);
            throw e;
        }
    }

    /** Get the unix timestamp (milliseconds) of the latest commit for this addon from GitHub. */
    public async getLatestCommit() {
        if (this.#latestCommitTimestamp) return this.#latestCommitTimestamp;

        const path = `${ADDONS_DIRECTORY}/${this.name}/${CONFIG_FILENAME}`;

        try {
            const commits = await GitHub.repos.commits.list(
                REPOSITORY_OWNER,
                REPOSITORY_NAME,
                { per_page: 1, path }
            );

            // Get the timestamp (milliseconds) of the latest commit
            this.#latestCommitTimestamp = dayjs(
                commits[0].commit.committer.date
            ).valueOf();

            return this.#latestCommitTimestamp;
        } catch (e) {
            localLogger.warn(`Failed to get latest commit for ${this.name}`);
            throw e;
        }
    }

    /** Install this addon from GitHub. */
    public async install(addonInstallLocation: vscode.Uri) {
        const addonUri = vscode.Uri.joinPath(addonInstallLocation, this.name);
        const promises: Promise<void>[] = [];

        // Download files and create directories
        // Directories seem to always appear before their child items
        for (const item of this.#tree) {
            if (item.type === "blob") {
                const filePath = vscode.Uri.joinPath(addonUri, item.path);

                // Download content and write it to file
                promises.push(
                    GitHub.repos
                        .downloadFile<string>(
                            REPOSITORY_OWNER,
                            REPOSITORY_NAME,
                            `${ADDONS_DIRECTORY}/${this.name}/${item.path}`
                        )
                        .then((rawContents) =>
                            filesystem.writeFile(filePath, rawContents)
                        )
                );
            } else {
                const dirPath = vscode.Uri.joinPath(addonUri, item.path);
                await filesystem.createDirectory(dirPath);
            }
        }

        // Write version data to file
        return Promise.allSettled(promises).then(async () => {
            const uri = vscode.Uri.joinPath(addonUri, ".version");
            await filesystem.writeFile(uri, dayjs().valueOf().toString());
            return { name: this.name, uri: addonUri };
        });
    }
}
