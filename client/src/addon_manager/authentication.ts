import * as vscode from "vscode";
import { logger } from "../logger";

const GITHUB_AUTH_PROVIDED_ID = "github";
const SCOPES = [];

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
            logger.info("Logged in to GitHub")
            this.access_token = session.accessToken;
            return session.accessToken;
        } catch (e) {
            logger.warn(`Could not log in to GitHub! (${e})`);
            return false;
        }
    }

    /** Listen for changes in logged in state */
    private registerListeners(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.authentication.onDidChangeSessions(async (e) => {
                if (e.provider.id !== GITHUB_AUTH_PROVIDED_ID) return;

                const session = await vscode.authentication.getSession(GITHUB_AUTH_PROVIDED_ID, SCOPES);

                if (session.accessToken) {
                    logger.info("Logged in to GitHub!");
                    this.access_token = session.accessToken;
                } else {
                    logger.info("Logged out of GitHub!");
                    this.access_token = undefined;
                }
            })
        );
    }
}

export const credentials = new Credentials();
