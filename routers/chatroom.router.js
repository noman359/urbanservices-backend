import handler from '../handlers/index.js';
import { Router } from 'express';
import VendorController from '../api/vendor.controller.js';
import formData from '../middlewares/formdata-parser.js';

const vendorCtrl = new VendorController()
const lRoute = Router();
export default function (router) {
    router.use('/conversation', lRoute)
    lRoute.get('/:id')
}