import config from "../config/index.js";


export default function (response, req, res, next) {
    if (response.isError) {
        config.responseHandler.apiError(res, response.message, null, null, 400)
    } else {
        config.responseHandler.apiSuccess(res, response.data, response.message)
    }
}