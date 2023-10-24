import config from '../config/index.js'
import crypto from 'crypto'
export default class encryption {
    key = crypto.createHash('sha512').update(config.secure_key).digest('hex').substring(0, 32)
    encryptionIV = crypto.createHash('sha512').update(config.secret_iv).digest('hex').substring(0, 16)
    constructor() { }
    encrypt(data) {
        const cipher = crypto.createCipheriv(config.encryption_method, this.key, this.encryptionIV)
        return Buffer.from(cipher.update(data, 'utf8', 'hex') + cipher.final('hex')).toString('base64')
    }

    decrypt(data) {
        const buff = Buffer.from(data, 'base64')
        const decipher = crypto.createDecipheriv(config.ecnryption_method, this.key, this.encryptionIV)
        return (
            decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
            decipher.final('utf8')
        )
    }
}