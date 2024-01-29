import handler from '../handlers/index.js'
import config from '../config/index.js'
import stripe from 'stripe';
const stripeInstance = stripe('sk_test_51OMUzdHmGYnRQyfQ80HgdP96iYWHbg5Surkh5c2uJgaXnUYeJS3OIEUj1NbS8U1jVH7YIPr8DfvjI28BjnbFCtvB00SxzStg0e');
import Prisma from '@prisma/client';
const { PrismaClient } = Prisma;

let db = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })

/**
 * @action createPaymentIntent
 * @description method for get paymnet details method
 *
 * @params (req, res, next)
 *
 * @return {}
 */
export default class PaymentService {

  constructor() { }


  async createPaymentIntents(payment) {
    // const { items } = req.body;
    let servResp = new config.serviceResponse()
    try {
      // Create a PaymentIntent
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Number(payment.price*100),
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        }
      });
      let payment_details = await db.payment_details.create({
        data: {
          payment_intent: paymentIntent.client_secret,
          vendor_job_id: payment.job_id
        }
      })
      servResp.data.client_secret = paymentIntent.client_secret
    } catch (error) {
      console.debug('payment() exception thrown')
      servResp.isError = true
      servResp.message = error.message
    }
    return servResp
  };

  async sendMoneyToVendor(payment) {
    try {

      var transfer = await stripeInstance.transfers.create({
        amount: payment.amount*100,
        currency: 'usd',
        destination: payment.vendorAccountId,
      });
  
      console.log('Transfer successful:', transfer);
      return transfer;
    } catch (error) {
      console.error('Error sending money:', error);
      error.message = 'You payment receiving account is not active'
      throw error;
    }
  }

  async checkConnectAccountStatus(vendor) {
    try {
      // Retrieve account information using the Stripe API
      const account = await stripeInstance.accounts.retrieve(vendor.stripe_account_id);
  
      // Check the account status
      const accountStatus = account.details_submitted ? 'active' : 'inactive';
      console.log(`Connect Account Status: ${accountStatus}`);
      return accountStatus
      // You may also want to check other properties of the account object for more details
  
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  
}

