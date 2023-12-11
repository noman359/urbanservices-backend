import handler from '../handlers/index.js'
import config from '../config/index.js'
import Prisma, { vendor_jobs_status } from '@prisma/client';
const { PrismaClient } = Prisma;

let db = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })
let bucket = new handler.bucketHandler()
let encryption = new handler.encryption()
let commons = new handler.commonsHandler()
let JWT = new handler.JWT()

export default class JobsService {

    constructor() { }


    async createJob(job) {
        let servResp = new config.serviceResponse()
        let job_image = new Object()
        try {
            console.debug('createCustomer() started')
            if (job.job_image) {
                let avatar_val = {
                    bucket: config.jobs_s3_bucket_name,
                    key: `${Date().toString}`,
                    body: await bucket.fileToArrayBuffer(job.job_image)
                }
                job_image = await bucket.upload(avatar_val)
            }

            var sceduleDateTime = new Date(job.sceduled_time);

            var propertyResult = await db.job_property_details.create({
                data: {
                    type: job.type,
                    rooms: parseInt(job.rooms, 10),
                    bathrooms: parseInt(job.bathrooms, 10),
                    created_at: new Date(new Date().toUTCString())
                }
            })
            console.log(propertyResult.id)
            if (job.job_type == "urgent") {
            servResp.data = await db.vendor_jobs.create({

                data: {

                    status: vendor_jobs_status.pending,
                    description: job.description,
                    job_images: job_image.url,
                    location: job.location,
                    created_at: new Date(new Date().toUTCString()),
                    job_type: "urgent",
                    sub_service_id: parseInt(job.sub_service_id, 10),
                    customer_id: parseInt(job.customer_id, 10),
                    vendor_id: parseInt(job.vendor_id, 10),
                    job_property_details_id: parseInt(propertyResult.id, 10)
                    

                }
            })
        } else {

            servResp.data = await db.vendor_jobs.create({

                data: {

                    status: vendor_jobs_status.pending,
                    description: job.description,
                    job_images: job_image.url,
                    scheduled_time: sceduleDateTime,
                    location: job.location,
                    created_at: new Date(new Date().toUTCString()),
                    job_type: "scheduled",
                    sub_service_id: parseInt(job.sub_service_id, 10),
                    customer_id: parseInt(job.customer_id, 10),
                    vendor_id: parseInt(job.vendor_id, 10),
                    job_property_details_id: parseInt(propertyResult.id, 10)
                    

                }
            })
        }
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async requestJobEstimates(job) {
        let servResp = new config.serviceResponse()
        let job_image = new Object()
        try {            
            servResp.data = await db.estimates.create({
                data: {
                    customer_id: job.customer_id,
                    vendor_id: job.vendor_id,
                    vendor_job_id: job.job_id,
                    status: "REQUESTED",
                    created_at: new Date(new Date().toUTCString())
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

    async providedJobEstimates(job) {
        let servResp = new config.serviceResponse()
        let job_image = new Object()
        try {            
            servResp.data = await db.estimates.update({
                
                data: {
                    estimated_price: job.estimated_price,
                    estimated_hours: job.estimated_hours,
                    status: "PROVIDED",
                    updated_at: new Date(new Date().toUTCString())
                },
                where: {
                    id: Number(job.request_id)
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

    async getEstimatesListForCustomer(job) {
        let servResp = new config.serviceResponse()
        try {
            let estimates = await db.estimates.findMany({
                where: {
                   customer_id: Number(job.customer_id)
                }
            })
            servResp.data = {
                estimates: estimates
            }
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getEstimatesListForVendor(job) {
        let servResp = new config.serviceResponse()
        try {
            let estimates = await db.estimates.findMany({
                where: {
                   vendor_id: Number(job.vendor_id)
                }
            })
            servResp.data = {
                estimates: estimates
            }
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    

    // async updateCustomer(query, customerBody) {
    //     let servResp = new config.serviceResponse()
    //     let customer_avatar = new Object()
    //     try {
    //         console.debug('createCustomer() started')
    //         let customer = await db.customers.findFirst({ where: { id: query.id } })

    //         if (!customer) {
    //             throw new Error('Customer not found!')
    //         }

    //         if (customerBody.avatar) {
    //             if (typeof customerBody.avatar === 'string') {
    //                 customer_avatar['url'] = customerBody.avatar
    //             } else {
    //                 let avatar_val = {
    //                     bucket: config.customer_avatar_s3_bucket_name,
    //                     key: `${customerBody.email}_${customerBody.avatar['name']}`,
    //                     body: await bucket.fileToArrayBuffer(customerBody.avatar)
    //                 }
    //                 customer_avatar = await bucket.upload(avatar_val)
    //             }
    //         }

    //         // customerBody.password = encryption.encrypt(customerBody.password)
    //         await db.customers.update({
    //             data: {
    //                 full_name: customerBody.full_name || undefined,
    //                 avatar: customer_avatar.url ? customer_avatar.url : undefined,
    //                 updated_at: new Date(new Date().toUTCString()),
    //                 phone_number: customerBody.phone_number || undefined,
    //                 zipcode: customerBody.zipcode || undefined,
    //                 email: customerBody.email || undefined
    //             },
    //             where: {
    //                 id: Number(query.id)
    //             }
    //         })
    //         console.debug('createCustomer() returning')
    //         servResp.data = await db.customers.findFirst({ where: { id: Number(query.id) } })
    //     } catch (error) {
    //         console.debug('createCustomer() exception thrown')
    //         servResp.isError = true
    //         servResp.message = error.message
    //     }
    //     return servResp
    // }


    // async getCustomers(filters = { limit: 10, offset: 0, search: "", sort: "" }) {
    //     let servResp = new config.serviceResponse()
    //     try {
    //         console.debug('getCustomers() started')
    //         let order_by_clause = commons.getRawSort(filters.sort)
    //         let pagination_clause = commons.getRawPaginate(filters.limit, filters.offset)
    //         let where_clause = `WHERE (full_name LIKE '${filters.search}%' OR email LIKE '${filters.search}%' OR phone_number LIKE '${filters.search}%')`

    //         let sql = `SELECT id, full_name, phone_number, zipcode, created_at, avatar, updated_at, email
    //         FROM customers
    //         ${where_clause}
    //         ${order_by_clause}
    //         ${pagination_clause};`

    //         let count_sql = `SELECT count(id) as total_count
    //         FROM customers
    //         ${where_clause}
    //         ${order_by_clause}`;

    //         let [data, count] = await Promise.all([db.$queryRawUnsafe(sql), db.$queryRawUnsafe(count_sql)])
    //         console.log(count)
    //         servResp.data = { customers: data, count: count.length > 0 ? Number(count[0].total_count) : 0 }
    //         console.debug('getCustomers() returning')
    //     } catch (error) {
    //         console.debug('getCustomers() exception thrown')
    //         servResp.isError = true
    //         servResp.message = error.message
    //     }
    //     return servResp
    // }

    // async getCustomer(query) {
    //     let servResp = new config.serviceResponse()
    //     try {
    //         console.debug('getCustomer() started')
    //         servResp.data = await db.customers.findFirst({ where: { id: Number(query.id) } })
    //         console.debug('getCustomer() returning')
    //     } catch (error) {
    //         console.debug('getCustomer() exception thrown')
    //         servResp.isError = true
    //         servResp.message = error.message
    //     }
    //     return servResp
    // }


    // async signIn(query) {
    //     let servResp = new config.serviceResponse()
    //     try {
    //         console.debug('customer signIn() started')
    //         let encrypted_password = encryption.encrypt(query.password)
    //         let customer = await db.customers.findFirst({
    //             where: {
    //                 phone_number: query.phone_number,
    //                 password: encrypted_password,

    //             }
    //         })

    //         if (!customer) {
    //             throw new Error('User not found, Incorrect email or password')
    //         }

    //         let token = await JWT.getToken(customer)
    //         servResp.data = {
    //             ...customer, token: token
    //         }
    //         console.debug('customer signIn() ended')
    //     } catch (error) {
    //         console.debug('customer signIn() exception thrown')
    //         servResp.isError = true
    //         servResp.message = error.message
    //     }
    //     return servResp
    // }


}