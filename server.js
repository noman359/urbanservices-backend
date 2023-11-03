import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import config from './config/index.js'
import routers from './routers/index.js'
import ServerlessHttp from 'serverless-http'
const serverless_handler = null
const startServer = () => {
    const app = express()

    app.use(cors())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())
    app.use(`${config.apiPrefix}`, routers())
    if (config.environment === 'prod') {
        exports.handler = serverless_handler(app)
    } else {
        app.listen(config.port, () => {
            console.log(`urban services backend running on http://localhost:${config.port}`)
        })
    }
}

startServer()
