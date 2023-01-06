import * as vscode from "vscode";
import addonManager from "../services/addonManager.service";

type Message = {
    data: {
        name: string;
    };
};

export default (context: vscode.ExtensionContext, message: Message) => {
    const addon = addonManager.localAddons.get(message.data.name);
    addon.enabled = false;
    addon.sendToWebVue();
};
