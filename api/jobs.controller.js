import JobsService from "../services/jobs.service.js"
import CustomerService from "../services/jobs.service.js"
import { Router } from 'express';

let customerServ = new JobsService()

export default class JobsController {

    constructor() { }

    async createJob(req, res, next) {
        let created_customer = await customerServ.createJob(req.body)
        next(created_customer)
    }

    // async updateCustomer(req, res, next) {
    //     let updated_customer = await customerServ.updateCustomer({ id: Number(req.params.id) }, req.body)
    //     next(updated_customer)
    // }

    // async getCustomers(req, res, next) {
    //     let customers = await customerServ.getCustomers({ limit: Number(req.query.limit), offset: Number(req.query.offset), search: req.query.search, sort: req.query.sort })
    //     next(customers)
    // }

    // async getCustomer(req, res, next) {
    //     let customer = await customerServ.getCustomer({ id: req.params.id })
    //     next(customer)
    // }


    // async customerLogin(req, res, next) {
    //     let token = await customerServ.signIn(req.body)
    //     next(token)
    // }

}