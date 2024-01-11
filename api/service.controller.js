import ServicesService from "../services/services.service.js"

let servicesServ = new ServicesService()

export default class CustomerController {
    
    constructor() { }

    async getServices(req, res, next) {
        let services = await servicesServ.getServices({ limit: Number(req.query.limit ?? 10), offset: Number(req.query.offset ?? 0), filter: req.query.filter, search: req.query.search })
        next(services)
    }

    async getSubServices(req, res, next) {
        let subServices = await servicesServ.getSubServices({service_id:Number(req.params.id), limit: Number(req.query.limit ?? 10), offset: Number(req.query.offset ?? 0)})
        next(subServices)
    }

    async getPopularSubServices(req, res, next) {
        let subServices = await servicesServ.getPopularSubServices({service_id:Number(req.params.id), limit: Number(req.query.limit ?? 10), offset: Number(req.query.offset ?? 0)})
        next(subServices)
    }
}