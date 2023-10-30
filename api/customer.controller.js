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
    
}