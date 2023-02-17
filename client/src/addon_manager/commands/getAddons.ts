import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import addonManager from "../services/addonManager.service";
import { WebVue } from "../panels/WebVue";
import { ADDONS_DIRECTORY } from "../config";

const localLogger = createChildLogger("Get Remote Addons");

export default async (context: vscode.ExtensionContext) => {
    WebVue.setLoadingState(true);

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

    /** Number of addons to load per chunk */
    const CHUNK_SIZE = 30;

    // Get list of addons and sort them alphabetically
    const addonList = Array.from(addonManager.addons.values());
    addonList.sort((a, b) => a.displayName.localeCompare(b.displayName));

    // Send addons to client in chunks
    for (let i = 0; i <= addonList.length / CHUNK_SIZE; i++) {
        const chunk = addonList.slice(i * CHUNK_SIZE, i * CHUNK_SIZE + CHUNK_SIZE);
        const addons = await Promise.all(chunk.map((addon) => addon.toJSON()));
        await WebVue.sendMessage("addAddon", { addons });
    }

    WebVue.setLoadingState(false);
};
