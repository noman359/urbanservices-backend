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
            // const  customer = Customers()
            // const vendor = Vendor()
            const server = http.createServer(app)
            server.listen(8081,() => {
                console.log(`Socket is listening to http://localhost:8081`);
            })

            this.#io = new Server(server,{
                cors: {
                    origin: '*',
                    methods: ['GET', 'POST']
                }
                });

            this.#io.on('connection', (socket) => {
                console.log('A user connected');
                console.log(socket)
                // Identify the user as vendor or customer
                
                socket.on('identify', (role, customerId) => {
                    socket.role = role;
                    socket.customerId = customerId;
                    console.log(`A ${role} connected with customerId ${customerId}`);
                    console.log(`customer_${customerId}`);
                    // Join the room based on customerId
                    
                 socket.join(`customer_${customerId}`);
                  });

                // Handle coordinates from vendors and broadcast to customers
                socket.on('coordinates', (data) => {

                    console.log(`coordinates channel received the data at customer_${socket.customerId}`);
                    console.log('Data is: ',data);

                    // Broadcast coordinates to customers
                socket.broadcast.to(`customer_${socket.customerId}`).emit('vendorCoordinates', data);

                 // socket.to(`customer_${socket.customerId}`).emit('vendorCoordinates', data);
                });

                // Handle disconnection
                socket.on('disconnect', () => {
                    console.log(`A ${socket.role} disconnected`);
                });
            });

        }



    }

}