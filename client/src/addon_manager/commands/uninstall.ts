import * as vscode from "vscode";
import addonManager from "../services/addonManager.service";
import { WebVue } from "../panels/WebVue";

type Message = {
    data: {
        name: string;
    };
};

export default async (context: vscode.ExtensionContext, message: Message) => {
    const addon = addonManager.localAddons.get(message.data.name);

    await addon.setLock(true);

    await addon.disable();
    await addonManager.uninstallAddon(message.data.name);

    WebVue.sendMessage("localAddonStore", {
        property: "total",
        value: addonManager.localAddons.size,
    });
    WebVue.sendMessage("removeLocalAddon", { name: message.data.name });
};
