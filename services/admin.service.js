import handler from '../handlers/index.js'
import config from '../config/index.js'
import Prisma, { vendor_jobs_status } from '@prisma/client';
const { PrismaClient } = Prisma;

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
                 [paginatedData, count] =  await db.$transaction( [db.vendor.findMany({
                        where: {
                            status: filters.status,
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }),db.vendor.count({
                        where: {
                            status: filters.status,
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                    })]);
                } else {
                    [paginatedData, count] =  await db.$transaction( [db.vendor.findMany({
                        where: {
                            status: filters.status
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }),db.vendor.count({
                        where: {
                            status: filters.status
                        },
                    })]);
                }

            } else {

                if (filters.search != null) {

                    [paginatedData, count] =  await db.$transaction( [db.vendor.findMany({
                        where: {
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }),db.vendor.count({
                        where: {
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                    })]);

                } else {
                    [paginatedData, count] =  await db.$transaction( [db.vendor.findMany({
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }),db.vendor.count()]);
                }
            }

            servResp.count = count
            servResp.data = paginatedData
            console.debug('getVendorData() ended',servResp.totalRecords)
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
                    [paginatedData, count] =  await db.$transaction([db.customers.findMany({
                        where: {
                            status: filters.status,
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }),db.customers.count({
                        where: {
                            status: filters.status,
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                    })]);

                } else {
                    [paginatedData, count] =  await db.$transaction( [db.customers.findMany({
                        where: {
                            status: filters.status
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }),db.customers.count({
                        where: {
                            status: filters.status
                        },
                    })]);
                }

            } else {

                if (filters.search != null) {

                    [paginatedData, count] =  await db.$transaction( [db.customers.findMany({
                        where: {
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }),db.customers.count({
                        where: {
                            full_name: {
                                startsWith: filters.search,
                            }
                        },
                    })]);

                } else {
                    [paginatedData, count] =  await db.$transaction( [db.customers.findMany({
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }),db.customers.count()]);
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
                    [paginatedData, count] =  await db.$transaction( [db.vendor_jobs.findMany({
                        where: {
                            status: filters.status,
                            description: {
                                startsWith: filters.search,
                            },


                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }),db.vendor_jobs.count({
                        where: {
                            status: filters.status,
                            description: {
                                startsWith: filters.search,
                            },


                        },
                    })]);

                } else {
                    [paginatedData, count] =  await db.$transaction( [db.vendor_jobs.findMany({
                        where: {
                            status: filters.status
                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }),db.vendor_jobs.count({
                        where: {
                            status: filters.status
                        },
                    })]);
                }

            } else {

                if (filters.search != null) {

                    [paginatedData, count] =  await db.$transaction( [db.vendor_jobs.findMany({
                        where: {
                            description: {
                                startsWith: filters.search,
                            },

                        },
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }),db.vendor_jobs.count({
                        where: {
                            description: {
                                startsWith: filters.search,
                            },

                        },
                    })]);

                } else {
                    [paginatedData, count] =  await db.$transaction( [db.vendor_jobs.findMany({
                        skip: (filters.offset - 1) * filters.limit, // Calculate the number of records to skip based on page number
                        take: filters.limit, // Set the number of records to be returned per page
                    }),db.vendor_jobs.count()]);
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
        try {
            servResp.data = await db.services.create({
                data: {
                    name: serviceBody.name,
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
        try {
            servResp.data = await db.services.update({
                where: {
                    id: Number(serviceBody.id)
                },
                data: {
                    name: serviceBody.name,
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
        try {
            servResp.data = await db.sub_services.create({
                data: {
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
        try {
            servResp.data = await db.sub_services.update({
                where: {
                    id: serviceBody.id
                },
                data: {
                   // services_id: Number(serviceBody.service_id),
                    name: serviceBody.name,
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
                    status: vendor.status,
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

}
