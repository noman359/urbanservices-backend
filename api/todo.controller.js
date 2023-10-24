import todoService from "../services/todo.service.js"

let todoServ = new todoService()

export default class TodoController {
    constructor() {

    }

    async addTodo(req, res, next) {
        let insertedResponse = await todoServ.insertTodo(req.body)
        next(insertedResponse)
    }

    async deleteTodo(req, res, next) {
        let deletedResp = await todoServ.deleteTodo(req.params.id)
        next(deletedResp)
    }

}