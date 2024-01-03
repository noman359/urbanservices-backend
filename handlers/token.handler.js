import JWTHandler from "../handlers/jwt.handler.js"
import config from '../config/index.js'

export default class TokenHandler {
    constructor() { }
    async checkToken(req) {
        var authorizationHeader = req.headers.authorization;
        let servResp = new config.serviceResponse()
        if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
            var token = authorizationHeader.substring('Bearer '.length);
            try {
                var jwt = new JWTHandler()
                var data = await jwt.verifyToken(token)
                servResp.isError = false
                return servResp
            } catch (error) {
                servResp.isError = true
                servResp.message = 'Authentication token is not valid'
                return servResp
            }
        } else {
            servResp.isError = true
                servResp.message = 'Token not provided'
                return servResp
        }
    }
}