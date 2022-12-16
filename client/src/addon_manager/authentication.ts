import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";

const GITHUB_AUTH_PROVIDED_ID = "github";
const SCOPES = [];

const localLogger = createChildLogger("Authentication");

export class Credentials {
    access_token: string | undefined;

    /** Requires extension context. Registers listeners */
    async initialize(context: vscode.ExtensionContext) {
        this.registerListeners(context);
    }

    /**
     * Create session and log in to GitHub
     * @param prompt If the user should be prompted to sign in or just gently encouraged with a notification on their accounts icon.
     * */
    async login(prompt = false) {
        if (this.access_token) return this.access_token;

        try {
            const session = await vscode.authentication.getSession(
                GITHUB_AUTH_PROVIDED_ID,
                SCOPES,
                { createIfNone: prompt }
            );
            if (!session?.accessToken) throw "User has not granted permission";
            localLogger.info("Logged in to GitHub");
            this.access_token = session.accessToken;
            return session.accessToken;
        } catch (e) {
            localLogger.warn(`Could not log in to GitHub! (${e})`);
            return false;
        }
    }

    /** Listen for changes in logged in state */
    private registerListeners(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.authentication.onDidChangeSessions(async (e) => {
                if (e.provider.id !== GITHUB_AUTH_PROVIDED_ID) return;

                const session = await vscode.authentication.getSession(
                    GITHUB_AUTH_PROVIDED_ID,
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
}

export const credentials = new Credentials();
