class ApiError extends Error {
    statusCode: number;
    data: any;
    success: boolean = false;
    stack?: any;

    constructor(statusCode: number, message: string, success: boolean = false, data: any = {}) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
        this.success = success;

        if (Error.captureStackTrace) {
            this.stack = Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;
