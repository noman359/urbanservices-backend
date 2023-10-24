import DBConn from '../loaders/database.js'

export default class genericService {
    dbConn = new DBConn()
    #repos = {}

    #repository = ''
    connection = {}
    constructor() {
        this.#repository = null
        this.#repos = {}

    }

    async initialize(repository) {
        this.connection = await this.dbConn.getConnection()
        this.#repository = repository
        this.#repos = {
            vendors: connection.vendor,
            services: connection.services,
            vendor_services: connection.vendor_services
        }
        await this.dbConn.diconnect()
    }

    #isRepositoryGiven() {
        if (this.#repository) {
            return true
        } else {
            throw new Error("Repository Name not provided")
        }
    }

    getRepository() {
        this.#isRepositoryGiven()
        console.log(this.#repos)
        return this.#repos[this.#repository]
    }



    async create(body) {
        this.#isRepositoryGiven()
        let repo = this.getRepository(this.#repository)
        return await Array.isArray(body) ? repo.createMany({ data: body, skipDuplicates: true }) : repo.create({ data: data })
    }

    async update(id, body) {
        this.#isRepositoryGiven()
        let repo = this.getRepository(this.#repository)
        return await repo.update({
            data: body, where: {
                id: id
            }
        })
    }

    /**
     * This function will return data from the provided repository in the constructor
     * @param {Object} where example: {id : 1 }
     * @param {Object} orderBy example: {id : 'asc' } or {id: 'desc}
     * @param {number} take example 1 
     * @param {number} skip example 1
     * @returns will return repository data 
     */

    async select(where = null, orderBy = null, take = null, skip = null) {
        this.#isRepositoryGiven()
        let repo = this.getRepository()
        let resp = null
        switch (arguments.length) {
            case 1:
                resp = await repo.findMany({
                    where: where
                })
                break
            case 2:
                resp = await repo.findMany({
                    where: where,
                    orderBy: orderBy
                })
                break
            case 4:
                resp = await repo.findMany(
                    { where: where, orderBy: orderBy, take: take, skip: skip }

                )
                break
            default:
                throw new Error('Arguments provided are less/more than expected')
        }

        return resp
    }

    // mongoModel = null
    // constructor(mongoModel) {
    //     this.mongoModel = mongoModel
    // }

    // genericAdd(collectionModel) {
    //     return new Promise((resolve, reject) => {
    //         this.mongoModel.create(collectionModel, (err, res) => err ? reject(err) : resolve(res))
    //     })
    // }

    // genericDelete(id) {
    //     return new Promise((resolve, reject) => {
    //         this.mongoModel.deleteOne({
    //             _id: id
    //         }, (err, res) => err ? reject(err) : resolve(res)
    //         )

    //     })
    // }



}