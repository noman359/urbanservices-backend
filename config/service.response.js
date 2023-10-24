export default class serviceResponse { 
    isError = false;
    data = new Object();
    message = "Success";
    constructor() {
        this.data = {};
        this.isError = false;
        this.message = "Success";
    }
}