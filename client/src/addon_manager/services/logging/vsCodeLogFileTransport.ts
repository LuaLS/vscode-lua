import * as vscode from "vscode";
import Transport from "winston-transport";
import winston from "winston";
import { MESSAGE } from "triple-beam";
import * as fs from "fs";
import dayjs from "dayjs";
import { stringToByteArray } from "../string.service";

export default class VSCodeLogFileTransport extends Transport {
    private logFileUri: vscode.Uri;

    private initialized = false;

    private logDir: vscode.Uri;

    private stream: fs.WriteStream;

    constructor(logDir: vscode.Uri, opts?: Transport.TransportStreamOptions) {
        super(opts);
        this.logDir = logDir;
    }

    /** Initialize transport instance by creating the needed directories and files. */
    public async init() {
        await vscode.workspace.fs.createDirectory(this.logDir);
        this.logFileUri = vscode.Uri.joinPath(
            this.logDir,
            `${dayjs().format("DD-MMMM-YYYY")}.log`
        );
        this.stream = fs.createWriteStream(this.logFileUri.path.substring(1), {
            flags: "a",
        });
        this.initialized = true;
        return new vscode.Disposable(() => this.stream.close);
    }

    /** Mark the start of the addon manager in the log */
    public logStart() {
        this.stream.write(
            stringToByteArray(
                "-------------------------------------------- STARTUP --------------------------------------------\n"
            )
        );
    }

    public async log(info: winston.LogEntry, callback: winston.LogCallback) {
        if (!this.initialized) {
            return;
        }

        setImmediate(() => {
            this.emit("logged", info);
        });

        this.stream.write(stringToByteArray(info[MESSAGE] + "\n"));

        callback();
    }
}
