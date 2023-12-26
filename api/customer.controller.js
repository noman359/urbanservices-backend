import CustomerService from "../services/customer.service.js"

let customerServ = new CustomerService()

export default class CustomerController {

    constructor() { }

    async createCustomer(req, res, next) {
        let created_customer = await customerServ.createCustomer(req.body)
        next(created_customer)
    }

    async updateCustomer(req, res, next) {
        let updated_customer = await customerServ.updateCustomer({ id: Number(req.params.id) }, req.body)
        next(updated_customer)
    }

    async getFCMToken(req, res, next) {
        let created_customer_token = await customerServ.saveCustomerFCMToken(req.body)
        next(created_customer_token)
    }


    async getCustomers(req, res, next) {
        let customers = await customerServ.getCustomers({ limit: Number(req.query.limit), offset: Number(req.query.offset), search: req.query.search, sort: req.query.sort })
        next(customers)
    }

    async getCustomerReviews(req, res, next) {
        let customers = await customerServ.getCustomerReviews({customer_id: Number(req.query.customer_id), limit: Number(req.query.limit), page: Number(req.query.page) })
        next(customers)
    }


    async addCustomerReviews(req, res, next) {
        let customers = await customerServ.saveCustomerReview({comment: req.body.comment, vendor_id: req.body.vendor_id, vendor_job_id: req.body.job_id, rating: req.body.rating})
        next(customers)
    }

    async getCustomer(req, res, next) {
        let customer = await customerServ.getCustomer({ id: req.params.id })
        next(customer)
    }


    async customerLogin(req, res, next) {
        let token = await customerServ.signIn(req.body)
        next(token)
    }

}