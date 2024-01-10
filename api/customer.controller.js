import TokenHandler from "../handlers/token.handler.js"
import CustomerService from "../services/customer.service.js"
import VendorController from "./vendor.controller.js"
import config from '../config/index.js'

let customerServ = new CustomerService()
let tokenHandler = new TokenHandler()

export default class CustomerController {

    constructor() { }

    async createCustomer(req, res, next) {
        let created_customer = await customerServ.createCustomer(req.body)
        next(created_customer)
    }

    async updateCustomer(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
        let updated_customer = await customerServ.updateCustomer({ id: Number(req.params.id) }, req.body)
        next(updated_customer)
        }
    }

    async getCustomerNotications(req, res, next) {
        console.log(req)
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorResp = await customerServ.getNotifications({ customer_id: req.query.customer_id, limit: Number(req.query.limit), page: Number(req.query.page) })
            next(vendorResp)
        }
    }

    async getFCMToken(req, res, next) {
        let created_customer_token = await customerServ.saveCustomerFCMToken(req.body)
        next(created_customer_token)
    }


    async getCustomers(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
        let customers = await customerServ.getCustomers({ limit: Number(req.query.limit), offset: Number(req.query.offset), search: req.query.search, sort: req.query.sort })
        next(customers)
        }
    }

    async getCustomerReviews(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
        let customers = await customerServ.getCustomerReviews({customer_id: Number(req.query.customer_id), limit: Number(req.query.limit), page: Number(req.query.page) })
        next(customers)
        }
    }


    async addCustomerReviews(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
        let customers = await customerServ.saveCustomerReview({comment: req.body.comment, customer_id: req.body.customer_id, vendor_id: req.body.vendor_id, vendor_job_id: req.body.job_id, rating: req.body.rating})
        next(customers)
        }
    }

    async getCustomer(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
        let customer = await customerServ.getCustomer({ id: req.params.id })
        next(customer)
        }
    }


    async customerLogin(req, res, next) {
        let token = await customerServ.signIn(req.body)
        next(token)
    }

    async checkToken(req) {
        var authorizationHeader = req.headers.authorization;
        let servResp = new config.serviceResponse()
        if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
            var token = authorizationHeader.substring('Bearer '.length);
            try {
                var data = await jwt.verifyToken(token)
                servResp.isError = false
                return servResp
            } catch (error) {
                servResp.isError = true
                servResp.message = 'Authentication token is not valid'
                return servResp
            }
        }
    }

}