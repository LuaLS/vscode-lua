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
    try {
        await git.cwd({ path: storageURI.fsPath, root: true });
    } catch (e) {
        localLogger.error(e);
    }

    // clone if not already cloned
    const isEmpty = await filesystem.empty(storageURI);
    if (isEmpty) {
        try {
            localLogger.debug(`Attempting to clone ${REPOSITORY_NAME} to ${storageURI.fsPath}`)
            const options = { "--depth": 1 };
            await git.clone(
                REPOSITORY_PATH,
                storageURI.fsPath,
                options
            );
            localLogger.debug(`Cloned ${REPOSITORY_NAME} to ${storageURI.fsPath}`);
        } catch (e) {
            localLogger.error(`Failed to clone ${REPOSITORY_NAME} to ${storageURI.fsPath}!`);
            localLogger.error(e);
        }
    }

    // pull
    try {
        await git.fetch();
        await git.pull();

        await git.checkout("main");
    } catch (e) {
        localLogger.error(`Failed to pull ${REPOSITORY_NAME}!`);
        localLogger.error(e);
    }
};
