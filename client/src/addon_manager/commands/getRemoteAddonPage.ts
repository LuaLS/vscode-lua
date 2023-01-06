import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import addonManager from "../services/addonManager.service";
import { WebVue } from "../panels/WebVue";

const localLogger = createChildLogger("Get Remote Addons");

type Message = {
    data: { page: number; pageSize?: number };
};

export default async (context: vscode.ExtensionContext, message: Message) => {
    WebVue.setLoadingState("remoteAddonStore", true);

    const { page, pageSize } = message.data;

    if (addonManager.remoteAddons.size < 1) {
        await addonManager.fetchRemoteAddons();
    }

    WebVue.sendMessage("remoteAddonStore", {
        prop: "total",
        value: addonManager.remoteAddons.size,
    });

    if (addonManager.remoteAddons.size === 0) {
        WebVue.setLoadingState("remoteAddonStore", false);
        localLogger.verbose("No remote addons found");
        return;
    }

    const addonList = await addonManager.getRemoteAddonsPage(
        page,
        pageSize ?? 5
    );

    const addons = await Promise.all(addonList.map((addon) => addon.toJSON()));

    WebVue.sendMessage("addRemoteAddon", { addons });
    WebVue.setLoadingState("remoteAddonStore", false);
};
