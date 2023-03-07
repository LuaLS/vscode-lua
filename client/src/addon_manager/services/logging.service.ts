/**
 * Logging using WintonJS
 * https://github.com/winstonjs/winston
 */

import winston from "winston";
import VSCodeOutputTransport from "./logging/vsCodeOutputTransport";
import axios, { AxiosError } from "axios";
import { padText } from "./string.service";
import * as vscode from "vscode";
import { MESSAGE } from "triple-beam";
import { REPOSITORY_ISSUES_URL } from "../config";
import VSCodeLogFileTransport from "./logging/vsCodeLogFileTransport";

// Create logger from winston
export const logger = winston.createLogger({
    level: "info",
    defaultMeta: { category: "General", report: true },
    format: winston.format.combine(
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf((message) => {
            const level = padText(message.level, 9);
            const category = padText(
                message?.defaultMeta?.category ?? "GENERAL",
                18
            );
            if (typeof message.message === "object")
                return `[${
                    message.timestamp
                }] | ${level.toUpperCase()} | ${category} | ${JSON.stringify(
                    message.message
                )}`;
            return `[${
                message.timestamp
            }] | ${level.toUpperCase()} | ${category} | ${message.message}`;
        })
    ),

    transports: [new VSCodeOutputTransport({ level: "info" })],
});

// When a error is logged, ask user to report error.
logger.on("data", async (info) => {
    if (info.level !== "error" || !info.report) return;

    const choice = await vscode.window.showErrorMessage(
        `An error occurred with the Lua Addon Manager. Please help us improve by reporting the issue ❤️`,
        { modal: false },
        "Report Issue"
    );

    if (choice !== "Report Issue") return;

    // Open log file
    await vscode.env.openExternal(VSCodeLogFileTransport.currentLogFile);

    // Read log file and copy to clipboard
    const log = await vscode.workspace.fs.readFile(
        VSCodeLogFileTransport.currentLogFile
    );
    await vscode.env.clipboard.writeText(
        "<details><summary>Retrieved Log</summary>\n\n```\n" +
            log.toString() +
            "\n```\n\n</details>"
    );
    vscode.window.showInformationMessage("Copied log to clipboard");

    // After a delay, open GitHub issues page
    setTimeout(() => {
        const base = vscode.Uri.parse(REPOSITORY_ISSUES_URL);
        const query = [
            base.query,
            `actual=...\n\nI also see the following error:\n\n\`\`\`\n${info[MESSAGE]}\n\`\`\``,
        ];
        const issueURI = base.with({ query: query.join("&") });

        vscode.env.openExternal(issueURI);
    }, 2000);
});

/** Helper that creates a child logger from the main logger. */
export const createChildLogger = (label: string) => {
    return logger.child({
        level: "info",
        defaultMeta: { category: label },
        format: winston.format.combine(
            winston.format.timestamp({
                format: "YYYY-MM-DD HH:mm:ss",
            }),
            winston.format.errors({ stack: true }),
            winston.format.json()
        ),
    });
};

// Log HTTP requests made through axios
const axiosLogger = createChildLogger("AXIOS");

axios.interceptors.request.use(
    (request) => {
        const method = request.method ?? "???";
        axiosLogger.debug(`${method.toUpperCase()} requesting ${request.url}`);

        return request;
    },
    (error: AxiosError) => {
        const url = error?.config?.url;
        const method = error.config?.method?.toUpperCase();

        axiosLogger.error(`${url} ${method} ${error.code} ${error.message}`);
        return Promise.reject(error);
    }
);
