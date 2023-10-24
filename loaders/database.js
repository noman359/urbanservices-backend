import { PrismaClient } from '@prisma/client'


export default class DBConn {
    #db = new PrismaClient()
    constructor() {
        if (!this.#db) {
            this.#db = new PrismaClient()
        }

    }


    async connect() {
        await this.#db.$connect()
    }

    async getConnection() {
        await this.#db.$connect()
        return this.#db
    }



    async diconnect() {
        process.on('exit', async () => { await this.#db.$disconnect() })
        process.on('beforeExit', async () => { await this.#db.$disconnect() })
        process.on('SIGINT', async () => { await this.#db.$disconnect() })
        process.on('SIGTERM', async () => { await this.#db.$disconnect() })
        process.on('SIGUSR2', async () => { await this.#db.$disconnect() })
    }




}