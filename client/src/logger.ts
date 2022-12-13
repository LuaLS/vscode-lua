import { AxiosResponse } from "axios";
import * as vscode from "vscode";

class Logger {
    channel: vscode.OutputChannel;

    constructor() {
        this.channel = vscode.window.createOutputChannel("Lua Addon Manager", "log");
    }

    log(level: string, text: string) {
        const timestamp = new Date().toISOString();
        this.channel.appendLine(`[${timestamp}] |${level}| ${text}`);
    }

    info(text: string) {
        this.log("ℹ", text);
    }

    error(text: string) {
        this.log("💣", text);
    }

    warn(text: string) {
        this.log("⚠", text);
    }

    debug(text: string) {
        this.log("🧪", text);
    }

    http(response: AxiosResponse, successText: string) {
        this.log(
            "🌐",
            `${response.status}: ${response.statusText} - ${successText}`
        );
    }
}

export const logger = new Logger();
