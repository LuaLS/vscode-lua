import * as vscode from "vscode";
import Transport from "winston-transport";
import winston from "winston";
import { MESSAGE } from "triple-beam";
import * as fs from "fs";
import { stringToByteArray } from "../string.service";
import dayjs from "dayjs";

export default class VSCodeLogFileTransport extends Transport {
    public static currentLogFile: vscode.Uri;

    public initialized = false;

    private logDir: vscode.Uri;

    private stream: fs.WriteStream;

    constructor(logDir: vscode.Uri, opts?: Transport.TransportStreamOptions) {
        super(opts);
        this.logDir = logDir;
    }

    /** Initialize transport instance by creating the needed directories and files. */
    public async init() {
        // Ensure log directory exists
        await vscode.workspace.fs.createDirectory(this.logDir);
        // Create subdirectory
        const addonLogsDir = vscode.Uri.joinPath(this.logDir, "addonManager");
        await vscode.workspace.fs.createDirectory(addonLogsDir);
        // Create log file stream
        const logFileUri = vscode.Uri.joinPath(
            addonLogsDir,
            `${dayjs().format("HH")}.log`
        );
        VSCodeLogFileTransport.currentLogFile = logFileUri;
        this.stream = fs.createWriteStream(logFileUri.fsPath, {
            flags: "a",
        });
        this.initialized = true;
        return new vscode.Disposable(() => this.stream.close);
    }

    /** Mark the start of the addon manager in the log */
    public logStart() {
        return new Promise((resolve, reject) => {
            this.stream.write(
                stringToByteArray("#### STARTUP ####\n"),
                (err) => {
                    if (err) reject(err);
                    resolve(true);
                }
            );
        });
    }

    public async log(info: winston.LogEntry, callback: winston.LogCallback) {
        if (!this.initialized) {
            return;
        }

        setImmediate(() => {
            this.emit("logged", info);
        });

        this.stream.write(
            stringToByteArray(info[MESSAGE as unknown as string] + "\n")
        );

        callback();
    }
}
