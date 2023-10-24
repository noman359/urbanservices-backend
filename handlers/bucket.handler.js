import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import config from '../config/index.js'
export default class bucketHandler {
    #s3 = new S3Client({ region: config.AWS_ACCOUNT_REGION, credentials: { accessKeyId: config.AWS_ACCOUNT_ACCESS_KEY, secretAccessKey: config.AWS_ACCOUNT_SECRET_KEY } })
    constructor() {
        this.#s3 = new S3Client({ region: config.AWS_ACCOUNT_REGION, credentials: { accessKeyId: config.AWS_ACCOUNT_ACCESS_KEY, secretAccessKey: config.AWS_ACCOUNT_SECRET_KEY } })
    }

    async upload(put_object) {
        try {
            let putObjectCommand = new PutObjectCommand({ Bucket: put_object.bucket, Key: put_object.key, ACL: "public-read", Body: put_object.body })
            await this.#s3.send(putObjectCommand)
            return {
                message: 'success',
                url: `https://${put_object.bucket}.s3.amazonaws.com/${put_object.key}`
            }
        } catch (error) {
            throw new Error(error.message)
        }

    }

    async delete(delete_object) {
        try {
            let deleteObjectCommand = new DeleteObjectCommand({ Bucket: delete_object.bucket, Key: delete_object.key })
            await this.#s3.send(deleteObjectCommand)
            return {
                message: 'Success'
            }
        } catch (error) {
            throw new Error(error.message)
        }

    }

    async fileToArrayBuffer(file) {
        return await (new Blob([file], { type: file.type }).arrayBuffer())
    }
}