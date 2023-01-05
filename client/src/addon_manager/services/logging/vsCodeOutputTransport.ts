import * as vscode from "vscode";
import Transport from "winston-transport";
import winston from "winston";
import { MESSAGE } from "triple-beam";
import { REPOSITORY_ISSUES_URL } from "../../config";
import VSCodeLogFileTransport from "./vsCodeLogFileTransport";

const reportError = async (info: winston.LogEntry) => {
    const base = vscode.Uri.parse(REPOSITORY_ISSUES_URL);

    const query = [
        base.query,
        `actual=...\n\nI also see the following error:\n\n\`\`\`\n${info[MESSAGE]}\n\`\`\``,
    ];

    const url = base.with({ query: query.join("&") });

    vscode.env.openExternal(VSCodeLogFileTransport.currentLogFile);
    vscode.env.openExternal(url);
};

export default class VSCodeOutputTransport extends Transport {
    private readonly outputChannel: vscode.OutputChannel;

    constructor(opts?: Transport.TransportStreamOptions) {
        super(opts);
        this.outputChannel = vscode.window.createOutputChannel(
            "Lua Addon Manager",
            "log"
        );
    }

    log(info: winston.LogEntry, callback: winston.LogCallback) {
        setImmediate(() => {
            this.emit("logged", info);
        });

        this.outputChannel.appendLine(info[MESSAGE]);

        // Give user warning that something has error'd
        if (info.level === "error") {
            vscode.window
                .showErrorMessage(
                    `An error occurred in the sumneko.lua extension!`,
                    { modal: false },
                    "Report Issue",
                    "Ignore"
                )
                .then((result) => {
                    switch (result) {
                        case "Ignore":
                            break;
                        case "Report Issue":
                            this.outputChannel.show(true);
                            reportError(info);
                            break;
                    }
                });
        }

        callback();
    }
}
