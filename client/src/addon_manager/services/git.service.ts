import * as vscode from "vscode";
import simpleGit from "simple-git";
import filesystem from "./filesystem.service";
import { createChildLogger } from "./logging.service";
import { REPOSITORY_NAME, REPOSITORY_PATH } from "../config";

const localLogger = createChildLogger("Git");

export const git = simpleGit();

export const setupGit = async (context: vscode.ExtensionContext) => {
    const storageURI = vscode.Uri.joinPath(
        context.globalStorageUri,
        "addonManager"
    );
    await filesystem.createDirectory(storageURI);

    // set working directory
    await git.cwd({ path: storageURI.fsPath, root: true });

    // clone if not already cloned
    if (await filesystem.empty(storageURI)) {
        try {
            localLogger.debug(
                `Attempting to clone ${REPOSITORY_NAME} to ${storageURI.fsPath}`
            );
            const options = { "--depth": 1 };
            await git.clone(REPOSITORY_PATH, storageURI.fsPath, options);
            localLogger.debug(
                `Cloned ${REPOSITORY_NAME} to ${storageURI.fsPath}`
            );
        } catch (e) {
            localLogger.warn(
                `Failed to clone ${REPOSITORY_NAME} to ${storageURI.fsPath}!`
            );
            throw e;
        }
    }

    // pull
    try {
        await git.fetch();
        await git.pull();
        await git.checkout("main");
    } catch (e) {
        localLogger.warn(`Failed to pull ${REPOSITORY_NAME}!`);
        throw e;
    }
};
