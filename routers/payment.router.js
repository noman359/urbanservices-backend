import handler from '../handlers/index.js';
import { Router } from 'express';
import PaymentController from '../api/payment.controller.js';

const paymentController = new PaymentController()
const lRoute = Router();
export default function (router) {
    router.use('/payment', lRoute)
    lRoute.post('/createPaymentIntent', paymentController.createPaymentIntent, handler.apiResponseHandler)
   
}