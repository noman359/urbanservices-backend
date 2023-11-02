import handler from '../handlers/index.js'
import config from '../config/index.js'
import Prisma from '@prisma/client';
const { PrismaClient } = Prisma;

let db = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })
let bucket = new handler.bucketHandler()
let encryption = new handler.encryption()
let JWT = new handler.JWT()
let commons = new handler.commonsHandler()

export default class CustomerService {






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
                    body: await bucket.fileToArrayBuffer(customerBody.avatar)
                }
                customer_avatar = await bucket.upload(avatar_val)
            }

            customerBody.password = encryption.encrypt(customerBody.password)
            servResp.data = await db.customers.create({
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
            let customer = await db.customers.findFirst({ where: { id: query.id } })

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
                        body: await bucket.fileToArrayBuffer(customerBody.avatar)
                    }
                    customer_avatar = await bucket.upload(avatar_val)
                }
            }

            // customerBody.password = encryption.encrypt(customerBody.password)
            servResp.data = await db.customers.update({
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
            console.debug('createCustomer() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }


    async getCustomers(filters = { limit: 10, offset: 0, search: "", sort: "" }) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getCustomers() started')
            let order_by_clause = commons.getRawSort(filters.sort)
            let pagination_clause = commons.getRawPaginate(filters.limit, filters.offset)
            let where_clause = `WHERE (full_name LIKE '${filters.search}%' OR email LIKE '${filters.search}%' OR phone_number LIKE '${filters.search}%')`

            let sql = `SELECT id, full_name, phone_number, zipcode, created_at, avatar, updated_at, email
            FROM customers
            ${where_clause}
            ${order_by_clause}
            ${pagination_clause};`

            let count_sql = `SELECT count(id) as total_count
            FROM customers
            ${where_clause}
            ${order_by_clause}`;

            let [data, count] = await Promise.all([db.$queryRawUnsafe(sql), db.$queryRawUnsafe(count_sql)])
            console.log(count)
            servResp.data = { customers: data, count: count.length > 0 ? Number(count[0].total_count) : 0 }
            console.debug('getCustomers() returning')
        } catch (error) {
            console.debug('getCustomers() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getCustomer(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getCustomer() started')
            servResp.data = await db.customers.findFirst({ where: { id: Number(query.id) } })
            console.debug('getCustomer() returning')
        } catch (error) {
            console.debug('getCustomer() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }


}