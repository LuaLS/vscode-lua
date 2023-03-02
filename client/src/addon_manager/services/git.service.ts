import * as vscode from "vscode";
import simpleGit from "simple-git";
import filesystem from "./filesystem.service";
import { createChildLogger } from "./logging.service";
import { REPOSITORY_NAME, REPOSITORY_PATH } from "../config";
import { platform } from "os";

const localLogger = createChildLogger("Git");

export const git = simpleGit();

export const setupGit = async (context: vscode.ExtensionContext) => {
    const storageURI = vscode.Uri.joinPath(
        context.globalStorageUri,
        "addonManager"
    );
    await filesystem.createDirectory(storageURI);

    const localRepoPath = filesystem.getCorrectPath(storageURI);

    // set working directory
    try {
        await git.cwd({ path: localRepoPath, root: true });
    } catch (e) {
        localLogger.error(e);
    }

    // clone if not already cloned
    const isEmpty = await filesystem.empty(storageURI);
    if (isEmpty) {
        try {
            const options = { "--depth": 1 };
            await git.clone(
                REPOSITORY_PATH,
                localRepoPath,
                options
            );
            localLogger.debug(`Cloned ${REPOSITORY_NAME} to ${localRepoPath}`);
        } catch (e) {
            localLogger.error("Failed to clone repo!");
            localLogger.error(e);
        }
    }

    // pull
    try {
        await git.checkout("main");

        await git.fetch();
        await git.pull();
    } catch (e) {
        localLogger.error("Failed to checkout repo!");
        localLogger.error(e);
    }
};
