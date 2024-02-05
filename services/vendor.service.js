import handler from '../handlers/index.js'
import config from '../config/index.js'
import { PrismaClient } from '@prisma/client';
import stripe from 'stripe';
const stripeInstance = stripe('sk_test_51OMUzdHmGYnRQyfQ80HgdP96iYWHbg5Surkh5c2uJgaXnUYeJS3OIEUj1NbS8U1jVH7YIPr8DfvjI28BjnbFCtvB00SxzStg0e');
import { v4 as uuidv4 } from 'uuid';
import { parse, format } from 'date-fns';
import PaymentService from './payment.service.js';

let db = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })
let bucket = new handler.bucketHandler()
let encryption = new handler.encryption()
let JWT = new handler.JWT()
export default class vendorService {
    constructor() { }

    async createVendor(vendorModel) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('createVendor() started')
            let user_id_front_resp = new Object()
            let user_id_back_resp = new Object()
            let vendor_avatar = new Object()

            let isVendorAlreadyRegistered = await db.vendor.findFirst({
                where: {
                    phone_number: vendorModel.phone_number
                }
            })

            if (isVendorAlreadyRegistered) {
                throw new Error('User already exist.')
            }

            if (vendorModel.user_id_front && vendorModel.user_id_back) {
                var arr = vendorModel.user_id_front.name.split('.')
                let extentionName = arr[arr.length - 1]
                let user_id_front_val = {
                    bucket: config.card_upload_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(vendorModel.user_id_front)
                }
                user_id_front_resp = await bucket.upload(user_id_front_val)

                let user_id_back_val = {
                    bucket: config.card_upload_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(vendorModel.user_id_back)
                }
                user_id_back_resp = await bucket.upload(user_id_back_val)
            }

            if (vendorModel.avatar) {
                var arr = vendorModel.avatar.name.split('.')
                let extentionName = arr[arr.length - 1]
                let avatar_val = {
                    bucket: config.vendor_avatar_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(vendorModel.avatar)
                }
                vendor_avatar = await bucket.upload(avatar_val)
            }

            let created_vendor = await db.vendor.create({
                data: {
                    created_at: new Date(new Date().toUTCString()),
                    email: vendorModel.email,
                    avatar: vendor_avatar.url ?? "",
                    city: vendorModel.city,
                    phone_number: vendorModel.phone_number,
                    date_of_birth: new Date(vendorModel.date_of_birth),
                    experience: Number(vendorModel.experience),
                    first_name: vendorModel.first_name,
                    gender: vendorModel.gender,
                    last_name: vendorModel.last_name,
                    user_id_back: user_id_back_resp.url ?? "",
                    user_id_front: user_id_front_resp.url ?? "",
                    zip_code: vendorModel.zip_code,
                    service_id: Number(vendorModel.service_id),
                    stripe_account_id: '',
                    state: vendorModel.state
                    // vendor_services: { createMany: { service_id: Array.isArray(vendorModel.services) ? vendorModel.services : JSON.parse(vendorModel.services) } }
                }
            })

            let vendor = await db.vendor.findFirst({
                where: {
                    phone_number: vendorModel.phone_number
                },
                include: {
                    services: true
                }
            })
           
            delete vendor.password
            let token = await JWT.getToken(vendor)

            var serviceAccount = await stripeInstance.accounts.create({
                type: 'custom',
                country: 'US',
                email: vendorModel.email,
                capabilities: {
                    card_payments: {
                        requested: true,
                    },
                    transfers: {
                        requested: true,
                    }
                },

            });

            var accountLink = await stripeInstance.accountLinks.create({
                account: serviceAccount.id,
                refresh_url: 'https://codersglobe.com',
                return_url: 'https://urban_cabs_vender',
                type: 'account_onboarding',
            });


            let newVendor = await db.vendor.update({
                where: {
                    id: created_vendor.id
                },
                data: {
                    stripe_account_id: serviceAccount.id,
                    on_board_url: accountLink.url
                }
            })

            if (vendorModel.services) {

                if (typeof vendorModel.services === 'string') {
                    vendorModel.services = JSON.parse(vendorModel.services)
                }
                let service_ids = Array.isArray(vendorModel.services) ? vendorModel.services : [vendorModel.services]
                let a = []
                let promises = service_ids.map(service_id => {
                    return db.vendor_services.create({ data: { service_id: service_id, vendor_id: created_vendor.id, created_at: new Date(new Date().toUTCString()) } })
                })
                created_vendor['vendor_services'] = await Promise.all(promises)
            }

