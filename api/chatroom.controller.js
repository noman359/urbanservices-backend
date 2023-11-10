import ChatroomService from "../services/chatroom.service.js"

let chatroomServ = new ChatroomService()

export default class ChatroomController {
    constructor() { }

    getConversation(req, res, next) {
        let conn = null
        next(conn)
    }
}