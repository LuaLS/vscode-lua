"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigWatcher = exports.UpdateType = void 0;
const path = require("path");
const vscode = require("vscode");
var UpdateType;
(function (UpdateType) {
    UpdateType[UpdateType["Created"] = 1] = "Created";
    UpdateType[UpdateType["Changed"] = 2] = "Changed";
    UpdateType[UpdateType["Deleted"] = 3] = "Deleted";
})(UpdateType = exports.UpdateType || (exports.UpdateType = {}));
class ConfigWatcher {
    constructor(pattern) {
        this.pattern = pattern;
        this.emitter = new vscode.EventEmitter();
        this.configFiles = [];
    }
    get onConfigUpdate() {
        return this.emitter.event;
    }
    watch() {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield vscode.workspace.findFiles(this.pattern);
            const configFiles = [];
            for (let i = 0; i < files.length; i++) {
                const fileUri = files[i];
                const ws = path.dirname(fileUri.toString());
                if (ws) {
                    configFiles.push({
                        workspace: ws,
                        uri: fileUri.toString(),
                        path: fileUri.fsPath
                    });
                }
            }
            this.watcher = vscode.workspace.createFileSystemWatcher(this.pattern);
            this.watcher.onDidCreate(uri => this.updateConfig(UpdateType.Created, uri));
            this.watcher.onDidChange(uri => this.updateConfig(UpdateType.Changed, uri));
            this.watcher.onDidDelete(uri => this.updateConfig(UpdateType.Deleted, uri));
            this.configFiles = configFiles;
            return configFiles;
        });
    }
    findConfig(uri) {
        return this.configFiles.find(it => it.uri === uri.toString());
    }
    updateConfig(type, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            let config = this.findConfig(uri);
            if (config) {
                if (type === UpdateType.Deleted) {
                    const index = this.configFiles.indexOf(config);
                    this.configFiles.splice(index, 1);
                }
            }
            else {
                const ws = yield vscode.workspace.getWorkspaceFolder(uri);
                if (!ws) {
                    return;
                }
                config = {
                    workspace: ws.uri.toString(),
                    uri: uri.toString(),
                    path: uri.fsPath
                };
                this.configFiles.push(config);
                type = UpdateType.Created;
            }
            this.emitter.fire({ type: type, source: config });
        });
    }
    dispose() {
        if (this.watcher) {
            this.watcher.dispose();
            this.watcher = undefined;
        }
    }
}
exports.ConfigWatcher = ConfigWatcher;
//# sourceMappingURL=ConfigWatcher.js.map