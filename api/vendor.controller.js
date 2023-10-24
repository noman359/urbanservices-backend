import vendorService from "../services/vendor.service.js"


// let this.#vendorServ = new vendorService()

export default class VendorController {
    #vendorServ = new vendorService()
    constructor() { }

    async createVendor(req, res, next) {
        let created_vendor = await this.#vendorServ.createVendor(req.body)
        next(created_vendor)
    }

    async updateVendor(req, res, next) {
        let update_resp = await this.#vendorServ.updateVendor({ id: req.params.id }, req.body)
        next(update_resp)
    }

    async loginVendor(req, res, next) {
        let loginResp = await this.#vendorServ.signIn(req.body)
        next(loginResp)
    }

    async getVendor(req, res, next) {
        console.log(req)
        let vendorResp = await this.#vendorServ.getVendorData({ id: req.params.id })
        next(vendorResp)
    }

    async getVendorServices(req, res, next) {
        console.log(req)
        let vendorServReviews = await this.#vendorServ.getVendorServices({ id: Number(req.params.id) }, { limit: Number(req.query.limit), offset: Number(req.query.offset) })
        next(vendorServReviews)
    }

    async getVendorServicesAndReviews(req, res, next) {
        console.log(req)
        let vendorServReviews = await this.#vendorServ.getVendorServices({ id: Number(req.params.id), service_id: Number(req.params.service_id) }, { limit: Number(req.query.limit ?? 10), offset: Number(req.query.offset ?? 0) })
        next(vendorServReviews)
    }

}