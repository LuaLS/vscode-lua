import * as vscode from "vscode";
import VSCodeLogFileTransport from "../services/logging/vsCodeLogFileTransport";

export default async () => {
    vscode.env.openExternal(VSCodeLogFileTransport.currentLogFile);
};
