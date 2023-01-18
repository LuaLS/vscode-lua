import * as vscode from "vscode";
import addonManager from "../services/addonManager.service";
import { git } from "../services/git.service";
import { DiffResultTextFile } from "simple-git";

type Message = {
    data: {
        name: string;
    };
};

export default async (context: vscode.ExtensionContext, message: Message) => {
    const addon = addonManager.addons.get(message.data.name);
    await addon.update();
    await addon.setLock(false);

    const diff = await git.diffSummary(["HEAD", "origin/submoduling"]);
    addon.checkForUpdate(diff.files as DiffResultTextFile[]);
};
