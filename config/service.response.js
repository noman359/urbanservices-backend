export default class serviceResponse { 
    isError = false;
    data = new Object();
    message = "Success";
    count = 0;
    constructor() {
        this.data = {};
        this.isError = false;
        this.message = "Success";
        this.count = 0;
    }
}