            let paymentController = new PaymentService()
            let account = await paymentController.checkConnectAccountStatus(newVendor)
            created_vendor.payment_status = account

            created_vendor['stripe_account_id'] = serviceAccount.id
            created_vendor['token'] = token
            console.debug("created vendor data", created_vendor)
            servResp.data = created_vendor
            servResp.data['on_board_url'] = accountLink.url
            console.debug('createVendor() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp

    }

    async signIn(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('vendor signIn() started')
            let vendor = await db.vendor.findFirst({
                where: {
                    phone_number: query.phone_number
                },
                include: {
                    services: true
                }
            })

            if (!vendor) {
                throw new Error('User not found, Incorrect email or password')
            }
            delete vendor.password
            delete vendor.fcm_token
            let paymentController = new PaymentService()
            let account = await paymentController.checkConnectAccountStatus(vendor)
            vendor.payment_status = account
            let token = await JWT.getToken(vendor)
            servResp.data = {
                ...vendor, token: token
            }

            console.debug('vendor signIn() ended')
        } catch (error) {
            console.debug('vendor signIn() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async saveVendorFCMToken(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getVendorData() started')
            let vendor = await db.vendor.update({
                where: {
                    id: query.vendor_id
                },
                data: {
                    fcm_token: query.token
                }
            })

            servResp.data = vendor
            console.debug('getVendorData() ended')
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
            let notification = await db.notifications.update({
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
            let notification = await db.notifications.deleteMany({
                where: {
                    vendor_id: query.id
                }
            })
            servResp.message = 'Notifications successfully cleared'
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
                let olderNotifications = await db.notifications.findMany({
                    where: {
                        vendor_id: Number(query.vendor_id),
                        created_at: {
                            lt: yesterdayDate,
                        },
                    },
                    skip: (query.page - 1) * query.limit, // Calculate the number of records to skip based on page number
                    take: query.limit, // Set the number of records to be returned per page

                });

                response = {
                    older: olderNotifications
                }

            } else {
                let todayNotifications = await db.notifications.findMany({
                    where: {
                        vendor_id: Number(query.vendor_id),
                        created_at: {
                            gte: previousDate,
                            lt: dateObject,
                        },
                    },

                });

                let yesterdayNotifications = await db.notifications.findMany({
                    where: {
                        vendor_id: Number(query.vendor_id),
                        created_at: {
                            gte: yesterdayDate,
                            lt: previousDate,
                        },
                    },

                });

                let olderNotifications = await db.notifications.findMany({
                    where: {
                        vendor_id: Number(query.vendor_id),
                        created_at: {
                            lt: yesterdayDate,
                        },
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


            let unReadCount = await db.notifications.count({
                where: {
                    vendor_id:  Number(query.vendor_id),
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

    async getVendorData(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getVendorData() started')
            var vendor = await db.vendor.findFirst({
                where: {
                    id: Number(query.id)
                }, include: { vendor_reviews: true, services: true }
            })


            var rating = 0
            for (var review of vendor.vendor_reviews) {
                rating += review.rating
            }
            let paymentController = new PaymentService()
            let account = await paymentController.checkConnectAccountStatus(vendor)
            vendor.payment_status = account
            vendor.rating = rating
            delete vendor.fcm_token
            servResp.data = vendor
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getVendorsList(filters = { limit: 10, offset: 0 }) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getVendorList() started')
            const paginatedData = await db.vendor.findMany({
                where: {
                    service_id: Number(filters.service_id),
                    status: 'online'
                },
                skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                take: filters.limit, // Set the number of records to be returned per page
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    charges: true,
                    avatar: true,
                    lat: true,
                    long: true,
                    status: true,
                    vendor_reviews: {
                        select: {
                            id: true,
                            description: true,
                            rating: true,
                            created_at: true,
                            updated_at: true,
                        },
                    },
                    services: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });


            var reviews = paginatedData["vendor_reviews"]
            for (var element of paginatedData) {
                var rating = 0
                console.log(element);
                for (var review of element.vendor_reviews) {
                    rating += review.rating
                }
                element.rating = rating

            }
            servResp.data = paginatedData
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async updateVendor(query, vendorModel) {
        let servResp = new config.serviceResponse()
        let vendor_avatar = new Object()
        let front_id_avatar = new Object()
        let back_id_avatar = new Object()
        try {

            let vendorDetail = await db.vendor.findFirst({ where: { id: Number(query.id) } })

            if (!vendorDetail) {
                throw new Error('Customer not found!')
            }

            if (vendorModel.avatar) {
                var arr = vendorModel.avatar.split('.')
                let extentionName = arr[arr.length - 1]
                let avatar_val = {
                    bucket: config.customer_avatar_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(vendorModel.avatar)
                }
                vendor_avatar = await bucket.upload(avatar_val)
            }

            if (vendorModel.front_id) {
                var arr = vendorModel.front_id.name.split('.')
                    let extentionName = arr[arr.length - 1]
                let avatar_val = {
                    bucket: config.customer_avatar_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(vendorModel.front_id)
                }
                front_id_avatar = await bucket.upload(avatar_val)
            }

            if (vendorModel.back_id) {
                var arr = vendorModel.back_id.name.split('.')
                    let extentionName = arr[arr.length - 1]
                let avatar_val = {
                    bucket: config.customer_avatar_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(vendorModel.back_id)
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

            if (back_id_avatar.url != null) {
                backImage = back_id_avatar.url
            } else {
                backImage = customer.front_id ? customer.front_id : undefined
            }

            let updated_vendor = await db.vendor.update({
                data: {
                    updated_at: new Date(new Date().toUTCString()),
                    email: vendorModel.email ? vendorModel.email : vendorDetail.email,
                    avatar: vendor_avatar.url ? vendor_avatar.url : vendorDetail.avatar,
                    city: vendorModel.city ? vendorModel.city : vendorDetail.city,
                    experience: vendorModel.experience ? Number(vendorModel.experience) : Number(vendorDetail.experience),
                    first_name: vendorModel.first_name ? vendorModel.first_name : vendorDetail.first_name,
                    gender: vendorModel.gender ? vendorModel.gender : vendorDetail.gender,
                    is_online: vendorModel.is_online ? Boolean(vendorModel.is_online) : vendorDetail.is_online,
                    last_name: vendorModel.last_name ? vendorModel.last_name : vendorDetail.last_name,
                    user_id_back: backImage,
                    user_id_front: frontImage,
                    bio: vendorModel.bio ? vendorModel.bio : vendorDetail.bio,
                    zip_code: vendorModel.zip_code ? vendorModel.zip_code : vendorDetail.zip_code
                }, where: {
                    id: Number(query.id)
                }
            })

            if (vendorModel.services) {
                await db.vendor_services.deleteMany({ where: { vendor_id: Number(query.id) } })
                if (typeof vendorModel.services === 'string') {
                    vendorModel.services = JSON.parse(vendorModel.services)
                }
                let service_ids = Array.isArray(vendorModel.services) ? vendorModel.services : [vendorModel.services]
                let a = []
                let promises = service_ids.map(service_id => {
                    return db.vendor_services.create({ data: { service_id: service_id, vendor_id: Number(query.id), created_at: new Date(new Date().toUTCString()) } })
                })
                created_vendor['vendor_services'] = await Promise.all(promises)
            }

            let vendor = await db.vendor.findFirst({ where: { id: Number(query.id) } })

            console.log(vendor)
            console.debug("Updated vendor data", vendor)
            servResp.data = vendor
            console.debug('updateVendor() ended')
        } catch (error) {
            console.debug('updateVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp

    }

    async getVendorServices(query, filters = { limit: 10, offset: 0 }) {
        let servResp = new config.serviceResponse()
        let where_cols = {
            vendor_id: query.id
        }

        let include_tables = {
            services: true
        }

        try {
            console.debug('getVendorServices() Started')
            if (query.hasOwnProperty("service_id")) {
                where_cols['service_id'] = query.service_id
                include_tables['vendor'] = {
                    include: {
                        vendor_jobs:
                        {
                            take: filters.limit ?? 10,
                            where: { status: 'done' },
                            skip: ((filters.offset ?? 0) * 10),
                            select:
                            {
                                stars: true, comment: true, customers:
                                {
                                    select:
                                        { full_name: true, avatar: true }
                                }, created_at: true
                            }
                        }
                    }
                }


                servResp.data = await db.vendor_services.findMany({
                    where: where_cols,
                    include: include_tables
                })

            }
            console.debug('getVendorServices() returning')
        } catch (error) {
            console.debug('getVendorServices() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }

        return servResp;
    }

    async getVendorJobs(query, filters) {
        let servResp = new config.serviceResponse()
        let where_clause = { vendor_id: Number(query.id) }
        if (filters) {
            where_clause['status'] = filters.status
        }
        try {
            console.debug('getVendorJobs() Started')
            let jobs = await db.vendor_jobs.findMany({
                where: where_clause, include: {
                    sub_services: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                            services: {
                                select: {
                                    id: true,
                                    name: true,
                                    avatar: true
                                }
                            }
                        }
                    }, customers: true
                }, orderBy: { created_at: 'desc' },
                skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                take: filters.limit, // Set the number of records to be returned per page
            })
            servResp.data = jobs
            console.debug('getVendorJobs() returning ')
        } catch (error) {
            console.debug('getVendorJobs() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp

    }

    async saveVendorReview(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getVendorData() started')
            let customer = await db.vendor_reviews.create({
                data: {
                    description: query.comment,
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

    async saveVendorCoordinates(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getVendorData() started')
            let vendor = await db.vendor.update({
                data: {
                    lat: Number(query.lat),
                    long: Number(query.long),
                },
                where: {
                    id: Number(query.vendor_id)
                }

            })

            servResp.data = vendor
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async changeVendorStatus(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getVendorData() started')
            let vendor = await db.vendor.update({
                data: {
                    status: query.status
                },
                where: {
                    id: Number(query.vendor_id)
                }

            })

            servResp.data = vendor
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }


    async getVendorReview(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getVendorData() started')
            let vendors = await db.vendor_reviews.findMany({
                where: {
                    vendor_id: Number(query.vendor_id)
                },
                select: {
                    id: true,
                    description: true,
                    rating: true,
                    vendor: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            avatar: true
                        }
                    }
                },
                skip: (query.page - 1) * query.limit, // Calculate the number of records to skip based on page number
                take: query.limit, // Set the number of records to be returned per page
            })

            servResp.data = vendors
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }


    async getVendorJobDetails(query, filters = { limit: 10, offset: 0, filter: '' }) {
        let servResp = new config.serviceResponse()
        try {
            let sql = `
            SELECT vendor_jobs.id,
       vendor_jobs.vendor_id,
       vendor_jobs.customer_id,
       vendor_jobs.status,
       vendor_jobs.created_at,
       vendor_jobs.updated_at,
       vendor_jobs.verdict_at,
       vendor_jobs.job_images,
       vendor_jobs.description,
       vendor_jobs.location,
       vendor_jobs.description,
       vendor_jobs.sub_service_id,
       c.full_name,
       c.id                           AS       customer_id,
       s.id                           AS       sub_service_id,
       s.name                         AS       service_name,
       COALESCE(AVG(vendor_jobs_all.stars), 0) average_rating,
       COUNT(vendor_jobs_all.comment) AS       total_reviews
FROM vendor_jobs vendor_jobs
         INNER JOIN customers c ON vendor_jobs.customer_id = c.id
         LEFT JOIN vendor_jobs vendor_jobs_all
                   ON vendor_jobs_all.vendor_id = vendor_jobs.vendor_id AND vendor_jobs_all.status = 'done'
         INNER JOIN services s ON vendor_jobs.sub_service_id = s.id
WHERE vendor_jobs.id = ${Number(query.job_id)};`

            let stars_filters = ''
            if (filters.filter !== '' && filters.filter != null) {
                let [k, v] = filters.filter.split(':')
                stars_filters = `AND vendor_jobs.${k}=${v}`
            }

            let [job_details] = await Promise.all([db.$queryRawUnsafe(sql)])
            if (job_details.length > 0) {
                job_details = job_details.map(job => {
                    job.total_reviews = Number(job.total_reviews)
                    return job
                })[0]
            } servResp.data = job_details
        } catch (error) {
            console.debug('getVendorJobs() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }
}