import handler from '../handlers/index.js';
import { Router } from 'express';
import ServiceController from '../api/service.controller.js';
import filtersParser from '../middlewares/filters-parser.js';

const serviceCtrl = new ServiceController()
const lRoute = Router();
export default function (router) {
    router.use('/services', lRoute)
    lRoute.get('/', filtersParser, serviceCtrl.getServices, handler.apiResponseHandler)
    // lRoute.put('/:id', formData, serviceCtrl.updateCustomer, handler.apiResponseHandler)
}