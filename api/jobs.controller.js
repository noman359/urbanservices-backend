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

    async assignJob(req, res, next) {
        let created_customer = await customerServ.assignJob(req.body)
        next(created_customer)
    }

    async acceptedJob(req, res, next) {
        let created_customer = await customerServ.acceptedJob(req.body)
        next(created_customer)
    }

    async startedJob(req, res, next) {
        let created_customer = await customerServ.startedJob(req.body)
        next(created_customer)
    }

    async completeJob(req, res, next) {
        let created_customer = await customerServ.completeJob(req.body)
        next(created_customer)
    }

    async cancelledJob(req, res, next) {
        let created_customer = await customerServ.cancelledJob(req.body)
        next(created_customer)
    }
    

    async requestEstimates(req, res, next) {
        console.log(req)
        let vendorResp = await customerServ.requestJobEstimates( { customer_id: Number(req.query.customer_id), vendor_id: Number(req.query.vendor_id), job_id: Number(req.query.job_id)})
        next(vendorResp)
    }

    async estimatesDetails(req, res, next) {
        console.log(req)
        let vendorResp = await customerServ.getEstimatesDetails( {vendor_id: Number(req.query.vendor_id), job_id: Number(req.query.job_id)})
        next(vendorResp)
    }

    async providedJobEstimates(req, res, next) {
        console.log(req)
        let vendorResp = await customerServ.providedJobEstimates( {request_id: Number(req.body.request_id), message: req.body.message, price: Number(req.body.price)})
        next(vendorResp)
    }

    async getEstimatesListForCustomer(req, res, next) {
        console.log(req)
        let vendorResp = await customerServ.getEstimatesListForCustomer( { customer_id: Number(req.query.customer_id), status: req.query.status, limit: Number(req.query.limit), offset: Number(req.query.offset)})
        next(vendorResp)
    }

    async getEstimatesListForVendor(req, res, next) {
        console.log(req)
        let vendorResp = await customerServ.getEstimatesListForVendor( {vendor_id: Number(req.query.vendor_id), status: req.query.status, limit: Number(req.query.limit), offset: Number(req.query.offset)})
        next(vendorResp)
    }


    async getVendorJobs(req, res, next) {
        console.log(req)
        let vendorResp = await customerServ.getVendorJobs( {vendor_id: Number(req.query.vendor_id), status: req.query.status})
        next(vendorResp)
    }


    async getCustomerJobs(req, res, next) {
        console.log(req)
        let vendorResp = await customerServ.getCustomerJobs({customer_id: Number(req.query.customer_id), status: req.query.status})
        next(vendorResp)
    }

    async getJobDetails(req, res, next) {
        console.log(req)
        let vendorResp = await customerServ.getJobsDetails({job_id: Number(req.query.job_id)})
        next(vendorResp)
    }

    async getJobsByStatus(req, res, next) {
        let vendor_job_details = await customerServ.getJobbyStatus({ customer_id: req.query.customer_id, vendor_id: req.query.vendor_id, status: req.query.status, limit: Number(req.query.limit), page: Number(req.query.page)})
        next(vendor_job_details)
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