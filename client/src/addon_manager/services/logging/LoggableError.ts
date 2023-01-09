import { logger } from "../logging.service";

/** An error that is logged */
export class LoggableError extends Error {
    message: string;

    /**
     * @param message The error message to throw
     * @param localLogger The logger to use when logging the error. Will default to general logger.
     */
    constructor(message: string, localLogger = logger) {
        super(message);

        localLogger.error(message);
    }
}
