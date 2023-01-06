import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import addonManager from "../services/addonManager.service";
import { WebVue } from "../panels/WebVue";

const localLogger = createChildLogger("Get Remote Addons");

type Message = {
    data: { page: number; pageSize?: number };
};

//TODO: Make sure that all local addons appear in remote page
export default async (context: vscode.ExtensionContext, message: Message) => {
    WebVue.setLoadingState("remoteAddonStore", true);

    const { page, pageSize } = message.data;

    if (addonManager.remoteAddons.size < 1) {
        await addonManager.fetchRemoteAddons();
    }

    const remoteAddons = await addonManager.getRemoteAddonsPage(
        page,
        pageSize ?? 5
    );

    const promises = [];
    for (const addon of remoteAddons) {
        localLogger.debug(`Sending remote addon "${addon.name}" to WebVue`);
        promises.push(addon.sendToWebVue());
    }

    Promise.allSettled(promises).then(() => {
        WebVue.sendMessage("remoteAddonStore", {
            prop: "total",
            value: addonManager.remoteAddons.size,
        });
        WebVue.setLoadingState("remoteAddonStore", false);
    });
};
