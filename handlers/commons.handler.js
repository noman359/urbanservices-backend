export default class commonsHandler {
    constructor() { }

    getRawSort(sort) {
        let order_by = ""
        if (sort !== "") {
            let order = sort.split(':')
            order_by = `ORDER BY ${order[0]} ${order[1]}`
        }
        return order_by
    }

    getRawPaginate(limit, offset) {
        let paginate = ''
        let checks = [null, undefined, ""]
        if (checks.includes(limit) || checks.includes(offset)) {
            paginate = `LIMIT 100 OFFSET 0`
        } else {
            paginate = `LIMIT ${limit} OFFSET ${Number(offset) * 10}`
        }
        return paginate
    }

}