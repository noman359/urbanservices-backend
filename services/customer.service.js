import handler from '../handlers/index.js'
import config from '../config/index.js'
import Prisma from '@prisma/client';
const { PrismaClient } = Prisma;


export default class CustomerService {

    #db = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })
    #bucket = new handler.bucketHandler()
    #encryption = new handler.encryption()
    #JWT = new handler.JWT()

    constructor() { }


    async createCustomer(customerBody) {
        let servResp = new config.serviceResponse()
        let customer_avatar = new Object()
        try {
            console.debug('createCustomer() started')
            if (customerBody.avatar) {
                let avatar_val = {
                    bucket: config.customer_avatar_s3_bucket_name,
                    key: `${customerBody.email}_${customerBody.avatar['name']}`,
                    body: await this.#bucket.fileToArrayBuffer(customerBody.avatar)
                }
                customer_avatar = await this.#bucket.upload(avatar_val)
            }

            customerBody.password = this.#encryption.encrypt(customerBody.password)
            servResp.data = await this.#db.customers.create({
                data: {
                    full_name: customerBody.full_name,
                    password: customerBody.password,
                    avatar: customer_avatar.url ?? "",
                    created_at: new Date(new Date().toUTCString()),
                    phone_number: customerBody.phone_number,
                    zipcode: customerBody.password,
                    email: customerBody.email

                }
            })
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async updateCustomer(query, customerBody) {
        let servResp = new config.serviceResponse()
        let customer_avatar = new Object()
        try {
            console.debug('createCustomer() started')
            let customer = await this.#db.customers.findFirst({ where: { id: query.id } })

            if (!customer) {
                throw new Error('Customer not found!')
            }

            if (customerBody.avatar) {
                if (typeof customerBody.avatar === 'string') {
                    customer_avatar['url'] = customerBody.avatar
                } else {
                    let avatar_val = {
                        bucket: config.customer_avatar_s3_bucket_name,
                        key: `${customerBody.email}_${customerBody.avatar['name']}`,
                        body: await this.#bucket.fileToArrayBuffer(customerBody.avatar)
                    }
                    customer_avatar = await this.#bucket.upload(avatar_val)
                }
            }

            // customerBody.password = this.#encryption.encrypt(customerBody.password)
            servResp.data = await this.#db.customers.update({
                data: {
                    full_name: customerBody.full_name,
                    avatar: customer_avatar.url ?? "",
                    updated_at: new Date(new Date().toUTCString()),
                    phone_number: customerBody.phone_number,
                    zipcode: customerBody.password,
                    email: customerBody.email
                },
                where: {
                    id: query.id
                }
            })
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }


}