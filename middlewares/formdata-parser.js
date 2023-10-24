const formData = async (req, res, next) => {
    let formData = await new Response(req, { headers: req.headers }).formData()
    console.log(formData)
    Array.from(formData.entries()).map(
        value => {
            console.log(value)
            req.body[value[0]] = value[1]
        }
    )
    console.log(req.body)
    next()
}

export default formData