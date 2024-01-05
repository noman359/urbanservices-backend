import cron from 'node-cron'
import handler from '../handlers/index.js'
import config from '../config/index.js'
import Prisma, { vendor_jobs_status } from '@prisma/client';
const { PrismaClient } = Prisma;
let db = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })
import admin from 'firebase-admin';

export default class CronHandler {
    constructor() {

    }

    async sendNotifications() {

        let servResp = new config.serviceResponse()
        let date = new Date()
        let twoHours = new Date()
        twoHours.setHours(date.getHours() + 2);
        try {
            let jobs = await db.vendor_jobs.findMany({
                where: {
                    scheduled_time: {
                        gt: date,
                        lte: twoHours
                    }
                }
            })

            for (const job of jobs) {
                console.log(`A JavaScript type is: ${job}`)
                let customer = await db.customers.findFirst({
                    where: {
                        id: job.customer_id
                    }
                })

                let vendor = await db.vendor.findFirst({
                    where: {
                        id: job.vendor_id
                    }
                })

                let timeDifferenceInMillis = job.scheduled_time.getTime() - date.getTime()
                const hours = Math.floor(timeDifferenceInMillis / (1000 * 60 * 60));
                const minutes = Math.floor((timeDifferenceInMillis % (1000 * 60 * 60)) / (1000 * 60));

                let push = new CronHandler()
                let customerDetail = {
                    fcmToken: customer.fcm_token,
                    job_id: job.id,
                    hours: `${hours}`,
                    minutes: `${minutes}`
                }

                let vendorDetail = {
                    fcmToken: vendor.fcm_token,
                    job_id: job.id,
                    hours: hours,
                    minutes: minutes
                }
                push.sendPush(customerDetail)
                push.sendPush(vendorDetail)

            }

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async sendPush(detail) {
        const message = {
            notification: {
                title: 'Upcoming job',
                body: `Your job is starting in ${detail.hours} hrs and ${detail.minutes} mins `,
            },
            data: {
                // Add extra data here
                id: `${detail.job_id}`,
                // Add other key-value pairs as needed
            },
            token: detail.fcmToken,
        };

        admin.messaging().send(message)
            .then((response) => {
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                console.error('Error sending message:', error);
            });

    }

    async createCron() {
        let jobsCron = cron.schedule(
            "0 */2 * * *",
            () => {
                let handler = new CronHandler()
                handler.sendNotifications()
            },
            {
                scheduled: false,
            }
        );
        jobsCron.start()
    }
}