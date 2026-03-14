import {
    IExecuteFunctions,
    IDataObject,
    IHttpRequestOptions,
    IHttpRequestMethods,
} from 'n8n-workflow';

export class ApiHelper {
    constructor(private executeFunctions: IExecuteFunctions) { }

    async request(
        method: IHttpRequestMethods,
        url: string,
        body?: IDataObject,
        headers: IDataObject = {},
        option: IDataObject = {},
    ): Promise<any> {
        const options: IHttpRequestOptions = {
            url: `https://api.watchflow.io/heartbeat${url}`,
            method: method,
            body,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            ...option,
        };

        return this.executeFunctions.helpers.httpRequestWithAuthentication.call(
            this.executeFunctions,
            'watchflowApi',
            options
        );
    }

}
