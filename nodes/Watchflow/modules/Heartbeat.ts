import {
    IExecuteFunctions,
    INodeExecutionData,
    IDataObject,
    NodeOperationError,
} from 'n8n-workflow';

import { ApiHelper } from './ApiHelper';
import { attachExecutionContext } from './ExecutionContext';

export async function executeHeartbeat(
    this: IExecuteFunctions,
    apiHelper: ApiHelper,
    itemIndex: number
): Promise<INodeExecutionData[]> {
    const operation = this.getNodeParameter('operation', itemIndex) as string;
    const key = this.getNodeParameter('key', itemIndex) as string;

    const endpoints: Record<string, string> = {
        ping: '/ping',
        start: '/ping/start',
        fail: '/ping/fail',
    };

    const endpoint = endpoints[operation] || '/ping';

    const body: IDataObject = {
        key,
    };

    if (operation === 'fail') {
        const error = this.getNodeParameter('error', itemIndex, '') as string;
        if (error) { body.error = error; }
    }

    const interval = this.getNodeParameter('interval', itemIndex, '') as string;
    if (interval) { body.interval = interval; }

    const name = this.getNodeParameter('name', itemIndex, '') as string;
    if (name) { body.name = name; }

    let data = this.getNodeParameter('data', itemIndex, {}) as any;
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (error) {
            throw new NodeOperationError(this.getNode(), 'The "Additional Data" field must be a valid JSON object.', { itemIndex });
        }
    }

    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        body.data = data;
    }

    attachExecutionContext(this, body, itemIndex);

    const responseData = await apiHelper.request('POST', endpoint, body);
    const executionData = this.helpers.returnJsonArray(responseData);

    return executionData.map((item) => ({
        ...item,
        pairedItem: { item: itemIndex },
    }));
}
