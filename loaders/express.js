import bodyParser from 'body-parser'
import cors from 'cors'
import config from '../config/index.js'
import routers from '../routers/index.js'

export const initializeExpress = (app) => {
    app.use(cors())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())
    app.use(`${config.apiPrefix}`, routers())
}

