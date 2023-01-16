import * as vscode from "vscode";

import { credentials } from "./services/authentication.service";
import { WebVue } from "./panels/WebVue";
import { ADDONS_DIRECTORY } from "./config";
import filesystem from "./services/filesystem.service";
import VSCodeLogFileTransport from "./services/logging/vsCodeLogFileTransport";
import { logger } from "./services/logging.service";
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import { setSetting } from "./services/settings.service";

dayjs.extend(RelativeTime);

/** Set up the addon manager by registering its commands in VS Code */
export async function activate(context: vscode.ExtensionContext) {
    const setupPromises = [];
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand("lua.addon_manager.open", () => {
            setupPromises.push(credentials.login());
            Promise.allSettled(setupPromises).then(() =>
                WebVue.render(context)
            );
            setSetting("Lua.workspace.checkThirdParty", false);
        })
    );
    // Create log file transport and add to logger
    const fileLogger = new VSCodeLogFileTransport(context.logUri, {
        level: "debug",
    });
    const promiseFilelogger = await fileLogger.init();
    setupPromises.push(promiseFilelogger);
    context.subscriptions.push(promiseFilelogger);
    logger.add(fileLogger);
    fileLogger.logStart();

    // Create addons install directory if it does not already exist
    const extensionStorageURI = context.globalStorageUri;
    const addonDirectoryURI = vscode.Uri.joinPath(
        extensionStorageURI,
        ADDONS_DIRECTORY
    );

    setupPromises.push(
        await filesystem.createDirectory(addonDirectoryURI),
        await credentials.initialize(context)
    );
}
