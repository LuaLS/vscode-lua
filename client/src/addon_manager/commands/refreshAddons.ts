import * as vscode from "vscode";
import addonManager from "../services/addonManager.service";
import { ADDONS_DIRECTORY } from "../config";
import { WebVue } from "../panels/WebVue";

export default async (context: vscode.ExtensionContext) => {
    WebVue.setLoadingState(true);

    const installLocation = vscode.Uri.joinPath(
        context.globalStorageUri,
        "addonManager",
        ADDONS_DIRECTORY
    );

    await addonManager.fetchAddons(installLocation);

    WebVue.setLoadingState(false);
};
