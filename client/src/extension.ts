import * as languageserver from './languageserver';

export function activate(context) {
    languageserver.activate(context);
}

export function deactivate() {
    languageserver.deactivate();
}
