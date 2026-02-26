import {
    IExecuteFunctions,
    IDataObject,
} from 'n8n-workflow';

export class ApiHelper {
    constructor(private executeFunctions: IExecuteFunctions) { }

    async request(
        method: string,
        url: string,
        body?: IDataObject,
        headers: IDataObject = {},
        option: IDataObject = {},
    ): Promise<any> {
        const options: any = {
            url: `https://api.watchflow.io/heartbeat${url}`,
            method,
            body,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            json: true,
            ...option,
        };

        return this.executeFunctions.helpers.httpRequestWithAuthentication.call(
            this.executeFunctions,
            'watchflowApi',
            options
        );
    }

}
