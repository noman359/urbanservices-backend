import handler from '../handlers/index.js';
import JobsController from '../api/jobs.controller.js';
import formData from '../middlewares/formdata-parser.js';
import { Router } from 'express';
import  CronHandler  from '../handlers/userStatus.js';

const jobsController = new JobsController()
const cronJob = new CronHandler()
const lRoute = Router();
export default function (router) {
    router.use('/job', lRoute)
    lRoute.get('/vendor/jobs', jobsController.getVendorJobs,handler.apiResponseHandler)
    lRoute.get('/customer/jobs', jobsController.getCustomerJobs,handler.apiResponseHandler)
    lRoute.get('/detail', jobsController.getJobDetails,handler.apiResponseHandler)
    lRoute.get('/list', jobsController.getJobsByStatus,handler.apiResponseHandler)
    lRoute.get('/scheduleList', jobsController.getJobsByDateStatus,handler.apiResponseHandler)
    lRoute.post('/estimates', jobsController.requestEstimates,handler.apiResponseHandler)
    lRoute.get('/estimates/detail', jobsController.estimatesDetails,handler.apiResponseHandler)
    lRoute.put('/estimates/vendor', jobsController.providedJobEstimates,handler.apiResponseHandler)
    lRoute.post('/', formData, jobsController.createJob, handler.apiResponseHandler)
    lRoute.put('/assign', jobsController.assignJob, handler.apiResponseHandler)
    lRoute.put('/accept', jobsController.acceptedJob, handler.apiResponseHandler)
    lRoute.put('/onway', jobsController.onWayToJob, handler.apiResponseHandler)
    lRoute.put('/start', jobsController.startedJob, handler.apiResponseHandler)
    lRoute.put('/complete', jobsController.completeJob, handler.apiResponseHandler)
    lRoute.put('/cancel', jobsController.cancelledJob, handler.apiResponseHandler)
    lRoute.put('/cancelJob', jobsController.cancelledJobByCustomer, handler.apiResponseHandler)
    lRoute.put('/cancelJobByCustomer', jobsController.beforeStartingCustomerCancelJob, handler.apiResponseHandler)
    lRoute.get('/estimates/vendor/list', jobsController.getEstimatesListForVendor,handler.apiResponseHandler)
    lRoute.get('/estimates/customer/list', jobsController.getEstimatesListForCustomer,handler.apiResponseHandler)
    cronJob.createCron()
}