import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import addonManager from "../services/addonManager.service";

const localLogger = createChildLogger("Enable Addon");

type Message = {
    data: {
        name: string;
    };
};

export default (context: vscode.ExtensionContext, message: Message) => {
    const addon = addonManager.localAddons.get(message.data.name);
    addon.enabled = true;
    addon.sendToWebVue();
    localLogger.info(`Enabled "${message.data.name}" addon!`);
};
