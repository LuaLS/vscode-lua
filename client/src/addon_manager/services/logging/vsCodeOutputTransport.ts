import * as vscode from "vscode";
import Transport from "winston-transport";
import winston from "winston";
import { MESSAGE } from "triple-beam";

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

        this.outputChannel.appendLine(info[MESSAGE as unknown as string]);

        callback();
    }
}
