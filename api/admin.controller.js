import TokenHandler from "../handlers/token.handler.js"
import config from '../config/index.js'
import AdminService from "../services/admin.service.js"

let adminService = new AdminService()
let tokenHandler = new TokenHandler()

export default class AdminController {

    constructor() { }

    async adminLogin(req, res, next) {
        let token = await adminService.signIn(req.body)
        next(token)
    }

    async getJobsCount(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let updated_customer = await adminService.getJobsCount()
            next(updated_customer)
        }
    }

    async getVendorsList(req, res, next) {
        console.log(req)
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorResp = await adminService.getVendorsList({ limit: Number(req.query.limit), offset: Number(req.query.offset) })
            next(vendorResp)
        }
    }

    async getCustomersList(req, res, next) {
        console.log(req)
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorResp = await adminService.getCustomersList({ search: req.query.search, status: req.query.status, limit: Number(req.query.limit), offset: Number(req.query.offset) })
            next(vendorResp)
        }
    }

    async getCustomerDetails(req, res, next) {
        console.log(req)
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorResp = await adminService.getCustomersDetail({ customer_id: req.query.customer_id })
            next(vendorResp)
        }
    }

    async getVendorDetails(req, res, next) {
        console.log(req)
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorResp = await adminService.getVendorsDetail({ vendor_id: req.query.vendor_id })
            next(vendorResp)
        }
    }

    async getAllJobs(req, res, next) {
        console.log(req)
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorResp = await adminService.getAllJobs({vendor_id: req.query.vendor_id, status: req.query.status, search: req.query.search, limit: Number(req.query.limit), offset: Number(req.query.offset) })
            next(vendorResp)
        }
    }

    async createService(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let created_service = await adminService.createService(req.body)
            next(created_service)
        }
    }

    async updateService(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let created_service = await adminService.updateService(req.body)
            next(created_service)
        }
    }

    async deleteService(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let created_service = await adminService.deleteService({id: req.query.id})
            next(created_service)
        }
    }

    async createSubService(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let created_service = await adminService.createSubService(req.body)
            next(created_service)
        }
    }

    async updateSubService(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let created_service = await adminService.updateSubService(req.body)
            next(created_service)
        }
    }

    async deleteSubService(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) { 
            next(token)
        } else {
            let created_service = await adminService.deleteSubService({id: req.query.id})
            next(created_service)
        }
    }


    async updateCustomer(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let updated_customer = await adminService.changeCustomerStatus(req.body)
            next(updated_customer)
        }
    }

     async deleteCustomer(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let updated_customer = await adminService.deleteCustomer(req.body)
            next(updated_customer)
        }
    }

    async updateVendor(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let updated_customer = await adminService.changeVendorStatus(req.body)
            next(updated_customer)
        }
    }

    async changePercentage(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let updated_customer = await adminService.changePercentage(req.body)
            next(updated_customer)
        }
    }

    async getPercentage(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let updated_customer = await adminService.getPercentage(req.body)
            next(updated_customer)
        }
    }

    async createQuestion(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let updated_customer = await adminService.createQuestion(req.body)
            next(updated_customer)
        }
    }

    async getQuestions(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let updated_customer = await adminService.getAllQuestions({sub_service_id: req.query.sub_service_id})
            next(updated_customer)
        }
    }

    async deleteQuestion(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let updated_customer = await adminService.deleteQuestion(req.body)
            next(updated_customer)
        }
    }

    async saveAnswers(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let updated_customer = await adminService.saveAnswer(req.body)
            next(updated_customer)
        }
    }

    async updateAnswers(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let updated_customer = await adminService.updateAnswer(req.body)
            next(updated_customer)
        }
    }

    async getAnswers(req, res, next) {
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let updated_customer = await adminService.getAnswers(req.query)
            next(updated_customer)
        }
    }

    async getEarning(req, res, next) {
        console.log(req)
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorResp = await adminService.getEarning({vendor_id: req.query.vendor_id})
            next(vendorResp)
        }
    }

    async deleteVendor(req, res, next) {
        console.log(req)
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorResp = await adminService.deleteVendor({vendor_id: req.query.vendor_id})
            next(vendorResp)
        }
    }

    async getJobsCounts(req, res, next) {
        console.log(req)
        let token = await tokenHandler.checkToken(req)
        if (token.isError == true) {
            next(token)
        } else {
            let vendorResp = await adminService.getJobsCounts()
            next(vendorResp)
        }
    }
    
    async checkToken(req) {
        var authorizationHeader = req.headers.authorization;
        let servResp = new config.serviceResponse()
        if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
            var token = authorizationHeader.substring('Bearer '.length);
            try {
                var data = await jwt.verifyToken(token)
                servResp.isError = false
                return servResp
            } catch (error) {
                servResp.isError = true
                servResp.message = 'Authentication token is not valid'
                return servResp
            }
        }
    }

}