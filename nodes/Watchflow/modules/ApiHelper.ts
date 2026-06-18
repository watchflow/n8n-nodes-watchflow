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
        const credentials = await this.executeFunctions.getCredentials('watchflowApi');
        const baseUrl = ((credentials.baseUrl as string) || 'https://api.watchflow.io').replace(/\/+$/, '');

        const options: IHttpRequestOptions = {
            url: `${baseUrl}/heartbeat${url}`,
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
