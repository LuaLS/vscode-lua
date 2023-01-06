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

    WebVue.sendMessage("localAddonStore", {
        property: "total",
        value: addonManager.localAddons.size,
    });

    if (addonManager.localAddons.size === 0) {
        localLogger.verbose("No local addons found");
        WebVue.setLoadingState("localAddonStore", false);
        return;
    }

    const addonList = addonManager.getLocalAddonsPage(
        message.data.page,
        message.data.pageSize ?? 5
    );

    const addons = await Promise.all(addonList.map((addon) => addon.toJSON()));

    WebVue.sendMessage("addLocalAddon", { addons });
    WebVue.setLoadingState("localAddonStore", false);
};
