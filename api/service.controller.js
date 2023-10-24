import ServicesService from "../services/services.service.js"

// let servicesServ = new ServicesService()

export default class CustomerController {
    #serviceServ = new ServicesService()
    constructor() { }

    async getServices(req, res, next) {
        let services = await this.#serviceServ.getServices({ limit: Number(req.query.limit ?? 10), offset: Number(req.query.offset ?? 0), filter: req.query.filter, search: req.query.search })
        next(services)
    }


}