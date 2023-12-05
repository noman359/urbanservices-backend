import handler from '../handlers/index.js';
import JobsController from '../api/jobs.controller.js';
import formData from '../middlewares/formdata-parser.js';
import { Router } from 'express';

const jobsController = new JobsController()
const lRoute = Router();
export default function (router) {
    router.use('/job', lRoute)
    lRoute.post('/', formData, jobsController.createJob, handler.apiResponseHandler)
}