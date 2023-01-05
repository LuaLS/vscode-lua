import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import addonManager from "../services/addonManager.service";
import { ADDONS_DIRECTORY } from "../config";
import { WebVue } from "../panels/WebVue";

const localLogger = createChildLogger("Get Local Addons");

type Message = {
    data: { page: number; pageSize?: number };
};

export default async (context: vscode.ExtensionContext, message: Message) => {
    WebVue.setLoadingState("localAddonStore", true);

    const installLocation = vscode.Uri.joinPath(
        context.globalStorageUri,
        ADDONS_DIRECTORY
    );

    if (addonManager.localAddons.size < 1)
        await addonManager.fetchLocalAddons(installLocation);

    if (addonManager.localAddons.size === 0) {
        WebVue.setLoadingState("localAddonStore", false);
    }

    // DEBUG: increase page size
    const addons = addonManager.getLocalAddonsPage(
        message.data.page,
        message.data.pageSize ?? 2
    );

    const promises = [];
    for (const addon of addons) {
        promises.push(addon.sendToWebVue());
    }

    Promise.allSettled(promises).then(() => {
        WebVue.sendMessage("localAddonStore", {
            prop: "total",
            value: addonManager.localAddons.size,
        });
        WebVue.setLoadingState("localAddonStore", false);
    });
};
