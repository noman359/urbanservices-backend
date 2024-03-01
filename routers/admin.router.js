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
    lRoute.post('/service/create', formData, adminController.createService, handler.apiResponseHandler)
    lRoute.post('/service/update',formData ,adminController.updateService, handler.apiResponseHandler)
    lRoute.delete('/service', adminController.deleteService, handler.apiResponseHandler)

    lRoute.post('/subService/create', formData, adminController.createSubService, handler.apiResponseHandler)
    lRoute.post('/subService/update',formData, adminController.updateSubService, handler.apiResponseHandler)
    lRoute.delete('/subService', adminController.deleteSubService, handler.apiResponseHandler)
    
    lRoute.post('/customer/update', adminController.updateCustomer, handler.apiResponseHandler)
    lRoute.post('/customer/delete', adminController.deleteCustomer, handler.apiResponseHandler)
    lRoute.put('/percentage', adminController.changePercentage, handler.apiResponseHandler)
    lRoute.get('/percentage', adminController.getPercentage, handler.apiResponseHandler)
    lRoute.post('/vendor/update', adminController.updateVendor, handler.apiResponseHandler)

    lRoute.post('/question', adminController.createQuestion, handler.apiResponseHandler)
    lRoute.get('/question', adminController.getQuestions, handler.apiResponseHandler)
    lRoute.delete('/question/:id', adminController.deleteQuestion, handler.apiResponseHandler)

    lRoute.post('/answer', adminController.saveAnswers, handler.apiResponseHandler)
    lRoute.put('/answer', adminController.updateAnswers, handler.apiResponseHandler)
    lRoute.get('/answer', adminController.getAnswers, handler.apiResponseHandler)

    lRoute.get('/jobCounts', adminController.getJobsCounts, handler.apiResponseHandler)

    lRoute.get('/earnings', adminController.getEarning, handler.apiResponseHandler)
    lRoute.post('/delete-vendor', adminController.deleteVendor, handler.apiResponseHandler)
}