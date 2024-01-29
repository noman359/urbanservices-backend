import handler from '../handlers/index.js'
import config from '../config/index.js'
import Prisma from '@prisma/client';
const { PrismaClient } = Prisma;
import { v4 as uuidv4 } from 'uuid';
let db = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })
let bucket = new handler.bucketHandler()
let encryption = new handler.encryption()
let commons = new handler.commonsHandler()
let JWT = new handler.JWT()

export default class CustomerService {

    constructor() { }


    async createCustomer(customerBody) {
        let servResp = new config.serviceResponse()
        let customer_avatar = new Object()
        try {
            console.debug('createCustomer() started')
            if (customerBody.avatar) {
                var arr = customerBody.avatar.name.split('.')
                    let extentionName = arr[arr.length - 1]
                let avatar_val = {
                    bucket: config.customer_avatar_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(customerBody.avatar)
                }
                customer_avatar = await bucket.upload(avatar_val)
            }
            if (customerBody.password.length < 5) {
                throw new Error("password should be atleast 5 characters long")
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

            let customer = await db.customers.findFirst({
                where: {
                    phone_number: customerBody.phone_number
                }
            })

            if (!customer) {
                throw new Error('User not found, Incorrect email or password')
            }

            let token = await JWT.getToken(customer)
            servResp.data = {
                ...customer, token: token
            }
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async readNotification(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getVendorData() started')
            let notification = await db.customer_notifications.update({
                where: {
                    id: query.id
                },
                data: {
                    isRead: 1
                }
                
            })
            servResp.data = notification
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async clearNotifications(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getVendorData() started')
            let notification = await db.customer_notifications.deleteMany({
                where: {
                    customer_id: query.id
                }
            })
            servResp.message = 'Notification successfully cleared'
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getNotifications(query) {

        let servResp = new config.serviceResponse()
        const dateObject = new Date()
        const previousDate = new Date(dateObject);
        previousDate.setDate(previousDate.getDate() - 1);

        const yesterdayDate = new Date(dateObject);
        yesterdayDate.setDate(yesterdayDate.getDate() - 2);
        try {
            

            var response = {};

            if (Number(query.page) > 1) {
                let olderNotifications = await db.customer_notifications.findMany({
                    where: {
                        customer_id: Number(query.customer_id),
                        created_at: {
                            lt: yesterdayDate,
                        },
                    
                    },
                    include: {
                        vendor: true
                    },
                    skip: (query.page - 1) * query.limit, // Calculate the number of records to skip based on page number
                    take: query.limit, // Set the number of records to be returned per page
    
                });
                
                response = {
                    older: olderNotifications
                }

            } else {
                let todayNotifications = await db.customer_notifications.findMany({
                    where: {
                        customer_id: Number(query.customer_id),
                        created_at: {
                            gte: previousDate,
                            lt: dateObject,
                        },
                        
                    },
                    include: {
                        vendor: true
                    },
    
                });
    
                let yesterdayNotifications = await db.customer_notifications.findMany({
                    where: {
                        customer_id: Number(query.customer_id),
                        created_at: {
                            gte: yesterdayDate,
                            lt: previousDate,
                        },
                    },
                    include: {
                        vendor: true
                    },
                });
    
                let olderNotifications = await db.customer_notifications.findMany({
                    where: {
                        customer_id: Number(query.customer_id),
                        created_at: {
                            lt: yesterdayDate,
                        },
                    },
                    include: {
                        vendor: true
                    },
                    skip: (query.page - 1) * query.limit, // Calculate the number of records to skip based on page number
                    take: query.limit, // Set the number of records to be returned per page
    
                });
                response = {
                    today: todayNotifications,
                    yesterday: yesterdayNotifications,
                    older: olderNotifications
                }
            }
            
            let unReadCount = await db.customer_notifications.count({
                where: {
                    customer_id:  Number(query.customer_id),
                    isRead: 0
                }
            })
            response.unReadCount = unReadCount
            servResp.data = response

            
        }
        catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp

    }

    async updateCustomer(query, customerBody) {
        let servResp = new config.serviceResponse()
        let customer_avatar = new Object()
        let front_id_avatar = new Object()
        let back_id_avatar = new Object()
        try {
            console.debug('createCustomer() started')
            let customer = await db.customers.findFirst({ where: { id: query.id } })

            if (!customer) {
                throw new Error('Customer not found!')
            }

            if (customerBody.avatar) {
                var arr = customerBody.avatar.name.split('.')
                let extentionName = arr[arr.length - 1]
                let avatar_val = {
                    bucket: config.customer_avatar_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(customerBody.avatar)
                }
                customer_avatar = await bucket.upload(avatar_val)
            }

            if (customerBody.front_id) {
                var arr = customerBody.front_id.name.split('.')
                    let extentionName = arr[arr.length - 1]
                let avatar_val = {
                    bucket: config.customer_avatar_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(customerBody.front_id)
                }
                front_id_avatar = await bucket.upload(avatar_val)
            }

            if (customerBody.back_id) {
                var arr = customerBody.back_id.name.split('.')
                    let extentionName = arr[arr.length - 1]
                let avatar_val = {
                    bucket: config.customer_avatar_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(customerBody.back_id)
                }
                back_id_avatar = await bucket.upload(avatar_val)
            }
            var frontImage = ''

            if (front_id_avatar.url != null) {
                frontImage = front_id_avatar.url
            } else {
                frontImage = customer.front_id ? customer.front_id : undefined
            }

            var backImage = ''

            if (front_id_avatar.url != null) {
                backImage = front_id_avatar.url
            } else {
                backImage = customer.front_id ? customer.front_id : undefined
            }

            // customerBody.password = encryption.encrypt(customerBody.password)
            await db.customers.update({
                data: {
                    full_name: customerBody.full_name ? customerBody.full_name : customer.full_name,
                    avatar: customer_avatar.url ? customer_avatar.url : customer.avatar,
                    updated_at: new Date(new Date().toUTCString()),
                    zipcode: customerBody.zipcode ? customerBody.zipcode : customer.zipcode,
                    email: customerBody.email ? customerBody.email : customer.email,
                    front_id: frontImage,
                    back_id: backImage,
                    cnic: customerBody.cnic ? customerBody.cnic : customer.cnic,
                    address : customerBody.address ? customerBody.address : customer.address
                },

                where: {
                    id: Number(query.id)
                }
            })
            console.debug('createCustomer() returning')
            servResp.data = await db.customers.findFirst({ where: { id: Number(query.id) } })
        } catch (error) {
            console.debug('createCustomer() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async saveCustomerFCMToken(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getVendorData() started')
            let customer = await db.customers.update({
                where: {
                    id: Number(query.customer_id)
                },
                data: {
                    fcm_token: query.token
                }
            })

            servResp.data = customer
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async saveCustomerReview(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getVendorData() started')
            let customer = await db.customer_reviews.create({
                data: {
                    comment: query.comment,
                    rating: Number(query.rating),
                    vendor_id: Number(query.vendor_id),
                    customer_id: Number(query.customer_id),
                    vendor_job_id: Number(query.vendor_job_id),
                    created_at: new Date(new Date().toUTCString())
                }
            })

            servResp.data = customer
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getCustomerReviews(query) {
        let servResp = new config.serviceResponse()
        try {
            const customer = await db.customer_reviews.findMany({
                where: {
                    customer_id: Number(query.customer_id)
                },

                select: {
                    id: true,
                    comment: true,
                    rating: true,
                    customers: {
                        select: {
                        id: true,
                        full_name: true,
                        avatar: true
                        }
                    }
                },
                skip: (query.page - 1) * query.limit, // Calculate the number of records to skip based on page number
                take: query.limit, // Set the number of records to be returned per page
                
              });
            

            servResp.data = customer
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
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
            delete servResp.data.fcm_token;
            console.debug('getCustomer() returning')
        } catch (error) {
            console.debug('getCustomer() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async signIn(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('customer signIn() started')
            let customer = await db.customers.findFirst({
                where: {
                    phone_number: query.phone_number
                }
            })

            if (!customer) {
                throw new Error('User not found, Incorrect email or password')
            }
            delete customer.fcm_token;
            let token = await JWT.getToken(customer)
            servResp.data = {
                ...customer, token: token
            }
            console.debug('customer signIn() ended')
        } catch (error) {
            console.debug('customer signIn() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }
}