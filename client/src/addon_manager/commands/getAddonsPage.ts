import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import addonManager from "../services/addonManager.service";
import { WebVue } from "../panels/WebVue";
import { ADDONS_DIRECTORY } from "../config";

const localLogger = createChildLogger("Get Remote Addons");

type Message = {
    data: { page: number; pageSize?: number };
};

export default async (context: vscode.ExtensionContext, message: Message) => {
    WebVue.setLoadingState(true);

    const { page, pageSize } = message.data;

    const installLocation = vscode.Uri.joinPath(
        context.globalStorageUri,
        "addonManager",
        ADDONS_DIRECTORY
    );

    if (addonManager.addons.size < 1) {
        await addonManager.fetchAddons(installLocation);
    }

    WebVue.sendMessage("addonStore", {
        property: "total",
        value: addonManager.addons.size,
    });

    if (addonManager.addons.size === 0) {
        WebVue.setLoadingState(false);
        localLogger.verbose("No remote addons found");
        return;
    }

    const addonList = await addonManager.getAddonsPage(page, pageSize ?? 10);

    const addons = await Promise.all(addonList.map((addon) => addon.toJSON()));

    WebVue.sendMessage("addAddon", { addons });
    WebVue.setLoadingState(false);
};
