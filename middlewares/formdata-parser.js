const formData = async (req, res, next) => {
    let formData = await new Response(req, { headers: req.headers }).formData()
    console.log(formData)
    Array.from(formData.entries()).forEach((entry) => {
        const [key, value] = entry;
      
        // Check if the key already exists in req.body
        if (req.body.hasOwnProperty(key)) {
          // If the key exists, check if it's an array
          if (Array.isArray(req.body[key])) {
            // If it's an array, push the new value
            req.body[key].push(value);
          } else {
            // If it's not an array, convert it to an array with the existing and new values
            req.body[key] = [req.body[key], value];
          }
        } else {
          // If the key doesn't exist, create a new entry in req.body as an array
          req.body[key] = value;
        }
      });


   
    console.log(req.body)
    next()
}

export default formData