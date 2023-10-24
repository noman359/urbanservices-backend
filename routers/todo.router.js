import response from '../handlers/api-response.handler.js'
import TodoController from "../api/todo.controller.js";
import { Router } from 'express';

const todoCtrl = new TodoController()
const lRoute = Router();
export default function (router) {
    router.use('/todo', lRoute)
    lRoute.post('/', todoCtrl.addTodo, response)
    lRoute.delete('/:id', todoCtrl.deleteTodo, response)
}