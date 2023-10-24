const filtersParser = async (req, res, next) => {
    console.log(req.query)
    if (req.query.hasOwnProperty('filter')) {
        let filter_arr = req.query.filter.split(',')
        let filter_obj = {}
        filter_arr.forEach(filter => {
            let filter_ind = filter.split(':')
            filter_obj[filter_ind[0]] = filter_ind[1]
        });
        req.query.filter = filter_obj
    }
    next()
}

export default filtersParser