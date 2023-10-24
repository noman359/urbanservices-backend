import Prisma from '@prisma/client';
const { PrismaClient } = Prisma;
import config from '../config/index.js'

export default class ServicesService {

    #db = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })
    constructor() { }

    async getServices(filters = {
        limit: 10, offset: 0, search: "", filter: {}
    }) {
        let servResp = new config.serviceResponse()
        try {
            let [services, count] = await this.#db.$transaction([this.#db.services.findMany({
                where: filters.filter,
                take: filters.limit,
                skip: filters.offset * 10
            }), this.#db.services.count({ where: filters.filter })])
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