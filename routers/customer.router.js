import handler from '../handlers/index.js';
import { Router } from 'express';
import CustomerController from '../api/customer.controller.js';
import formData from '../middlewares/formdata-parser.js';

const customerCtrl = new CustomerController()
const lRoute = Router();
export default function (router) {
    router.use('/customer', lRoute)
    lRoute.post('/token', customerCtrl.getFCMToken, handler.apiResponseHandler)
    lRoute.get('/notifications', customerCtrl.getCustomerNotications, handler.apiResponseHandler)
    lRoute.post('/', formData, customerCtrl.createCustomer, handler.apiResponseHandler)
    lRoute.post('/login', customerCtrl.customerLogin, handler.apiResponseHandler)
    lRoute.get('/reviews', customerCtrl.getCustomerReviews, handler.apiResponseHandler)
    lRoute.post('/review', customerCtrl.addCustomerReviews, handler.apiResponseHandler)
    lRoute.post('/readNotification', customerCtrl.readNotification, handler.apiResponseHandler)
    lRoute.delete('/clearNotifications', customerCtrl.clearNotifications, handler.apiResponseHandler)
    lRoute.get('/:id', customerCtrl.getCustomer, handler.apiResponseHandler)
    lRoute.delete('/:id', customerCtrl.deleteCustomer, handler.apiResponseHandler)
    lRoute.put('/:id', formData, customerCtrl.updateCustomer, handler.apiResponseHandler)
}