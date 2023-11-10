import handler from '../handlers/index.js'
import Prisma from '@prisma/client';
const { PrismaClient } = Prisma;

let db = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })


let commons = new handler.commonsHandler()
export default class ChatroomService {
    async getConversation(query) {
        await db.conversation.findFirst({ where: { id: Number(query.id) } })

    }
}