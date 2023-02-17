import * as vscode from "vscode";
import addonManagerService from "../services/addonManager.service";

export default async (
    context: vscode.ExtensionContext,
    message: { data: { name: string } }
) => {
    const addon = addonManagerService.addons.get(message.data.name);
    addon.uninstall();
};
