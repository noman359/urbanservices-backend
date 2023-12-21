import vendorService from "../services/vendor.service.js"


let vendorServ = new vendorService()

export default class VendorController {

    constructor() { }

    async createVendor(req, res, next) {
        let created_vendor = await vendorServ.createVendor(req.body)
        next(created_vendor)
    }

    async getFCMToken(req, res, next) {
        let created_vendor = await vendorServ.saveVendorFCMToken(req.body)
        next(created_vendor)
    }

    async updateVendor(req, res, next) {
        let update_resp = await vendorServ.updateVendor({ id: req.params.id }, req.body)
        next(update_resp)
    }

    async loginVendor(req, res, next) {
        let loginResp = await vendorServ.signIn(req.body)
        next(loginResp)
    }

    async getVendor(req, res, next) {
        console.log(req)
        let vendorResp = await vendorServ.getVendorData({ id: req.params.id })
        next(vendorResp)
    }

    async getVendorsList(req, res, next) {
        console.log(req)
        let vendorResp = await vendorServ.getVendorsList( {service_id:  Number(req.query.service_id), limit: Number(req.query.limit), offset: Number(req.query.offset) })
        next(vendorResp)
    }

    async getVendorServices(req, res, next) {
        console.log(req)
        let vendorServReviews = await vendorServ.getVendorServices({ id: Number(req.params.id) }, { limit: Number(req.query.limit), offset: Number(req.query.offset) })
        next(vendorServReviews)
    }

    async getVendorServicesAndReviews(req, res, next) {
        console.log(req)
        let vendorServReviews = await vendorServ.getVendorServices({ id: Number(req.params.id), service_id: Number(req.params.service_id) }, { limit: Number(req.query.limit ?? 10), offset: Number(req.query.offset ?? 0) })
        next(vendorServReviews)
    }

    async getVendorJobs(req, res, next) {
        let vendorJobs = await vendorServ.getVendorJobs({ id: req.params.id }, req.query)
        next(vendorJobs)
    }

    async getVendorjobDetails(req, res, next) {
        let vendor_job_details = await vendorServ.getVendorJobDetails({ id: req.params.id, job_id: req.params.job_id }, { filter: req.query.filter, limit: Number(req.query.limit), offset: Number(req.query.offset) })
        next(vendor_job_details)
    }

}