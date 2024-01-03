import { Router } from "express"
import handler from '../handlers/index.js'
import todoRouter from "./todo.router.js"
import vendorRouter from "./vendor.router.js"
import customerRouter from "./customer.router.js"
import serviceRouter from "./service.router.js"
import jobsRouter from "./jobs.router.js"
import paymentRouter from "./payment.router.js"


export default () => {
    let router = Router()
    todoRouter(router)
    vendorRouter(router)
    customerRouter(router)
    serviceRouter(router)
    jobsRouter(router)
    paymentRouter(router)
    router.use(handler.apiResponseHandler)
    return router
}