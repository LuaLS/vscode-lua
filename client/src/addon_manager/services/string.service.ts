import { TextEncoder } from "util";

/** Pad a string to have spaces on either side, making it a set `length`
 * @param str The string to add padding to
 * @param length The new total length the string should be with padding
 */
export const padText = (str: string, length: number) => {
    const paddingLength = Math.max(0, length - str.length);
    const padding = " ".repeat(paddingLength / 2);

    const paddingLeft = " ".repeat(length - padding.length - str.length);

    return paddingLeft + str + padding;
};

/** Convert a string to a byte array */
export const stringToByteArray = (str: string): Uint8Array =>
    new TextEncoder().encode(str);

/** Convert an object into a query string without the leading `?` */
export const objectToQueryString = (
    obj: Record<string, string | boolean | number>
): string => {
    return Object.keys(obj)
        .map(
            (key) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`
        )
        .join("&");
};
