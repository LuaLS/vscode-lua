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
            // const options = { "--depth": 1 };
            const options = {};
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
        // If remote branch is not already checked out, check out
        const branches = await git.branch();
        if (!Object.keys(branches.branches).includes("submoduling")) {
            // DEBUG:
            await git.checkoutBranch("submoduling", "origin/submoduling");
        } else {
            await git.checkout("submoduling");
        }

        await git.pull();
    } catch (e) {
        localLogger.error(e);
    }
};
