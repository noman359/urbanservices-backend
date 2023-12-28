import Prisma from '@prisma/client';
const { PrismaClient } = Prisma;
import config from '../config/index.js'

let db = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })

export default class ServicesService {

    constructor() { }

    async getServices(filters = {
        limit: 10, offset: 0, search: "", filter: {}
    }) {
        let servResp = new config.serviceResponse()
        try {
            let [services, count] = await db.$transaction([db.services.findMany({
                where: { name: { contains: filters.search } },
                skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                take: filters.limit, // Set the number of records to be returned per page
            }), db.services.count({
                where: { name: { contains: filters.search } },
                skip: (filters.offset - 1) * filters.limit,
                take: filters.limit
            })])
            servResp.data = {
                services: services,
                count: count
            }
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getSubServices(filters = {
        service_id: 0, limit: 10, offset: 0
    }) {
        let servResp = new config.serviceResponse()
        try {
            let [sub_services, count] = await db.$transaction([db.sub_services.findMany({
                where: {
                    services_id: filters.service_id
                },
                include: {
                    services: true, // This includes the posts related to the user
                },
                take: filters.limit,
                skip: filters.offset * 10
            }), db.services.count({ where: filters.filter })])
            servResp.data = {
                sub_services: sub_services,
                count: count
            }
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

}
