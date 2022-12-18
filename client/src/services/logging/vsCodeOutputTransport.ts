import * as vscode from "vscode";
import Transport from "winston-transport";
import winston from "winston";
import { padText } from "../string.service";

const outputChannel = vscode.window.createOutputChannel(
    "Lua Addon Manager",
    "log"
);

export default class VSCodeOutputTransport extends Transport {
    static outputChannel = outputChannel;

    constructor(opts?: Transport.TransportStreamOptions) {
        super(opts);
    }

    log(info: winston.LogEntry, callback: winston.LogCallback) {
        setImmediate(() => {
            this.emit("logged", info);
        });

        let message = `[${info.timestamp}] `;

        // Add level
        message += `${padText(`${info.level.toUpperCase()}`, 8)} | `;

        // Add category
        message += `${padText(info.defaultMeta.category, 16)} | `;

        // Add message
        if (typeof info.message === "object") {
            let text = JSON.stringify(info.message, null, "\t")
                .replace(/\t(?!\t)/g, "\t\t")
                .replace(/^{/g, "\t{")
                .replace(/}$/g, "\t}");
            message += `\n${text}`;
        } else {
            message += info.message;
        }

        if (info.stack) {
            message += `\n\t${info.stack.replace(/\t(?!\t)/g, "\t\t")}`;
        }

        outputChannel.appendLine(message);

        // Give user warning that something has error'd
        if (info.level === "error") {
            vscode.window
                .showErrorMessage(
                    `An error occurred in the sumneko.lua extension!`,
                    { modal: false },
                    "View Log"
                )
                .then((result) => {
                    if (result === "View Log") {
                        outputChannel.show();
                    }
                });
        }

        callback();
    }
}
