import handler from '../handlers/index.js'
import config from '../config/index.js'
import Prisma, { vendor_jobs_status } from '@prisma/client';
const { PrismaClient } = Prisma;
import admin from 'firebase-admin';
import serviceAccount from '../urban-service-399715-firebase-adminsdk-8cnwc-b77d07c8f8.json' assert { type: "json" };
import { parse, format } from 'date-fns';
import PaymentService from './payment.service.js';
import stripe from 'stripe';
const stripeInstance = stripe('sk_test_51OMUzdHmGYnRQyfQ80HgdP96iYWHbg5Surkh5c2uJgaXnUYeJS3OIEUj1NbS8U1jVH7YIPr8DfvjI28BjnbFCtvB00SxzStg0e');
import { v4 as uuidv4 } from 'uuid';
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // other configurations...
});
let db = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })
let bucket = new handler.bucketHandler()
let encryption = new handler.encryption()
let commons = new handler.commonsHandler()
let JWT = new handler.JWT()

export default class JobsService {

    constructor() { }

    async isTransactionCompleted(paymentMethodId) {
        try {
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

            if (paymentMethod.status === 'succeeded') {
                console.log('Transaction is completed.');
                return true;
            } else {
                console.log('Transaction is not completed. Status:', paymentMethod.status);
                return false;
            }
        } catch (error) {
            console.error('Error retrieving PaymentMethod:', error);
            throw error;
        }
    }

