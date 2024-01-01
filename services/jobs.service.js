import handler from '../handlers/index.js'
import config from '../config/index.js'
import Prisma, { vendor_jobs_status } from '@prisma/client';
const { PrismaClient } = Prisma;
import admin from 'firebase-admin';
import serviceAccount from '../urbancabsvender-firebase-adminsdk-70gg2-1c61b6ef2c.json' assert { type: "json" };
import { parse, format } from 'date-fns';

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

                    let avatar_val = {
                        bucket: config.jobs_s3_bucket_name,
                        key: `${currentDateTime.toISOString()}`,
                        body: await bucket.fileToArrayBuffer(image)
                    }
                    job_image = await bucket.upload(avatar_val)
                    images.push(job_image.url)
                }
            }

            var sceduleDateTime = new Date(job.sceduled_time);

            var propertyResult = await db.job_property_details.create({
                data: {
                    type: job.type,
                    rooms: parseInt(job.rooms, 10),
                    bathrooms: parseInt(job.bathrooms, 10),
                    created_at: new Date(new Date().toUTCString())
                }
            })
            var imagesString = images.join(',')
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
                        job_property_details_id: parseInt(propertyResult.id, 10)


                    }
                })
            }
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

            var estiimate = await db.estimates.findFirst({
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

            var vendor = await db.vendor.findFirst({
                where: {
                    id: Number(estiimate.vendor_id)
                }
            })

            const registrationToken = customer.fcm_token;

            const message = {
                notification: {
                    title: 'Estimates',
                    body: `${vendor.first_name} has provided estimates.`,
                },
                data: {
                    estimate_id: job.request_id,
                    job_id: estiimate.vendor_job_id
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

            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getEstimatesListForCustomer(job) {
        let servResp = new config.serviceResponse()
        try {
            let estimates = await db.estimates.findMany({
                where: {
                    customer_id: Number(job.customer_id),
                    status: job.status
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
                            avatar: true


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
                            avatar: true
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

            servResp.data = await db.vendor_jobs.update({
                where: {
                    id: Number(job.job_id)
                },
                data: {
                    status: vendor_jobs_status.pending,
                    vendor_id: Number(job.vendor_id)
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
        const dateObject = parse(dateString, 'dd-MM-yyyy', new Date());
        const nextDay = new Date(dateObject);
        nextDay.setDate(nextDay.getDate() + 1);


        try {
            if (query.customer_id != null) {
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
                    skip: (query.page - 1) * query.limit, // Calculate the number of records to skip based on page number
                    take: query.limit, // Set the number of records to be returned per page

                });
            } else {
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

            const message = {
                notification: {
                    title: 'Job started',
                    body: `Your job has been started by ${vendor.first_name} ${vendor.last_name}`,
                },
                data: {
                    // Add extra data here
                    id: Number(job.job_id),
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
        try {
            console.debug('createCustomer() started')

            servResp.data = await db.vendor_jobs.update({
                where: {
                    id: Number(job.job_id)
                },
                data: {
                    status: vendor_jobs_status.done
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

            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
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

    async getCustomerJobs(customer) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('createCustomer() started')

            servResp.data = await db.vendor_jobs.findMany({
                where: {
                    customer_id: Number(customer.customer_id),
                    status: customer.status
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

    async getJobsDetails(customer) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('createCustomer() started')

            servResp.data = await db.vendor_jobs.findFirst({
                where: {
                    id: Number(customer.job_id)
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