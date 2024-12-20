import * as vscode from "vscode";

import { WebVue } from "./panels/WebVue";
import VSCodeLogFileTransport from "./services/logging/vsCodeLogFileTransport";
import { createChildLogger, logger } from "./services/logging.service";
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import { git, setupGit } from "./services/git.service";
import { GIT_DOWNLOAD_URL, REPOSITORY, setGlobalStorageUri } from "./config";
import { NotificationLevels } from "./types/webvue";
import * as languageServer from "../languageserver";

dayjs.extend(RelativeTime);

const localLogger = createChildLogger("Registration");

/** Set up the addon manager by registering its commands in VS Code */
export async function activate(context: vscode.ExtensionContext) {
    const globalConfig = vscode.workspace.getConfiguration("Lua.addonManager");
    const isEnabled = globalConfig.get("enable") as boolean;

    if (!isEnabled) {
        // NOTE: Will only log to OUTPUT, not to log file
        localLogger.info("Addon manager is disabled");
        return;
    }

    const fileLogger = new VSCodeLogFileTransport(context.logUri, {
        level: "debug",
    });
    
    // update config
    const repositoryPath = globalConfig.get("repositoryPath") as string
    const repositoryBranch = globalConfig.get("repositoryBranch") as string
    if ((repositoryPath || repositoryBranch) && context.storageUri) {
        REPOSITORY.PATH = !!repositoryPath ? repositoryPath : REPOSITORY.PATH
        REPOSITORY.DEFAULT_BRANCH = !!repositoryBranch ? repositoryBranch : REPOSITORY.DEFAULT_BRANCH
        setGlobalStorageUri(false)
    }
    

    // Register command to open addon manager
    context.subscriptions.push(
        vscode.commands.registerCommand("lua.addon_manager.open", async () => {
            // Set up file logger
            if (!fileLogger.initialized) {
                const disposable = await fileLogger.init();
                context.subscriptions.push(disposable);
                logger.info(
                    `This session's log file: ${VSCodeLogFileTransport.currentLogFile}`
                );
                logger.add(fileLogger);
                await fileLogger.logStart();
            }
            // Start language server if it is not already
            // We depend on it to apply config modifications
            if (!languageServer.defaultClient) {
                logger.debug("Starting language server");
                await languageServer.createClient(context);
                logger.debug("Language server has started");
            }

            // Check if git is installed
            if (!(await git.version()).installed) {
                logger.error("Git does not appear to be installed!", {
                    report: false,
                });
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
            }

            // Set up git repository for fetching addons
            try {
                setupGit(context);
            } catch (e: any) {
                const message =
                    "Failed to set up Git repository. Please check your connection to GitHub.";
                logger.error(message, { report: false });
                logger.error(e, { report: false });
                WebVue.sendNotification({
                    level: NotificationLevels.error,
                    message,
                });
            }

            WebVue.render(context);
        })
    );
}
