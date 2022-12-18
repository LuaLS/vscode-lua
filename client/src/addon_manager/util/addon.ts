import { getSetting, requestOpenFolder } from "./settings";
import { LIBRARY_SETTING_NAME, LIBRARY_SETTING_SECTION } from "../config";

const ADDON_REGEX = new RegExp(/sumneko\.lua\/addons\/([^\/]+)\/library/);

/** Get the currently enabled libraries
 * @param failSilently If the libraries cannot be retrieved, fail silently and return an empty array
 */
export const getEnabledLibraries = (failSilently = false) => {
    try {
        const setting = getSetting(
            LIBRARY_SETTING_NAME,
            LIBRARY_SETTING_SECTION,
            []
        ) as string[];
        return setting;
    } catch (e) {
        if (failSilently) return [];
        requestOpenFolder();
        throw e;
    }
};

/** Get the currently enabled addons
 * @param libraryPaths The paths of the currently enabled libaries. Defaults to getting the list itself.
 * @param failSilently If the libraries cannot be retrieved, fail silently and return an empty object
 */
export const getEnabledAddons = (
    libraryPaths?: string[],
    failSilently = false
): { [index: string]: number } => {
    const enabledLibraries =
        libraryPaths ?? (getEnabledLibraries(failSilently) as string[]);
    const enabledAddons = {};
    enabledLibraries.map((path, index) => {
        const match = ADDON_REGEX.exec(path);
        const addonName = match?.[1];
        if (addonName) enabledAddons[addonName] = index;
    });
    return enabledAddons;
};
