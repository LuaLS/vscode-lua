import path = require('path');
import * as vscode from 'vscode';

export enum UpdateType {
    Created = 1,
    Changed = 2,
    Deleted = 3
}

export interface IConfigSource {
    uri: string;
    path: string;
    workspace: string;
}

export interface IConfigUpdate {
    type: UpdateType;
    source: IConfigSource;
}

export class ConfigWatcher implements vscode.Disposable {
    private watcher?: vscode.FileSystemWatcher;
    private emitter = new vscode.EventEmitter<IConfigUpdate>();
    private configFiles: IConfigSource[] = [];

    constructor(private pattern: string) {
        
    }


    get onConfigUpdate(): vscode.Event<IConfigUpdate> {
        return this.emitter.event;
    }

    async watch() {
        const files = await vscode.workspace.findFiles(this.pattern);
        const configFiles: IConfigSource[] = [];
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
    }

    private findConfig(uri: vscode.Uri): IConfigSource | undefined {
        return this.configFiles.find(it => it.uri === uri.toString());
    }

    private async updateConfig(type: UpdateType, uri: vscode.Uri) {
        let config = this.findConfig(uri);
        if (config) {
            if (type === UpdateType.Deleted) {
                const index = this.configFiles.indexOf(config);
                this.configFiles.splice(index, 1);
            }
        }
        else {
            const ws = await vscode.workspace.getWorkspaceFolder(uri);
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
    }

    dispose() {
        if (this.watcher) {
            this.watcher.dispose();
            this.watcher = undefined;
        }
    }
}
