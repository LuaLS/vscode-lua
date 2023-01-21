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
        await git.cwd({ path: storageURI.path.substring(1), root: true });
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
                storageURI.path.substring(1),
                options
            );
            localLogger.debug(`Cloned ${REPOSITORY_NAME}`);
        } catch (e) {
            localLogger.error(e);
        }
    }

    // pull
    try {
        await git.checkout("main");

        await git.fetch();
        await git.pull();
    } catch (e) {
        localLogger.error(e);
    }
};
