export default class responseHandler {
    static apiSuccess(res, result = null, message = "success") {
        res.status(200).json({
            error: false,
            message: message,
            data: result,
            errors: [],
        });
    };

    static apiError(
        res,
        message = "Unable to process request",
        result = null,
        err,
        errorCode = 500
    ) {
        res.status(errorCode).json({
            error: true,
            message: message,
            data: result,
            errors: [err],
        });
    };

}
