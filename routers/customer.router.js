import handler from '../handlers/index.js';
import { Router } from 'express';
import CustomerController from '../api/customer.controller.js';
import formData from '../middlewares/formdata-parser.js';

const customerCtrl = new CustomerController()
const lRoute = Router();
export default function (router) {
    router.use('/customer', lRoute)
    lRoute.post('/', formData, customerCtrl.createCustomer, handler.apiResponseHandler)
    lRoute.get('/', customerCtrl.getCustomers, handler.apiResponseHandler)
    lRoute.get('/:id', customerCtrl.getCustomer, handler.apiResponseHandler)
    lRoute.put('/:id', formData, customerCtrl.updateCustomer, handler.apiResponseHandler)
}