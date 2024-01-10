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
            server.listen(3001, () => {
                console.log(`Socket is listening to http://localhost:3001`);
            })

            this.#io = new Server(server, {
                cors: {
                    origin: '*',
                    methods: ['GET', 'POST']
                }
            });

            this.#io.on('connection', (socket) => {
                console.log('A user connected');

                // Identify the user as vendor or customer
                
                socket.on('identify', (role, customerId) => {
                    socket.role = role;
                    socket.customerId = customerId;
                    console.log(`A ${role} connected with customerId ${customerId}`);
                    
                    // Join the room based on customerId
                    socket.join(`customer_${customerId}`);
                  });

                // Handle coordinates from vendors and broadcast to customers
                socket.on('coordinates', (data) => {
                    console.log(data);

                    // Broadcast coordinates to customers
                   socket.to(`customer_${socket.customerId}`).emit('vendorCoordinates', data);
                });

                // Handle disconnection
                socket.on('disconnect', () => {
                    console.log(`A ${socket.role} disconnected`);
                });
            });

        }



    }

}