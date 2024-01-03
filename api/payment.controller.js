import PaymentService from "../services/payment.service.js"
import TokenHandler from "../handlers/token.handler.js"
let servicesServ = new PaymentService()
let tokenHandler = new TokenHandler()

export default class PaymentController {

    constructor() { }

    async createPaymentIntent(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let services = await servicesServ.createPaymentIntents({ price: req.body.price, job_id: req.body.job_id })
            next(services)
        }
    }
}