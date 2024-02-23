import handler from '../handlers/index.js'
import config from '../config/index.js'
import Prisma, { vendor_jobs_status } from '@prisma/client';
const { PrismaClient } = Prisma;
import { v4 as uuidv4 } from 'uuid';

let bucket = new handler.bucketHandler()
let JWT = new handler.JWT()
let db = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })

export default class AdminService {

    constructor() { }

    async signIn(query) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('admin signIn() started')
            let admin = await db.admin.findFirst({
                where: {
                    email: query.email,
                    password: query.password
                }
            })

            if (!admin) {
                throw new Error('User not found, Incorrect email or password')
            }

            let token = await JWT.getToken(admin)
            servResp.data = {
                ...admin, token: token
            }
            console.debug('admin signIn() ended')
        } catch (error) {
            console.debug('admin signIn() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }


    async getJobsCount() {
        let servResp = new config.serviceResponse()
        try {
            console.debug('jobs count')
            let totalJobs = await db.vendor_jobs.count()


            let processedJobs = await db.vendor_jobs.count({
                where: {
                    status: {
                        in: [
                            vendor_jobs_status.pending,
                            vendor_jobs_status.accepted,
                            vendor_jobs_status.started,
                        ],
                    }
                }
            }
            )

            let completedJobs = await db.vendor_jobs.count({
                where: {
                    status: vendor_jobs_status.done,
                }
            })

            servResp.data = {
                total: totalJobs,
                processed: processedJobs,
                completed: completedJobs
            }
            console.debug('admin signIn() ended')
        } catch (error) {
            console.debug('admin signIn() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getVendorsList(filters) {
        var servResp = new config.serviceResponse()
        try {
            console.debug('getVendorList() started')
            var paginatedData = {};
            var count = 0
            if (filters.status != null) {

                if (filters.search != null) {
                    [paginatedData, count] = await db.$transaction([db.vendor.findMany({
                        where: {
                            status: filters.status,
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }), db.vendor.count({
                        where: {
                            status: filters.status,
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                    })]);
                } else {
                    [paginatedData, count] = await db.$transaction([db.vendor.findMany({
                        where: {
                            status: filters.status
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }), db.vendor.count({
                        where: {
                            status: filters.status
                        },
                    })]);
                }

            } else {

                if (filters.search != null) {

                    [paginatedData, count] = await db.$transaction([db.vendor.findMany({
                        where: {
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }), db.vendor.count({
                        where: {
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                    })]);

                } else {
                    [paginatedData, count] = await db.$transaction([db.vendor.findMany({
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }), db.vendor.count()]);
                }
            }

            servResp.count = count
            servResp.data = paginatedData
            console.debug('getVendorData() ended', servResp.totalRecords)
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getCustomersList(filters) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getCustomerList() started')
            var paginatedData = {}
            var count = 0
            if (filters.status != null) {

                if (filters.search != null) {
                    [paginatedData, count] = await db.$transaction([db.customers.findMany({
                        where: {
                            status: filters.status,
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }), db.customers.count({
                        where: {
                            status: filters.status,
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                    })]);

                } else {
                    [paginatedData, count] = await db.$transaction([db.customers.findMany({
                        where: {
                            status: filters.status
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }), db.customers.count({
                        where: {
                            status: filters.status
                        },
                    })]);
                }

            } else {

                if (filters.search != null) {

                    [paginatedData, count] = await db.$transaction([db.customers.findMany({
                        where: {
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }), db.customers.count({
                        where: {
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                    })]);

                } else {
                    [paginatedData, count] = await db.$transaction([db.customers.findMany({
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }), db.customers.count()]);
                }
            }
            servResp.count = count
            paginatedData.count = count
            servResp.data = paginatedData
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getCustomersDetail(filters) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getCustomerList() started')
            var paginatedData = {}

            paginatedData = await db.customers.findFirst({
                where: {
                    id: Number(filters.customer_id)

                }
            });

            let totalJobs = await db.vendor_jobs.count({
                where: {
                    customer_id: Number(filters.customer_id)
                }
            })

            let processed = await db.vendor_jobs.count({
                where: {
                    customer_id: Number(filters.customer_id),
                    status: {
                        in: [
                            vendor_jobs_status.pending,
                            vendor_jobs_status.accepted,
                            vendor_jobs_status.started,
                        ],
                    }
                }
            })

            let completed = await db.vendor_jobs.count({
                where: {
                    customer_id: Number(filters.customer_id),
                    status: vendor_jobs_status.done
                }
            })

            let jobs = {
                total: totalJobs,
                processed: processed,
                completed: completed
            }

            paginatedData['jobs'] = jobs

            servResp.data = paginatedData
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getVendorsDetail(filters) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getCustomerList() started')
            var paginatedData = {}

            paginatedData = await db.vendor.findFirst({
                where: {
                    id: Number(filters.vendor_id)
                }
            });

            let pending = await db.vendor_jobs.count({
                where: {
                    vendor_id: Number(filters.vendor_id),
                    status: vendor_jobs_status.pending
                }
            })

            let processed = await db.vendor_jobs.count({
                where: {
                    vendor_id: Number(filters.vendor_id),
                    status: {
                        in: [
                            vendor_jobs_status.accepted,
                            vendor_jobs_status.started,
                        ],
                    }
                }
            })

            let completed = await db.vendor_jobs.count({
                where: {
                    vendor_id: Number(filters.vendor_id),
                    status: vendor_jobs_status.done
                }
            })

            let jobs = {
                pending: pending,
                progress: processed,
                completed: completed
            }

            paginatedData['jobs'] = jobs

            servResp.data = paginatedData
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async getAllJobs(filters) {
        let servResp = new config.serviceResponse()
        try {
            console.debug('getCustomerList() started')
            var paginatedData = {}
            var count = 0
            if (filters.status != null) {

                if (filters.search != null) {
                    [paginatedData, count] = await db.$transaction([db.vendor_jobs.findMany({
                        where: {
                            status: filters.status,
                            description: {
                                startsWith: filters.search,
                            },


                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }), db.vendor_jobs.count({
                        where: {
                            status: filters.status,
                            description: {
                                startsWith: filters.search,
                            },


                        },
                    })]);

                } else {
                    [paginatedData, count] = await db.$transaction([db.vendor_jobs.findMany({
                        where: {
                            status: filters.status
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }), db.vendor_jobs.count({
                        where: {
                            status: filters.status
                        },
                    })]);
                }

            } else {

                if (filters.search != null) {

                    [paginatedData, count] = await db.$transaction([db.vendor_jobs.findMany({
                        where: {
                            description: {
                                startsWith: filters.search,
                            },

                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }), db.vendor_jobs.count({
                        where: {
                            description: {
                                startsWith: filters.search,
                            },

                        },
                    })]);

                } else {
                    [paginatedData, count] = await db.$transaction([db.vendor_jobs.findMany({
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }), db.vendor_jobs.count()]);
                }
            }
            servResp.count = count
            paginatedData.count = count
            servResp.data = paginatedData
            console.debug('getVendorData() ended')
        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp
    }

    async createService(serviceBody) {
        let servResp = new config.serviceResponse()
        let service_avatar = new Object()
        try {
            if (serviceBody.image) {
                var arr = serviceBody.image.name.split('.')
                let extentionName = arr[arr.length - 1]
                let avatar_val = {
                    bucket: config.vendor_avatar_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(serviceBody.image)
                }
                service_avatar = await bucket.upload(avatar_val)
            }

            servResp.data = await db.services.create({
                data: {
                    name: serviceBody.name,
                    avatar: service_avatar.url ?? '',
                    created_at: new Date(new Date().toUTCString()),
                    stats: 0
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

    async updateService(serviceBody) {
        let servResp = new config.serviceResponse()
        let service_avatar = new Object()
        try {
            if (serviceBody.image) {
                var arr = serviceBody.image.name.split('.')
                let extentionName = arr[arr.length - 1]
                let avatar_val = {
                    bucket: config.vendor_avatar_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(serviceBody.image)
                }
                service_avatar = await bucket.upload(avatar_val)
            }

            let oldService = await db.services.findFirst({
                where: {
                    id: Number(serviceBody.id)
                }
            })

            var url = ''
            if (service_avatar.url) {
                url = service_avatar.url
            } else {
                url = oldService.avatar
            }

            servResp.data = await db.services.update({
                where: {
                    id: Number(serviceBody.id)
                },
                data: {
                    avatar: url ?? '',
                    name: serviceBody.name ? serviceBody.name : oldService.ser,
                    updated_at: new Date(new Date().toUTCString())
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

    async deleteService(serviceBody) {
        let servResp = new config.serviceResponse()
        try {
            servResp.data = await db.services.delete({
                where: {
                    id: Number(serviceBody.id)
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

    async createSubService(serviceBody) {
        let servResp = new config.serviceResponse()
        let service_avatar = new Object()
        try {
            if (serviceBody.image) {
                var arr = serviceBody.image.name.split('.')
                let extentionName = arr[arr.length - 1]
                let avatar_val = {
                    bucket: config.vendor_avatar_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(serviceBody.image)
                }
                service_avatar = await bucket.upload(avatar_val)
            }

            servResp.data = await db.sub_services.create({
                data: {
                    avatar: service_avatar.url ?? '',
                    name: serviceBody.name,
                    created_at: new Date(new Date().toUTCString()),
                    services_id: Number(serviceBody.service_id),
                    stats: 0
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

    async updateSubService(serviceBody) {
        let servResp = new config.serviceResponse()
        let service_avatar = new Object()
        try {
            if (serviceBody.image) {
                var arr = serviceBody.image.name.split('.')
                let extentionName = arr[arr.length - 1]
                let avatar_val = {
                    bucket: config.vendor_avatar_s3_bucket_name,
                    key: `${uuidv4()}.${extentionName}`,
                    body: await bucket.fileToArrayBuffer(serviceBody.image)
                }
                service_avatar = await bucket.upload(avatar_val)
            }

            let oldService = await db.services.findFirst({
                where: {
                    id: Number(serviceBody.id)
                }
            })

            var image = ''
            image = oldService.avatar ? oldService.avatar : ''
            if (service_avatar) {
                image = service_avatar.url
            }

            servResp.data = await db.sub_services.update({
                where: {
                    id: serviceBody.id
                },
                data: {
                    avatar: image,
                    name: serviceBody.name ? serviceBody.name : oldService.name,
                    updated_at: new Date(new Date().toUTCString())
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

    async deleteSubService(serviceBody) {
        let servResp = new config.serviceResponse()
        try {
            servResp.data = await db.sub_services.delete({
                where: {
                    id: serviceBody.id
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

    async changeCustomerStatus(customer) {
        let servResp = new config.serviceResponse()
        try {
            servResp.data = await db.customers.update({
                where: {
                    id: customer.id
                },
                data: {
                    // services_id: Number(serviceBody.service_id),
                    status: customer.status,
                    updated_at: new Date(new Date().toUTCString())
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

    async deleteCustomer(customer) {
        let servResp = new config.serviceResponse()
        try {
            servResp.data = await db.customers.delete({
                where: {
                    id: customer.id
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

    async changeVendorStatus(vendor) {
        let servResp = new config.serviceResponse()
        try {
            servResp.data = await db.vendor.update({
                where: {
                    id: vendor.id
                },
                data: {
                    account_status: vendor.status,
                    updated_at: new Date(new Date().toUTCString())
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

    async changePercentage(percent) {
        let servResp = new config.serviceResponse()
        try {
            servResp.data = await db.percentage.update({
                where: {
                    id: 1
                },
                data: {
                    percentage: Number(percent.percentage),
                    updated_at: new Date(new Date().toUTCString())
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

    async getPercentage(percent) {
        let servResp = new config.serviceResponse()
        try {
            servResp.data = await db.percentage.findFirst({
                where: {
                    id: 1
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


    async createQuestion(query) {
        let servResp = new config.serviceResponse()
        try {

            servResp.data = await db.questions.create({
                data: {
                    question: query.question,
                    created_at: new Date(new Date().toUTCString())
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

    async getAllQuestions() {
        let servResp = new config.serviceResponse()
        try {

            servResp.data = await db.questions.findMany()
            console.debug('createCustomer() returning')

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp

    }

    async deleteQuestion(question) {
        let servResp = new config.serviceResponse()
        try {
            servResp.data = await db.questions.delete({
                where: {
                    id: Number(question.id)
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

    async saveAnswer(query) {
        let servResp = new config.serviceResponse()
        try {

            console.log(query.answers)
            if (query.answers.length > 0) {
                await db.answers.deleteMany({
                    where: {
                        vendor_job_id: Number(query.answers[0].job_id),
                    }
                })
            }

            for (var item of query.answers) {
                await db.answers.create({
                    data: {
                        question_id: Number(item.question_id),
                        vendor_job_id: Number(item.job_id),
                        answer: item.answer,
                        created_at: new Date(new Date().toUTCString())
                    }
                })
            }

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
            console.log(error)
        }
        return servResp

    }

    async updateAnswer(query) {
        let servResp = new config.serviceResponse()
        try {

            for (var item of query.answers) {
                await db.answers.update({
                    where: {
                        id: Number(item.id)
                    },
                    data: {
                        answer: item.answer,
                        updated_at: new Date(new Date().toUTCString())
                    }
                })
            }

        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp

    }

    async getAnswers(query) {
        let servResp = new config.serviceResponse()
        try {

            servResp.data = await db.answers.findMany({
                where: {
                    vendor_job_id: Number(query.job_id)
                },
                include: {
                    questions: true
                }
            })


        } catch (error) {
            console.debug('createVendor() exception thrown')
            servResp.isError = true
            servResp.message = error.message
        }
        return servResp

    }
}
