import JWTHandler from "../handlers/jwt.handler.js"
import vendorService from "../services/vendor.service.js"
import config from '../config/index.js'
import TokenHandler from "../handlers/token.handler.js"


let vendorServ = new vendorService()
let tokenHandler = new TokenHandler()

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
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
            return token
        } else {
            let update_resp = await vendorServ.updateVendor({ id: req.params.id }, req.body)
            next(update_resp)
        }
    }

    async saveVendorReview(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let update_resp = await vendorServ.saveVendorReview({ comment: req.body.comment, rating: req.body.rating, job_id: req.body.job_id, vendor_id: req.body.vendor_id, customer_id: req.body.customer_id })
            next(update_resp)
        }
    }

    async loginVendor(req, res, next) {
        let loginResp = await vendorServ.signIn(req.body)
        next(loginResp)
    }

    async getVendor(req, res, next) {
        console.log(req)
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorResp = await vendorServ.getVendorData({ id: req.params.id })
            next(vendorResp)
        }
    }

    async getVendorNotications(req, res, next) {
        console.log(req)
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorResp = await vendorServ.getNotifications({ vendor_id: req.query.vendor_id, limit: Number(req.query.limit), page: Number(req.query.page) })
            next(vendorResp)
        }
    }

    async getVendorsList(req, res, next) {
        console.log(req)
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorResp = await vendorServ.getVendorsList({ service_id: Number(req.query.service_id), limit: Number(req.query.limit), offset: Number(req.query.offset) })
            next(vendorResp)
        }
    }

    async getVendorServices(req, res, next) {
        console.log(req)
        let vendorServReviews = await vendorServ.getVendorServices({ id: Number(req.params.id) }, { limit: Number(req.query.limit), offset: Number(req.query.offset) })
        next(vendorServReviews)
    }

    async getVendorServicesAndReviews(req, res, next) {
        console.log(req)
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorServReviews = await vendorServ.getVendorServices({ id: Number(req.params.id), service_id: Number(req.params.service_id) }, { limit: Number(req.query.limit ?? 10), offset: Number(req.query.offset ?? 0) })
            next(vendorServReviews)
        }
    }

    async getVendorJobs(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        
        if (token.isError == true) {
            next(token)
        } else {
            let vendorJobs = await vendorServ.getVendorJobs({ id: req.params.id }, req.query)
            next(vendorJobs)
        }
    }

    async getVendorjobDetails(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendor_job_details = await vendorServ.getVendorJobDetails({ id: req.params.id, job_id: req.params.job_id }, { filter: req.query.filter, limit: Number(req.query.limit), offset: Number(req.query.offset) })
            next(vendor_job_details)
        }
    }

    async getVendorReviews(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendor_job_details = await vendorServ.getVendorReview({ vendor_id: req.body.id, limit: req.body.limit, page: req.body.page })
            next(vendor_job_details)
        }
    }

    async getVendorCoordinates(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorCoordinates = await vendorServ.saveVendorCoordinates({ vendor_id: req.body.vendor_id, lat: req.body.lat, long: req.body.long })
            next(vendorCoordinates)
        }
    }
}