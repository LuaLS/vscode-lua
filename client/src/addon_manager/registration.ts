import * as vscode from "vscode";

import { WebVue } from "./panels/WebVue";
import VSCodeLogFileTransport from "./services/logging/vsCodeLogFileTransport";
import { logger } from "./services/logging.service";
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import { setSetting } from "./services/settings.service";
import { setupGit } from "./services/git.service";

dayjs.extend(RelativeTime);

/** Set up the addon manager by registering its commands in VS Code */
export async function activate(context: vscode.ExtensionContext) {
    const setupPromises = [];
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand("lua.addon_manager.open", () => {
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
    context.subscriptions.push(promiseFilelogger);
    logger.add(fileLogger);
    await fileLogger.logStart();

    setupPromises.push(setupGit(context));
}
