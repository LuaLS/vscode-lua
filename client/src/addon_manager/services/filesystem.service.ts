import * as vscode from "vscode";
import { stringToByteArray } from "./string.service";
import { createChildLogger } from "./logging.service";
import { platform } from "os";

const localLogger = createChildLogger("Filesystem");

type ReadDirectoryOptions = {
    recursive?: boolean;
    maxDepth?: number;
    depth?: number;
};

namespace filesystem {
    /** Get a string representation of a URI using UNIX separators
     * @param uri The URI to get as a UNIX path string
     */
    export function unixifyPath(uri: vscode.Uri): string {
        if (platform() === "win32") {
            return uri.path.substring(1);
        } else {
            return uri.fsPath;
        }
    }

    /** Check if a file exists
     * @param uri - The URI of the file to check the existence of
     */
    export async function exists(uri: vscode.Uri): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(uri);
            return true;
        } catch (e) {
            return false;
        }
    }

    /** Check if a directory is empty
     * @param uri - The URI of the directory to check
     */
    export async function empty(uri: vscode.Uri): Promise<boolean> {
        try {
            const dirContents = await vscode.workspace.fs.readDirectory(uri);
            return dirContents.length < 1;
        } catch (e) {
            localLogger.error(e);
            return false;
        }
    }

    /** Read from a file
     * @param uri - The URI of the file to read from
     */
    export async function readFile(uri: vscode.Uri): Promise<string> {
        const bytes = await vscode.workspace.fs.readFile(uri);
        const str = bytes.toString();

        localLogger.debug(`Read "${uri.path}"`);

        return str;
    }

    /** Write to a file
     * @param uri - The URI of the file to write to
     * @param content - The content to write in to the file, overwriting any previous content
     */
    export async function writeFile(
        uri: vscode.Uri,
        content: string
    ): Promise<void> {
        const byteArray = stringToByteArray(content);
        await vscode.workspace.fs.writeFile(uri, byteArray);

        localLogger.debug(`Wrote to "${uri.path}"`);
    }

    /** Delete a file
     * @param uri - The URI of the file to delete
     * @param options - Options to control if deleting a directory should be recursive and if the system's trash should be used
     */
    export async function deleteFile(
        uri: vscode.Uri,
        options?: { recursive?: boolean; useTrash?: boolean }
    ): Promise<void> {
        await vscode.workspace.fs.delete(uri, {
            recursive: options?.recursive ?? false,
            useTrash: options?.useTrash ?? true,
        });

        localLogger.debug(`Deleted ${uri.path}`);
    }

    export async function createDirectory(uri: vscode.Uri) {
        return vscode.workspace.fs
            .createDirectory(uri)
            .then(() =>
                localLogger.debug(`Created directory at "${uri.path}"`)
            );
    }

    export type DirectoryNode = {
        path: string;
        name: string;
        type: vscode.FileType;
        uri: vscode.Uri;
    };

    /** Read a directory, returning an array of all entries
     * @param uri - The URI of the directory to read
     * @param options - Options for controlling recursion
     */
    export async function readDirectory(
        uri: vscode.Uri,
        options?: ReadDirectoryOptions
    ) {
        const tree: DirectoryNode[] = [];

        options = options ?? {};

        options.maxDepth = options.maxDepth ?? 10;
        options.depth = options.depth ?? 0;

        if (options.depth > options.maxDepth) {
            localLogger.warn(
                `Max recursion depth(${options.maxDepth}) reached!`
            );
            return;
        }

        const dirContents = await vscode.workspace.fs.readDirectory(uri);

        for (const item of dirContents) {
            const name = item[0];
            const type = item[1];
            const itemURI = vscode.Uri.joinPath(uri, name);

            const pathSegments = itemURI.path.split("/");
            const path = pathSegments
                .slice(pathSegments.length - (options.depth + 1))
                .join("/");

            switch (type) {
                case vscode.FileType.File:
                    tree.push({ path, name, type, uri: itemURI });
                    break;
                case vscode.FileType.Directory:
                    if (!options.recursive) {
                        tree.push({ path, name, type, uri: itemURI });
                        continue;
                    }
                    tree.push(
                        ...(await readDirectory(itemURI, {
                            recursive: true,
                            maxDepth: options.maxDepth,
                            depth: options.depth + 1,
                        }))
                    );
                    break;
                default:
                    localLogger.warn(`Unsupported file type ${itemURI.path}`);
                    break;
            }
        }

        return tree;
    }

    export async function getDirectorySize(
        uri: vscode.Uri,
        maxDepth = 10
    ): Promise<number> {
        const tree = await readDirectory(uri, {
            maxDepth,
            recursive: true,
        });

        const promises = [] as Promise<number>[];
        for (const node of tree) {
            if (node.type !== vscode.FileType.File) continue;

            promises.push(
                new Promise((resolve) => {
                    vscode.workspace.fs
                        .stat(node.uri)
                        .then((stats) => resolve(stats.size));
                })
            );
        }

        return Promise.all(promises).then((results) => {
            return results.reduce((previous, result) => previous + result, 0);
        });
    }
}

export default filesystem;
