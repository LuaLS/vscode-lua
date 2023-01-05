import * as vscode from "vscode";
import addonManager from "../services/addonManager.service";
import { ADDONS_DIRECTORY } from "../config";
import { WebVue } from "../panels/WebVue";

export default async (context: vscode.ExtensionContext, message: undefined) => {
    WebVue.setLoadingState("localAddonStore", true);

    const installLocation = vscode.Uri.joinPath(
        context.globalStorageUri,
        ADDONS_DIRECTORY
    );

    await addonManager.fetchLocalAddons(installLocation);

    WebVue.setLoadingState("localAddonStore", false);
};
