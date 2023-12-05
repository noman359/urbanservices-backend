import dotenv from 'dotenv'
import responseHandler from './api.response.js'
import serviceResponse from './service.response.js'

const envFound = dotenv.config()

if (envFound.error) {
    throw new Error("couldn't find env")
}

export default {
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
    apiPrefix: '/api/',
    secure_key: process.env.secret_key,
    secret_iv: process.env.secret_iv,
    encryption_method: process.env.encryption_method,
    AWS_ACCOUNT_ACCESS_KEY: process.env.AWS_ACCOUNT_ACCESS_KEY,
    AWS_ACCOUNT_SECRET_KEY: process.env.AWS_ACCOUNT_SECRET_KEY,
    AWS_ACCOUNT_REGION: process.env.AWS_ACCOUNT_REGION,
    AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
    card_upload_s3_bucket_name: process.env.card_upload_s3_bucket_name,
    vendor_avatar_s3_bucket_name: process.env.vendor_avatar_s3_bucket_name,
    customer_avatar_s3_bucket_name: process.env.customer_avatar_s3_bucket_name,
    jobs_s3_bucket_name: process.env.jobs_s3_bucket_name,
    JWT_SECURE_KEY: process.env.JWT_SECURE_KEY,
    environment: process.env.environment,
    
    responseHandler,
    serviceResponse
}