    async createJob(job) {
        let servResp = new config.serviceResponse()
        var images = []
        console.log(job)
        try {
            const currentDateTime = new Date();
            console.debug('createCustomer() started')
            if (job.job_image) {
                for (var image of job.job_image) {
                    let job_image = new Object()
                    var arr = image.name.split('.')
                    let extentionName = arr[arr.length - 1]

                    let avatar_val = {
                        bucket: config.jobs_s3_bucket_name,
                        key: `${uuidv4()}.${extentionName}`,
                        body: await bucket.fileToArrayBuffer(image)
                    }
                    job_image = await bucket.upload(avatar_val)
                    images.push(job_image.url)
                }
            }



            var propertyResult = await db.job_property_details.create({
                data: {
                    type: job.type,
                    rooms: parseInt(job.rooms, 10),
                    bathrooms: parseInt(job.bathrooms, 10),
                    created_at: new Date(new Date().toUTCString())
                }
            })
            var imagesString = ''
            if (images.length != 0) {
                imagesString = images.join(',')
            }
            console.log(propertyResult.id)

            if (job.job_type == "urgent") {
                servResp.data = await db.vendor_jobs.create({

                    data: {

                        status: vendor_jobs_status.pending,
                        description: job.description,
                        job_images: imagesString,
                        location: job.location,
                        created_at: new Date(new Date().toUTCString()),
                        job_type: "urgent",
                        sub_service_id: parseInt(job.sub_service_id, 10),
                        customer_id: parseInt(job.customer_id, 10),
                        vendor_id: parseInt(job.vendor_id, 10),
                        job_property_details_id: parseInt(propertyResult.id, 10),
                        lat: Number(job.lat),
                        long: Number(job.long)


                    }
                })
            } else {
                var sceduleDateTime = new Date(job.sceduled_time)
                servResp.data = await db.vendor_jobs.create({

                    data: {

                        status: vendor_jobs_status.pending,
                        description: job.description,
                        job_images: imagesString,
                        scheduled_time: sceduleDateTime,
                        location: job.location,
                        created_at: new Date(new Date().toUTCString()),
                        job_type: "scheduled",
                        sub_service_id: parseInt(job.sub_service_id, 10),
                        customer_id: parseInt(job.customer_id, 10),
                        vendor_id: parseInt(job.vendor_id, 10),
                        job_property_details_id: parseInt(propertyResult.id, 10),
                        lat: Number(job.lat),
                        long: Number(job.long)

                    }
                })
            }

            let subServices = await db.sub_services.update({
                where: {
                    id: Number(job.sub_service_id)
                },
                data: {
                    stats: { increment: 1 }
                }
            })

            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async requestJobEstimates(job) {
        let servResp = new config.serviceResponse()
        let job_image = new Object()
        try {
            servResp.data = await db.estimates.create({
                data: {
                    customer_id: job.customer_id,
                    vendor_id: job.vendor_id,
                    vendor_job_id: job.job_id,
                    status: "REQUESTED",
                    created_at: new Date(new Date().toUTCString())
                }
            })

            var customer = await db.customers.findFirst({
                where: {
                    id: Number(job.customer_id)
                }
            })

            var vendor = await db.vendor.findFirst({
                where: {
                    id: Number(job.vendor_id)
                }
            })
            const registrationToken = vendor.fcm_token;

            await db.notifications.create({
                data: {
                    description: `${customer.full_name} has requested estimates.`,
                    created_at: new Date(new Date().toUTCString()),
                    vendor_id: Number(vendor.id),
                    vendor_job_id: Number(job.job_id),
                    customer_id: Number(job.customer_id),
                    isRead: 0

                }
            })

            if (registrationToken) {
                const message = {
                    notification: {
                        title: 'Requested estimates',
                        body: `${customer.full_name} has requested estimates.`,
                    },
                    data: {
                        // Add extra data here
                        id: `${servResp.data.vendor_job_id}`,
                        // Add other key-value pairs as needed
                    },
                    token: registrationToken,
                };

                admin.messaging().send(message)
                    .then((response) => {
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.error('Error sending message:', error);
                    });
            }
            console.debug('createCustomer() returning')
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async providedJobEstimates(job) {
        let servResp = new config.serviceResponse()
        let job_image = new Object()
        try {
            if (Number(job.price) < 0) {
                servResp.isError = true
                servResp.message = 'Estimates can not be less than service fee: $39'
                return servResp
            }


            var estiimate = await db.estimates.findFirst({
                where: {
                    id: Number(job.request_id)
                }
            })

            var vendor = await db.vendor.findFirst({
                where: {
                    id: Number(estiimate.vendor_id)
                }
            })

            var notificationText = ''
            if (estiimate.status == 'PROVIDED') {
                notificationText = `${vendor.first_name} has updated the estimates.`
            } else {
                notificationText = `${vendor.first_name} has provided the estimates.`
            }

            servResp.data = await db.estimates.update({

                data: {
                    estimated_price: Number(job.price),
                    message: job.message,
                    status: "PROVIDED",
                    updated_at: new Date(new Date().toUTCString())
                },
                where: {
                    id: Number(job.request_id)
                }
            })

            const customerId = estiimate.customer_id;

            var customer = await db.customers.findFirst({
                where: {
                    id: Number(customerId)
                }
            })

            const registrationToken = customer.fcm_token;

            await db.customer_notifications.create({
                data: {
                    description: notificationText,
                    created_at: new Date(new Date().toUTCString()),
                    customer_id: Number(customer.id),
                    vendor_job_id: Number(estiimate.vendor_job_id),
                    vendor_id: Number(estiimate.vendor_id),
                    isRead: 0

                }
            })

            if (registrationToken) {

                const message = {
                    notification: {
                        title: 'Estimates',
                        body: notificationText
                    },
                    data: {
                        estimate_id: `${job.request_id}`,
                        job_id: `${estiimate.vendor_job_id}`,
                        vendor_id: `${vendor.id}`
                    },
                    token: registrationToken,
                };

                admin.messaging().send(message)
                    .then((response) => {
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.error('Error sending message:', error);
                    });
            }
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async createNotifications() {
        await db.notifications.create({
            data: {
                customer_id: Number(customer.id),
                vendor_id: Number(vendor.id),
                vendor_job_id: Number(estiimate.vendor_job_id),
                description: `${vendor.first_name} has provided estimates.`,
                created_at: new Date(new Date().toUTCString())
            }
        })
    }

    async getEstimatesListForCustomer(job) {
        let servResp = new config.serviceResponse()
        try {
            let estimates = await db.estimates.findMany({
                where: {
                    customer_id: Number(job.customer_id),
                    status: job.status
                },
                skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                take: filters.limit, // Set the number of records to be returned per page
            })
            servResp.data = {
                estimates: estimates
            }
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getEstimatesListForVendor(job) {
        let servResp = new config.serviceResponse()
        try {
            let estimates = await db.estimates.findMany({
                where: {
                    vendor_id: Number(job.vendor_id),
                    status: job.status
                },
                orderBy: {
                    created_at: 'desc',
                },
                select: {
                    id: true,
                    estimated_price: true,
                    estimated_time: true,
                    vendor_job_id: true,
                    status: true,
                    customers: {
                        select: {
                            id: true,
                            full_name: true,
                            phone_number: true,
                            avatar: true,
                            fcm_token: true


                        },
                    },
                    vendor_jobs: {
                        select: {
                            id: true,
                            description: true,
                            job_images: true,
                            location: true,
                            sub_service_id: true,
                            job_property_details_id: true,
                            scheduled_time: true,
                            job_type: true,
                            job_property_details_id: true,
                            comment: true,
                            status: true,
                            stars: true
                            // other fields you want to select from vendor_jobs
                        }
                    }

                },
                skip: (job.offset - 1) * job.limit, // Calculate the number of records to skip based on page number
                take: job.limit, // Set the number of records to be returned per page

            })
            servResp.data = {
                estimates: estimates
            }
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getEstimatesDetails(job) {
        let servResp = new config.serviceResponse()
        try {
            let estimates = await db.estimates.findFirst({
                where: {
                    vendor_id: Number(job.vendor_id),
                    vendor_job_id: Number(job.job_id)
                },
                select: {
                    id: true,
                    estimated_price: true,
                    estimated_time: true,
                    vendor_job_id: true,
                    status: true,
                    message: true,
                    customers: {
                        select: {
                            id: true,
                            full_name: true,
                            phone_number: true,
                            avatar: true,
                            fcm_token: true
                        }
                    },
                    vendor: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            avatar: true,
                            fcm_token: true,
                            service_id: true
                        }
                    }

                }

            })
            servResp.data = {
                estimates: estimates
            }
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async assignJob(job) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('createCustomer() started')
            let estimate = await db.estimates.findFirst({
                where: {
                    vendor_job_id: Number(job.job_id)
                }
            })

            if (job.charge_id) {
                var jobpaymentDetails = await db.payment_details.update({
                    where: {
                        vendor_job_id: Number(job.job_id)
                    },
                    data: {
                        charge_id: job.charge_id
                    }
                })

            }

            let percentData = await db.percentage.findMany()

            let percentValue = Number(percentData[0].percentage)/100

            let valueAfterFee = Number(estimate.estimated_price ?? 0) * (percentValue)

            servResp.data = await db.vendor_jobs.update({
                where: {
                    id: Number(job.job_id)
                },
                data: {
                    status: vendor_jobs_status.pending,
                    vendor_id: Number(job.vendor_id),
                    amount: Number(estimate.estimated_price ?? 0),
                    earning: valueAfterFee
                }

            })

            var customer = await db.customers.findFirst({
                where: {
                    id: Number(servResp.data.customer_id)
                }
            })

            var vendor = await db.vendor.findFirst({
                where: {
                    id: Number(servResp.data.vendor_id)
                }
            })
            const registrationToken = vendor.fcm_token;

            await db.notifications.create({
                data: {
                    description: `${customer.full_name} has assigned you a job.`,
                    created_at: new Date(new Date().toUTCString()),
                    vendor_id: Number(vendor.id),
                    vendor_job_id: Number(job.job_id),
                    customer_id: Number(servResp.data.customer_id),
                    isRead: 0

                }
            })

            if (registrationToken != '' || registrationToken != null || registrationToken != undefined) {

                const message = {
                    notification: {
                        title: 'Assigned Job',
                        body: `${customer.full_name} has assigned you a job.`,
                    },
                    data: {
                        // Add extra data here
                        id: `${job.job_id}`,
                        // Add other key-value pairs as needed
                    },
                    token: registrationToken,
                };

                admin.messaging().send(message)
                    .then((response) => {
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.error('Error sending message:', error);
                    });
            }
            console.debug('createCustomer() returning')
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async acceptedJob(job) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('createCustomer() started')

            servResp.data = await db.vendor_jobs.update({
                where: {
                    id: Number(job.job_id)
                },
                data: {
                    vendor_lat: Number(job.lat),
                    vendor_long: Number(job.long),
                    status: vendor_jobs_status.accepted
                }

            })

            await db.estimates.deleteMany({
                where: {
                    vendor_job_id: Number(job.job_id),
                    vendor_id: {
                        not: { equals: Number(servResp.data.vendor_id) },
                    }
                }
            })

            var customer = await db.customers.findFirst({
                where: {
                    id: Number(servResp.data.customer_id)
                }
            })

            var vendor = await db.vendor.findFirst({
                where: {
                    id: Number(servResp.data.vendor_id)
                }
            })
            const registrationToken = customer.fcm_token;

            await db.customer_notifications.create({
                data: {
                    description: `Your job has been accepted by ${vendor.first_name} ${vendor.last_name}`,
                    created_at: new Date(new Date().toUTCString()),
                    customer_id: Number(customer.id),
                    vendor_job_id: Number(job.job_id),
                    vendor_id: Number(servResp.data.vendor_id),
                    isRead: 0

                }
            })

            if (registrationToken != '' || registrationToken != null || registrationToken != undefined) {
                const message = {
                    notification: {
                        title: 'Job Accepted',
                        body: `Your job has been accepted by ${vendor.first_name} ${vendor.last_name}`,
                    },
                    data: {
                        // Add extra data here
                        id: `${job.job_id}`,
                        // Add other key-value pairs as needed
                    },
                    token: registrationToken,
                };

                admin.messaging().send(message)
                    .then((response) => {
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.error('Error sending message:', error);
                    });
            }
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getJobbyStatusAndDate(query) {
        let servResp = new config.serviceResponse()
        var jobs = [];
        const dateString = query.date



        try {
            if (query.customer_id != null) {

                if (dateString) {
                    const dateObject = parse(dateString, 'MM-dd-yyyy', new Date());
                    const nextDay = new Date(dateObject);
                    nextDay.setDate(nextDay.getDate() + 1);
                    jobs = await db.vendor_jobs.findMany({
                        where: {
                            customer_id: Number(query.customer_id),
                            status: query.status,
                            job_type: 'scheduled',
                            scheduled_time: {
                                gte: dateObject,
                                lt: nextDay,
                            },
                        },
                        select: {
                            id: true,
                            location: true,
                            job_images: true,
                            status: true,
                            created_at: true,
                            lat: true,
                            long: true,
                            vendor_lat: true,
                            vendor_long: true,
                            scheduled_time: true,
                            amount: true,
                            review: true,
                            vendor: {
                                select: {
                                    id: true,
                                    first_name: true,
                                    last_name: true,
                                    fcm_token: true
                                }
                            },

                            sub_services: {
                                select: {
                                    services: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        },
                        orderBy: {
                            created_at: 'desc'
                        },
                        skip: (query.page - 1) * query.limit, // Calculate the number of records to skip based on page number
                        take: query.limit, // Set the number of records to be returned per page

                    });
                } else {
                    jobs = await db.vendor_jobs.findMany({
                        where: {
                            customer_id: Number(query.customer_id),
                            status: query.status,
                            job_type: 'scheduled'
                        },
                        select: {
                            id: true,
                            location: true,
                            job_images: true,
                            status: true,
                            created_at: true,
                            lat: true,
                            long: true,
                            vendor_lat: true,
                            vendor_long: true,
                            scheduled_time: true,
                            amount: true,
                            review: true,
                            vendor: {
                                select: {
                                    id: true,
                                    first_name: true,
                                    last_name: true,
                                    fcm_token: true
                                }
                            },

                            sub_services: {
                                select: {
                                    services: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        },
                        orderBy: {
                            created_at: 'desc'
                        },
                        skip: (query.page - 1) * query.limit, // Calculate the number of records to skip based on page number
                        take: query.limit, // Set the number of records to be returned per page
                    })
                }
            } else {

                if (dateString) {
                    const dateObject = parse(dateString, 'MM-dd-yyyy', new Date());
                    const nextDay = new Date(dateObject);
                    nextDay.setDate(nextDay.getDate() + 1);
                    jobs = await db.vendor_jobs.findMany({
                        where: {
                            vendor_id: Number(query.vendor_id),
                            status: query.status,
                            job_type: 'scheduled',
                            scheduled_time: {
                                gte: dateObject,
                                lt: nextDay,
                            },
                        },
                        select: {
                            id: true,
                            location: true,
                            job_images: true,
                            status: true,
                            created_at: true,
                            lat: true,
                            long: true,
                            vendor_lat: true,
                            vendor_long: true,
                            scheduled_time: true,
                            amount: true,
                            review: true,
                            vendor: {
                                select: {
                                    id: true,
                                    first_name: true,
                                    last_name: true
                                }
                            },

                            sub_services: {
                                select: {
                                    services: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        },
                        orderBy: {
                            created_at: 'desc',
                        },
                        skip: (query.page - 1) * query.limit, // Calculate the number of records to skip based on page number
                        take: query.limit, // Set the number of records to be returned per page

                    });
                } else {
                    jobs = await db.vendor_jobs.findMany({
                        where: {
                            vendor_id: Number(query.vendor_id),
                            status: query.status,
                            job_type: 'scheduled',

                        },
                        select: {
                            id: true,
                            location: true,
                            job_images: true,
                            status: true,
                            created_at: true,
                            lat: true,
                            long: true,
                            vendor_lat: true,
                            vendor_long: true,
                            scheduled_time: true,
                            amount: true,
                            review: true,
                            vendor: {
                                select: {
                                    id: true,
                                    first_name: true,
                                    last_name: true
                                }
                            },

                            sub_services: {
                                select: {
                                    services: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        },
                        orderBy: {
                            created_at: 'desc',
                        },
                        skip: (query.page - 1) * query.limit, // Calculate the number of records to skip based on page number
                        take: query.limit, // Set the number of records to be returned per page
                    })
                }
            }


            servResp.data = jobs
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getJobbyStatus(query) {
        let servResp = new config.serviceResponse()
        var jobs = [];

        try {
            if (query.customer_id != null) {
                jobs = await db.vendor_jobs.findMany({
                    where: {
                        customer_id: Number(query.customer_id),
                        status: query.status
                    },
                    select: {
                        id: true,
                        location: true,
                        job_images: true,
                        status: true,
                        created_at: true,
                        lat: true,
                        long: true,
                        vendor_lat: true,
                        vendor_long: true,
                        scheduled_time: true,
                        review: true,
                        vendor: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                avatar: true,
                                fcm_token: true
                            }
                        },

                        sub_services: {
                            select: {
                                services: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }

                    },
                    orderBy: {
                        created_at: 'desc',
                    },
                    skip: (query.page - 1) * query.limit, // Calculate the number of records to skip based on page number
                    take: query.limit, // Set the number of records to be returned per page

                });
            } else {
                jobs = await db.vendor_jobs.findMany({
                    where: {
                        vendor_id: Number(query.vendor_id),
                        status: query.status
                    },
                    select: {
                        id: true,
                        location: true,
                        job_images: true,
                        status: true,
                        created_at: true,
                        lat: true,
                        long: true,
                        vendor_lat: true,
                        vendor_long: true,
                        scheduled_time: true,
                        review: true,
                        customers: {
                            select: {
                                id: true,
                                full_name: true,
                                avatar: true
                            }
                        },
                        sub_services: {
                            select: {
                                services: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }

                    },
                    orderBy: {
                        created_at: 'desc',
                    },
                    skip: (query.page - 1) * query.limit, // Calculate the number of records to skip based on page number
                    take: query.limit, // Set the number of records to be returned per page

                });
            }


            servResp.data = jobs
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async startedJob(job) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('createCustomer() started')

            servResp.data = await db.vendor_jobs.update({
                where: {
                    id: Number(job.job_id)
                },
                data: {
                    status: vendor_jobs_status.started
                }

            })

            var customer = await db.customers.findFirst({
                where: {
                    id: Number(servResp.data.customer_id)
                }
            })

            var vendor = await db.vendor.findFirst({
                where: {
                    id: Number(servResp.data.vendor_id)
                }
            })
            const registrationToken = customer.fcm_token;

            await db.customer_notifications.create({
                data: {
                    description: `Your job has been started by ${vendor.first_name} ${vendor.last_name}`,
                    created_at: new Date(new Date().toUTCString()),
                    customer_id: Number(customer.id),
                    vendor_job_id: Number(job.job_id),
                    vendor_id: Number(servResp.data.vendor_id),
                    isRead: 0

                }
            })

            if (registrationToken != '' || registrationToken != null || registrationToken != undefined) {
                const message = {
                    notification: {
                        title: 'Job started',
                        body: `Your job has been started by ${vendor.first_name} ${vendor.last_name}`,
                    },
                    data: {
                        // Add extra data here
                        id: `${job.job_id}`,
                        // Add other key-value pairs as needed
                    },
                    token: registrationToken,
                };

                admin.messaging().send(message)
                    .then((response) => {
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.error('Error sending message:', error);
                    });
            }
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async onWayJob(job) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('createCustomer() started')

            servResp.data = await db.vendor_jobs.update({
                where: {
                    id: Number(job.job_id)
                },
                data: {
                    status: vendor_jobs_status.onway
                }

            })

            var customer = await db.customers.findFirst({
                where: {
                    id: Number(servResp.data.customer_id)
                }
            })

            var vendor = await db.vendor.findFirst({
                where: {
                    id: Number(servResp.data.vendor_id)
                }
            })
            const registrationToken = customer.fcm_token;

            await db.customer_notifications.create({
                data: {
                    description: `${vendor.first_name} ${vendor.last_name} is on his way`,
                    created_at: new Date(new Date().toUTCString()),
                    customer_id: Number(customer.id),
                    vendor_job_id: Number(job.job_id),
                    vendor_id: Number(servResp.data.vendor_id),
                    isRead: 0

                }
            })

            if (registrationToken != '' || registrationToken != null || registrationToken != undefined) {

                const message = {
                    notification: {
                        title: 'On Way',
                        body: `${vendor.first_name} ${vendor.last_name} is on his way`,
                    },
                    data: {
                        // Add extra data here
                        id: `${job.job_id}`,
                        // Add other key-value pairs as needed
                    },
                    token: registrationToken,
                };

                admin.messaging().send(message)
                    .then((response) => {
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.error('Error sending message:', error);
                    });
            }
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async completeJob(job) {
        let servResp = new config.serviceResponse()
        var vendor = {};
        try {
            console.debug('createCustomer() started')

            var jobpaymentDetails = await db.payment_details.findFirst({
                where: {
                    vendor_job_id: job.job_id
                }
            })

            var intentString = `${jobpaymentDetails.payment_intent.split('_')[0]}_${jobpaymentDetails.payment_intent.split('_')[1]}`
            var paymentIntent = await stripeInstance.paymentIntents.retrieve(
                intentString
            );

            if (paymentIntent.status === 'succeeded') {

                console.log('Transaction is completed.');
            } else {
                console.log('Transaction is not completed. Status:', paymentMethod.status);
                servResp.data.isError = true
                servResp.data.message = 'Transaction is not completed. Status:', paymentMethod.status
                return servResp
            }

            var job = await db.vendor_jobs.findFirst({
                where: {
                    id: Number(jobpaymentDetails.vendor_job_id)
                }
            })

            vendor = await db.vendor.findFirst({
                where: {
                    id: Number(job.vendor_id)
                }
            })

            var vendorServiceFee = Number(paymentIntent.amount)
            var percentage = await db.percentage.findFirst({
                where: {
                    id: 1
                }
            })

            vendorServiceFee = vendorServiceFee - (vendorServiceFee * (Number(percentage.percentage) / 100))
            if (vendorServiceFee < 0) {
                servResp.data.isError = true
                servResp.data.message = 'Amount can not be negative'
                return servResp
            }
            var vendorPaymentObject = {
                'amount': vendorServiceFee,
                'vendorAccountId': vendor.stripe_account_id
            };
            // var paymentService = new PaymentService()
            // await paymentService.sendMoneyToVendor(vendorPaymentObject)

            servResp.data = await db.vendor_jobs.update({
                where: {
                    id: Number(jobpaymentDetails.vendor_job_id)
                },
                data: {
                    status: vendor_jobs_status.done
                }

            })

            await db.estimates.deleteMany({
                where: {
                    vendor_job_id: Number(jobpaymentDetails.vendor_job_id)
                }
            })

            var customer = await db.customers.findFirst({
                where: {
                    id: Number(servResp.data.customer_id)
                }
            })

            const registrationToken = customer.fcm_token;

            await db.customer_notifications.create({
                data: {
                    description: `Your job has been completed by ${vendor.first_name} ${vendor.last_name}`,
                    created_at: new Date(new Date().toUTCString()),
                    customer_id: Number(customer.id),
                    vendor_job_id: Number(job.job_id),
                    vendor_id: Number(servResp.data.vendor_id),
                    isRead: 0

                }
            })

            if (registrationToken != '' || registrationToken != null || registrationToken != undefined) {

                const message = {
                    notification: {
                        title: 'Job completed',
                        body: `Your job has been completed by ${vendor.first_name} ${vendor.last_name}`,
                    },
                    data: {
                        // Add extra data here
                        id: `${job.job_id}`,
                        // Add other key-value pairs as needed
                    },
                    token: registrationToken,
                };

                admin.messaging().send(message)
                    .then((response) => {
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.error('Error sending message:', error);
                    });
            }

            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message + `Please go to this link: ${vendor.on_board_url}`
        }
        return servResp
    }

    async cancelledJob(job) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('createCustomer() started')

            servResp.data = await db.vendor_jobs.update({
                where: {
                    id: Number(job.job_id)
                },
                data: {
                    status: vendor_jobs_status.cancelled
                }

            })

            let paymentDetails = await db.payment_details.findFirst(
                {
                    where: {
                        vendor_job_id: Number(job.job_id)
                    }
                }
            )

            let paymentService = new PaymentService()
            let paymentCheck = await paymentService.refundPayment(paymentDetails.payment_intent)

            var customer = await db.customers.findFirst({
                where: {
                    id: Number(servResp.data.customer_id)
                }
            })

            var vendor = await db.vendor.findFirst({
                where: {
                    id: Number(servResp.data.vendor_id)
                }
            })

            await db.estimates.deleteMany({
                where: {
                    vendor_job_id: Number(job.job_id)
                }
            })

            const registrationToken = customer.fcm_token;


            await db.customer_notifications.create({
                data: {
                    description: `Your job has been cancelled by ${vendor.first_name} ${vendor.last_name}`,
                    created_at: new Date(new Date().toUTCString()),
                    customer_id: Number(customer.id),
                    vendor_job_id: Number(job.job_id),
                    vendor_id: Number(servResp.data.vendor_id),
                    isRead: 0

                }
            })

            if (registrationToken != '' || registrationToken != null || registrationToken != undefined) {

                const message = {
                    notification: {
                        title: 'Job cancelled',
                        body: `Your job has been cancelled by ${vendor.first_name} ${vendor.last_name}`,
                    },
                    data: {
                        // Add extra data here
                        id: `${job.job_id}`,
                        // Add other key-value pairs as needed
                    },
                    token: registrationToken,
                };

                admin.messaging().send(message)
                    .then((response) => {
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.error('Error sending message:', error);
                    });
            }

            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async beforeStartedCustomerCancelJob(job) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('createCustomer() started')

            servResp.data = await db.vendor_jobs.update({
                where: {
                    id: Number(job.job_id)
                },
                data: {
                    status: vendor_jobs_status.cancelled
                }

            })

            let paymentDetails = await db.payment_details.findFirst(
                {
                    where: {
                        vendor_job_id: Number(job.job_id)
                    }
                }
            )

            let paymentService = new PaymentService()
            let paymentCheck = await paymentService.refundPayment(paymentDetails.payment_intent)

            var customer = await db.customers.findFirst({
                where: {
                    id: Number(servResp.data.customer_id)
                }
            })

            var vendor = await db.vendor.findFirst({
                where: {
                    id: Number(servResp.data.vendor_id)
                }
            })

            await db.estimates.deleteMany({
                where: {
                    vendor_job_id: Number(job.job_id)
                }
            })

            const registrationToken = vendor.fcm_token;


            await db.customer_notifications.create({
                data: {
                    description: `Your job has been cancelled by ${customer.full_name}`,
                    created_at: new Date(new Date().toUTCString()),
                    customer_id: Number(customer.id),
                    vendor_job_id: Number(job.job_id),
                    vendor_id: Number(servResp.data.vendor_id),
                    isRead: 0

                }
            })

            if (registrationToken != '' || registrationToken != null || registrationToken != undefined) {

                const message = {
                    notification: {
                        title: 'Job cancelled',
                        body: `Your job has been cancelled by ${customer.full_name}`,
                    },
                    data: {
                        // Add extra data here
                        id: `${job.job_id}`,
                        // Add other key-value pairs as needed
                    },
                    token: registrationToken,
                };

                admin.messaging().send(message)
                    .then((response) => {
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.error('Error sending message:', error);
                    });
            }

            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async cancelledJobByCustomer(job) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('createCustomer() started')

            servResp.data = await db.vendor_jobs.update({
                where: {
                    id: Number(job.job_id)
                },
                data: {
                    status: vendor_jobs_status.cancelled
                }

            })

            let paymentDetails = await db.payment_details.findFirst(
                {
                    where: {
                        vendor_job_id: Number(job.job_id)
                    }
                }
            )

            let paymentService = new PaymentService()
            paymentService.refundPaymentToCustomer(paymentDetails.payment_intent)

            var customer = await db.customers.findFirst({
                where: {
                    id: Number(servResp.data.customer_id)
                }
            })

            var vendor = await db.vendor.findFirst({
                where: {
                    id: Number(servResp.data.vendor_id)
                }
            })

            await db.estimates.deleteMany({
                where: {
                    vendor_job_id: Number(job.job_id)
                }
            })

            const registrationToken = vendor.fcm_token;


            await db.customer_notifications.create({
                data: {
                    description: `Your job has been cancelled by ${customer.full_name}`,
                    created_at: new Date(new Date().toUTCString()),
                    customer_id: Number(customer.id),
                    vendor_job_id: Number(job.job_id),
                    vendor_id: Number(servResp.data.vendor_id),
                    isRead: 0

                }
            })

            if (registrationToken != '' || registrationToken != null || registrationToken != undefined) {

                const message = {
                    notification: {
                        title: 'Job cancelled',
                        body: `Your job has been cancelled by ${customer.full_name}`,
                    },
                    data: {
                        // Add extra data here
                        id: `${job.job_id}`,
                        // Add other key-value pairs as needed
                    },
                    token: registrationToken,
                };

                admin.messaging().send(message)
                    .then((response) => {
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.error('Error sending message:', error);
                    });
            }

            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getVendorJobs(vendor) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('createCustomer() started')

            servResp.data = await db.vendor_jobs.findMany({
                where: {
                    vendor_id: Number(vendor.vendor_id),
                    status: vendor.status
                },
                include: {
                    vendor: true
                },
                skip: (vendor.offset - 1) * vendor.limit, // Calculate the number of records to skip based on page number
                take: vendor.limit, // Set the number of records to be returned per page
            })
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getCustomerJobs(customer) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('createCustomer() started')

            servResp.data = await db.vendor_jobs.findMany({
                where: {
                    customer_id: Number(customer.customer_id),
                    status: customer.status
                },
                include: {
                    vendor: true
                },
                skip: (customer.offset - 1) * customer.limit, // Calculate the number of records to skip based on page number
                take: customer.limit, // Set the number of records to be returned per page
            })
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getJobsDetails(customer) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('createCustomer() started')

            servResp.data = await db.vendor_jobs.findFirst({
                where: {
                    id: Number(customer.job_id)
                },
                include: {
                    customers: true,
                    sub_services: true
                }
            })
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

   

    // async updateCustomer(query, customerBody) {
    //     let servResp = new config.serviceResponse()
    //     let customer_avatar = new Object()
    //     try {
    //         console.debug('createCustomer() started')
    //         let customer = await db.customers.findFirst({ where: { id: query.id } })

    //         if (!customer) {
    //             throw new Error('Customer not found!')
    //         }

    //         if (customerBody.avatar) {
    //             if (typeof customerBody.avatar === 'string') {
    //                 customer_avatar['url'] = customerBody.avatar
    //             } else {
    //                 let avatar_val = {
    //                     bucket: config.customer_avatar_s3_bucket_name,
    //                     key: `${customerBody.email}_${customerBody.avatar['name']}`,
    //                     body: await bucket.fileToArrayBuffer(customerBody.avatar)
    //                 }
    //                 customer_avatar = await bucket.upload(avatar_val)
    //             }
    //         }

    //         // customerBody.password = encryption.encrypt(customerBody.password)
    //         await db.customers.update({
    //             data: {
    //                 full_name: customerBody.full_name || undefined,
    //                 avatar: customer_avatar.url ? customer_avatar.url : undefined,
    //                 updated_at: new Date(new Date().toUTCString()),
    //                 phone_number: customerBody.phone_number || undefined,
    //                 zipcode: customerBody.zipcode || undefined,
    //                 email: customerBody.email || undefined
    //             },
    //             where: {
    //                 id: Number(query.id)
    //             }
    //         })
    //         console.debug('createCustomer() returning')
    //         servResp.data = await db.customers.findFirst({ where: { id: Number(query.id) } })
    //     } catch (error) {
    //         console.debug('createCustomer() exception thrown')
    //         servResp.isError = true
    //         servResp.message = error.message
    //     }
    //     return servResp
    // }


    // async getCustomers(filters = { limit: 10, offset: 0, search: "", sort: "" }) {
    //     let servResp = new config.serviceResponse()
    //     try {
    //         console.debug('getCustomers() started')
    //         let order_by_clause = commons.getRawSort(filters.sort)
    //         let pagination_clause = commons.getRawPaginate(filters.limit, filters.offset)
    //         let where_clause = `WHERE (full_name LIKE '${filters.search}%' OR email LIKE '${filters.search}%' OR phone_number LIKE '${filters.search}%')`

    //         let sql = `SELECT id, full_name, phone_number, zipcode, created_at, avatar, updated_at, email
    //         FROM customers
    //         ${where_clause}
    //         ${order_by_clause}
    //         ${pagination_clause};`

    //         let count_sql = `SELECT count(id) as total_count
    //         FROM customers
    //         ${where_clause}
    //         ${order_by_clause}`;

    //         let [data, count] = await Promise.all([db.$queryRawUnsafe(sql), db.$queryRawUnsafe(count_sql)])
    //         console.log(count)
    //         servResp.data = { customers: data, count: count.length > 0 ? Number(count[0].total_count) : 0 }
    //         console.debug('getCustomers() returning')
    //     } catch (error) {
    //         console.debug('getCustomers() exception thrown')
    //         servResp.isError = true
    //         servResp.message = error.message
    //     }
    //     return servResp
    // }

    // async getCustomer(query) {
    //     let servResp = new config.serviceResponse()
    //     try {
    //         console.debug('getCustomer() started')
    //         servResp.data = await db.customers.findFirst({ where: { id: Number(query.id) } })
    //         console.debug('getCustomer() returning')
    //     } catch (error) {
    //         console.debug('getCustomer() exception thrown')
    //         servResp.isError = true
    //         servResp.message = error.message
    //     }
    //     return servResp
    // }


    // async signIn(query) {
    //     let servResp = new config.serviceResponse()
    //     try {
    //         console.debug('customer signIn() started')
    //         let encrypted_password = encryption.encrypt(query.password)
    //         let customer = await db.customers.findFirst({
    //             where: {
    //                 phone_number: query.phone_number,
    //                 password: encrypted_password,

    //             }
    //         })

    //         if (!customer) {
    //             throw new Error('User not found, Incorrect email or password')
    //         }

    //         let token = await JWT.getToken(customer)
    //         servResp.data = {
    //             ...customer, token: token
    //         }
    //         console.debug('customer signIn() ended')
    //     } catch (error) {
    //         console.debug('customer signIn() exception thrown')
    //         servResp.isError = true
    //         servResp.message = error.message
    //     }
    //     return servResp
    // }


}