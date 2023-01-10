import * as vscode from "vscode";
import { createChildLogger } from "./logging.service";
import { getSetting, setSetting } from "./settings.service";

const GITHUB_AUTH_PROVIDER_ID = "github";
const SCOPES = [];

const localLogger = createChildLogger("Authentication");

export class Credentials {
    access_token: string | undefined | false;

    static currentSignInAttempt: Promise<string | boolean> = undefined;

    /** Requires extension context. Registers listeners */
    async initialize(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.authentication.onDidChangeSessions(async (e) => {
                if (e.provider.id !== GITHUB_AUTH_PROVIDER_ID) return;

                const session = await vscode.authentication.getSession(
                    GITHUB_AUTH_PROVIDER_ID,
                    SCOPES
                );

                if (session.accessToken) {
                    localLogger.info("Logged in to GitHub!");
                    this.access_token = session.accessToken;
                } else {
                    localLogger.info("Logged out of GitHub!");
                    this.access_token = undefined;
                }
            })
        );
    }

    /** Get the GitHub session or ask the user to create one. */
    private async getSession() {
        // Attempt to get session without prompting user
        const session = await vscode.authentication.getSession(
            GITHUB_AUTH_PROVIDER_ID,
            SCOPES
        );
        if (session?.accessToken) {
            localLogger.info("Logged in to GitHub!");
            this.access_token = session.accessToken;
            return this.access_token;
        }

        const noAsk = await getSetting("Lua.addonManager.authentication.noAsk");

        let result: undefined | "Sign in" | "Stop asking";

        if (noAsk) {
            localLogger.verbose("User has requested to not be asked to log in");
            return false;
        } else {
            // If the user isn't currently logged in, ask them to.
            result = await vscode.window.showInformationMessage(
                "To greatly increase the rate limit for GitHub's API, please sign in",
                {
                    modal: true,
                    detail: "If you do not sign in, you will be limited to only 60 requests per hour, which will allow you to fetch only about 3 pages of addons.",
                },
                "Sign in",
                "Stop asking"
            );
        }

        switch (result) {
            case "Stop asking":
                localLogger.verbose(
                    "User has requested to not be asked to log in"
                );
                await setSetting("Lua.addonManager.authentication.noAsk", true);
                return false;
            case "Sign in":
                return vscode.authentication
                    .getSession(GITHUB_AUTH_PROVIDER_ID, SCOPES, {
                        createIfNone: true,
                    })
                    .then(
                        () => {
                            this.access_token = session.accessToken;
                            return this.access_token;
                        },
                        () => {
                            localLogger.warn("User refused GitHub sign in");
                            return false;
                        }
                    );
            default:
                localLogger.warn("User refused GitHub sign in");
                return false;
        }
    }

    /**
     * Attempt to log in to GitHub. There can only be one sign in attempt
     * happening at a given time.
     */
    async login() {
        if (this.access_token) return this.access_token;

        if (Credentials.currentSignInAttempt !== undefined) {
            return Credentials.currentSignInAttempt;
        }

        Credentials.currentSignInAttempt = this.getSession().finally(
            () => (Credentials.currentSignInAttempt = undefined)
        );

        return Credentials.currentSignInAttempt;
    }
}

export const credentials = new Credentials();
