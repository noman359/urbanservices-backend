import JWT from 'jsonwebtoken'
import config from '../config/index.js'
export default class JWTHandler {
    constructor() { }

    getToken(userData) {
        return new Promise((resolve, reject) => {
            JWT.sign(userData, config.JWT_SECURE_KEY, (err, token) => {
                if (err) {
                    reject(err)
                }
                resolve(token)
            })

        })
    }

    verifyToken(token) {
        return new Promise((resolve, reject) => {
            JWT.verify(token, config.JWT_SECURE_KEY, (err, data) => {
                if (err) {
                    reject(err)
                }
                resolve(data)
            })
        })

    }


}