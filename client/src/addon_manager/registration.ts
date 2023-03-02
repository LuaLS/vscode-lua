import * as vscode from "vscode";

import { WebVue } from "./panels/WebVue";
import VSCodeLogFileTransport from "./services/logging/vsCodeLogFileTransport";
import { createChildLogger, logger } from "./services/logging.service";
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import { setupGit } from "./services/git.service";
import { execSync } from "child_process";
import { GIT_DOWNLOAD_URL } from "./config";

dayjs.extend(RelativeTime);

const localLogger = createChildLogger("Registration");

/** Set up the addon manager by registering its commands in VS Code */
export async function activate(context: vscode.ExtensionContext) {
    const globalConfig = vscode.workspace.getConfiguration("Lua.addonManager");
    const isEnabled = globalConfig.get("enable") as boolean;

    if (!isEnabled) {
        localLogger.warn("Addon manager has been disabled");
        return;
    }

    try {
        execSync("git --version");
    } catch (e) {
        vscode.window
            .showErrorMessage(
                "Git does not appear to be installed. Please install Git to use the addon manager",
                "Disable Addon Manager",
                "Visit Git Website"
            )
            .then((result) => {
                switch (result) {
                    case "Disable Addon Manager":
                        globalConfig.update("enable", false, vscode.ConfigurationTarget.Global);
                        break;
                    case "Visit Git Website":
                        vscode.env.openExternal(
                            vscode.Uri.parse(GIT_DOWNLOAD_URL)
                        );
                        break;
                    default:
                        break;
                }
            });
        return;
    }

    try {
        const setupPromises = [];
        // Register commands
        context.subscriptions.push(
            vscode.commands.registerCommand("lua.addon_manager.open", () => {
                Promise.allSettled(setupPromises)
                    .then(() => WebVue.render(context))
                    .catch((e) => logger.error(e));
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
    } catch (e) {
        localLogger.error(`Failed to initialize addon manager!`);
        localLogger.error(e);
    }
}
