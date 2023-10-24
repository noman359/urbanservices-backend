import { initializeExpress } from './express.js'

export const init = (express) => {
    // await dbLoader(dbUrl)
    initializeExpress(express)
}
