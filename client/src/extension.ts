import * as languageserver from './languageserver';
import * as luadoc from './luadoc';

export function activate(context) {
    languageserver.activate(context);
    luadoc.activate(context);
}

export function deactivate() {
    languageserver.deactivate();
}
