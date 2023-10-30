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
                where: filters.filter,
                take: filters.limit,
                skip: filters.offset * 10
            }), db.services.count({ where: filters.filter })])
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

}