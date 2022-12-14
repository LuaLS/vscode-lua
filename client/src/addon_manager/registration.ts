import * as vscode from "vscode";

import { credentials } from "./authentication";
import { AddonManager } from "./panels/AddonManager";

/** Set up the addon manager by registering its commands and views in VS Code */
export async function activate(context: vscode.ExtensionContext) {
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand("lua.addon_manager.open", () => {
            AddonManager.render(context);
        })
    );

    await credentials.initialize(context);
    credentials.login();
}
