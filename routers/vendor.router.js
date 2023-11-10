import handler from '../handlers/index.js';
import { Router } from 'express';
import VendorController from '../api/vendor.controller.js';
import formData from '../middlewares/formdata-parser.js';

const vendorCtrl = new VendorController()
const lRoute = Router();
export default function (router) {
    router.use('/vendor', lRoute)
    lRoute.post('/', formData, vendorCtrl.createVendor, handler.apiResponseHandler)
    lRoute.put('/:id', formData, vendorCtrl.updateVendor, handler.apiResponseHandler)
    lRoute.post('/login', vendorCtrl.loginVendor, handler.apiResponseHandler)
    lRoute.get('/:id', vendorCtrl.getVendor, handler.apiResponseHandler)
    lRoute.get('/:id/services', vendorCtrl.getVendorServices, handler.apiResponseHandler)
    lRoute.get('/:id/services/:service_id', vendorCtrl.getVendorServicesAndReviews, handler.apiResponseHandler)
    lRoute.get('/:id/jobs', vendorCtrl.getVendorJobs)
    lRoute.get('/:id/jobs/:job_id', vendorCtrl.getVendorjobDetails)
    // lRoute.delete('/:id', todoCtrl.deleteTodo, response)
}