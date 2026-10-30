class ApiResponse{
    status: number;
    message: string;
    data: any;

    constructor(status: number=200, message: string="data fetched successfully", data: any = {}){
        this.status = status;
        this.message = message;
        this.data = data;
    }
}

export default ApiResponse;