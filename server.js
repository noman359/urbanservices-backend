import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import config from './config/index.js'
import routers from './routers/index.js'
import handlers from './handlers/index.js'



// const io = new Server(server);


const startServer = () => {
    const app = express()



    app.use(cors())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())
    app.use(`${config.apiPrefix}`, routers())
    console.log(config)
    app.listen(config.port, () => {
        console.log(`urban services backend running on http://localhost:${config.port}`)
    })
   const socketHanlder = new handlers.socketHanlder()
   socketHanlder.initSocket(app)

}

startServer()
