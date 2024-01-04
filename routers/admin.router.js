import handler from '../handlers/index.js';
import { Router } from 'express';
import formData from '../middlewares/formdata-parser.js';
import AdminController from '../api/admin.controller.js';

const adminController = new AdminController()
const lRoute = Router();
export default function (router) {
    router.use('/admin', lRoute)
    lRoute.post('/login', adminController.adminLogin, handler.apiResponseHandler)
    lRoute.get('/jobs/count', adminController.getJobsCount, handler.apiResponseHandler)
    lRoute.get('/vendors', adminController.getVendorsList, handler.apiResponseHandler)
    lRoute.get('/customers', adminController.getCustomersList, handler.apiResponseHandler)
    lRoute.get('/customer/details', adminController.getCustomerDetails, handler.apiResponseHandler)
    lRoute.get('/vendor/details', adminController.getVendorDetails, handler.apiResponseHandler)
    lRoute.get('/jobs', adminController.getAllJobs, handler.apiResponseHandler)
    lRoute.post('/service/create', adminController.createService, handler.apiResponseHandler)
    lRoute.post('/service/update', adminController.updateService, handler.apiResponseHandler)
    lRoute.post('/service/delete', adminController.deleteService, handler.apiResponseHandler)

    lRoute.post('/subService/create', adminController.createSubService, handler.apiResponseHandler)
    lRoute.post('/subService/update', adminController.updateSubService, handler.apiResponseHandler)
    lRoute.post('/subService/delete', adminController.deleteSubService, handler.apiResponseHandler)
    
    lRoute.post('/customer/update', adminController.updateCustomer, handler.apiResponseHandler)
    lRoute.post('/customer/delete', adminController.deleteCustomer, handler.apiResponseHandler)

    lRoute.post('/vendor/update', adminController.updateVendor, handler.apiResponseHandler)

}