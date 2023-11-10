import http from 'http'
import { Server } from 'socket.io'

export default class socketHandler {
    #io = {}
    constructor() {

    }

    initSocket(app) {
        if (Object.keys(this.#io).length > 0) {
            return this.#io
        } else {
            const server = http.createServer(app)

            this.#io = new Server(server, { cors: { origin: 'https://a771-2407-d000-d-c9a9-9888-88b4-b4d0-5b52.ngrok.io', methods: ['GET', 'POST'] } })
            console.log(`Socket is listening to http://localhost:8081`)
        }
    }

}