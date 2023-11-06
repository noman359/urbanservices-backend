import handler from '../handlers/index.js'
import config from '../config/index.js'
import { PrismaClient } from '@prisma/client';


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
            if (vendorModel.password.length < 5) {
                throw new Error("password should be atleast 5 characters long")
            }
            vendorModel.password = encryption.encrypt(vendorModel.password)

            if (vendorModel.user_id_front && vendorModel.user_id_back) {
                let user_id_front_val = {
                    bucket: config.card_upload_s3_bucket_name,
                    key: `${vendorModel.username}_${vendorModel.user_id_front['name']}`,
                    body: await bucket.fileToArrayBuffer(vendorModel.user_id_front)
                }
                user_id_front_resp = await bucket.upload(user_id_front_val)

                let user_id_back_val = {
                    bucket: config.card_upload_s3_bucket_name,
                    key: `${vendorModel.username}_${vendorModel.user_id_back['name']}`,
                    body: await bucket.fileToArrayBuffer(vendorModel.user_id_back)
                }
                user_id_back_resp = await bucket.upload(user_id_back_val)
            }

            if (vendorModel.avatar) {
                let avatar_val = {
                    bucket: config.vendor_avatar_s3_bucket_name,
                    key: `${vendorModel.username}_${vendorModel.avatar['name']}`,
                    body: await bucket.fileToArrayBuffer(vendorModel.avatar)
                }
                vendor_avatar = await bucket.upload(avatar_val)
            }

            let created_vendor = await db.vendor.create({
                data: {
                    created_at: new Date(new Date().toUTCString()),
                    email: vendorModel.email,
                    password: vendorModel.password,
                    avatar: vendor_avatar.url ?? "",
                    city: vendorModel.city,
                    // date_of_birth: new Date(vendorModel.date_of_birth),
                    experience: Number(vendorModel.experience),
                    first_name: vendorModel.first_name,
                    gender: vendorModel.gender,
                    last_name: vendorModel.last_name,
                    user_id_back: user_id_back_resp.url ?? "",
                    user_id_front: user_id_front_resp.url ?? "",
                    zip_code: vendorModel.zip_code,
                    // vendor_services: { createMany: { service_id: Array.isArray(vendorModel.services) ? vendorModel.services : JSON.parse(vendorModel.services) } }
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
            console.debug("created vendor data", created_vendor)
            servResp.data = created_vendor
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
            let encrypted_password = encryption.encrypt(query.password)
            let vendor = await db.vendor.findFirst({
                where: {
                    email: query.email,
                    password: encrypted_password
                }
            })

            if (!vendor) {
                throw new Error('User not found, Incorrect email or password')
            }
            delete vendor.password
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

    async getVendorData(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getVendorData() started')
            let vendor = await db.vendor.findFirst({
                where: {
                    id: Number(query.id)
                }, include: { vendor_services: { include: { services: true } } }
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

    async updateVendor(query, vendorModel) {
        let servResp = new config.serviceResponse()
        try {
            console.debug("updateVendor() started")
            let user_id_front_resp = new Object()
            let user_id_back_resp = new Object()
            let vendor_avatar = new Object()
            if (vendorModel.user_id_front && vendorModel.user_id_back) {
                let user_id_front_val = {
                    bucket: config.card_upload_s3_bucket_name,
                    key: `${vendorModel.username}_${vendorModel.user_id_front['name']}`,
                    body: await bucket.fileToArrayBuffer(vendorModel.user_id_front)
                }
                user_id_front_resp = await bucket.upload(user_id_front_val)

                let user_id_back_val = {
                    bucket: config.card_upload_s3_bucket_name,
                    key: `${vendorModel.username}_${vendorModel.user_id_back['name']}`,
                    body: await bucket.fileToArrayBuffer(vendorModel.user_id_back)
                }
                user_id_back_resp = await bucket.upload(user_id_back_val)
            }

            if (vendorModel.avatar) {
                let avatar_val = {
                    bucket: config.customer_avatar_s3_bucket_name,
                    key: `${vendorModel.username}_${vendorModel.avatar['name']}`,
                    body: await bucket.fileToArrayBuffer(vendorModel.avatar)
                }
                vendor_avatar = await bucket.upload(avatar_val)
            }

            let updated_vendor = await db.vendor.update({
                data: {
                    updated_at: new Date(new Date().toUTCString()),
                    email: vendorModel.email || undefined,
                    avatar: vendor_avatar.url || undefined,
                    city: vendorModel.city || undefined,
                    // date_of_birth: vendorModel.date_of_birth ? new Date(vendorModel.date_of_birth) : undefined,
                    experience: vendorModel.experience ? Number(vendorModel.experience) : undefined,
                    first_name: vendorModel.first_name || undefined,
                    gender: vendorModel.gender || undefined,
                    is_online: vendorModel.is_online ? Boolean(vendorModel.is_online) : undefined,
                    last_name: vendorModel.last_name || undefined,
                    user_id_back: user_id_back_resp.url || undefined,
                    user_id_front: user_id_front_resp.url || undefined,
                    zip_code: vendorModel.zip_code || undefined
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
}