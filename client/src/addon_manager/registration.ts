import * as vscode from "vscode";

import { WebVue } from "./panels/WebVue";
import VSCodeLogFileTransport from "./services/logging/vsCodeLogFileTransport";
import { createChildLogger, logger } from "./services/logging.service";
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import { setupGit } from "./services/git.service";
import { execSync } from "child_process";
import { GIT_DOWNLOAD_URL } from "./config";
import { NotificationLevels } from "./types/webvue";

dayjs.extend(RelativeTime);

const localLogger = createChildLogger("Registration");

/** Set up the addon manager by registering its commands in VS Code */
export async function activate(context: vscode.ExtensionContext) {
    const globalConfig = vscode.workspace.getConfiguration("Lua.addonManager");
    const isEnabled = globalConfig.get("enable") as boolean;

    if (!isEnabled) {
        localLogger.info("Addon manager is disabled");
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
                        globalConfig.update(
                            "enable",
                            false,
                            vscode.ConfigurationTarget.Global
                        );
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

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand("lua.addon_manager.open", async () => {
            // Create log file transport and add to logger
            const fileLogger = new VSCodeLogFileTransport(context.logUri, {
                level: "debug",
            });
            const promiseFilelogger = await fileLogger.init();
            context.subscriptions.push(promiseFilelogger);
            logger.add(fileLogger);
            await fileLogger.logStart();

            WebVue.render(context);

            try {
                await setupGit(context);
            } catch (e) {
                WebVue.sendNotification({
                    level: NotificationLevels.error,
                    message:
                        "Failed to set up Git repository. Please check your connection to GitHub.",
                });
            }
        })
    );
}
