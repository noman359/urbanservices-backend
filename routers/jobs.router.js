import handler from '../handlers/index.js';
import JobsController from '../api/jobs.controller.js';
import formData from '../middlewares/formdata-parser.js';
import { Router } from 'express';

const jobsController = new JobsController()
const lRoute = Router();
export default function (router) {
    router.use('/job', lRoute)
    lRoute.post('/estimates', jobsController.requestEstimates,handler.apiResponseHandler)
    lRoute.put('/estimates/vendor', jobsController.providedJobEstimates,handler.apiResponseHandler)
    lRoute.post('/', formData, jobsController.createJob, handler.apiResponseHandler)
    lRoute.get('/estimates/vendor/list', jobsController.getEstimatesListForVendor,handler.apiResponseHandler)
    lRoute.get('/estimates/customer/list', jobsController.getEstimatesListForCustomer,handler.apiResponseHandler)
}