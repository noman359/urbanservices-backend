import CustomerService from "../services/customer.service.js"

// let this.#customerServ = new CustomerService()

export default class CustomerController {
    #customerServ = new CustomerService()
    constructor() { }

    async createCustomer(req, res, next) {
        let created_customer = await this.#customerServ.createCustomer(req.body)
        next(created_customer)
    }

    async updateCustomer(req, res, next) {
        let updated_customer = await this.#customerServ.updateCustomer({ id: Number(req.params.id) }, req.body)
        next(updated_customer)
    }
    
}