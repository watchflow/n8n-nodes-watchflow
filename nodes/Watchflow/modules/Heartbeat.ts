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

    const data = parseAdditionalData(this, itemIndex);
    if (Object.keys(data).length > 0) {
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

/**
 * Reads the "Additional Data" parameter. Since 0.16.0 it is a fixedCollection
 * of name/value pairs. Workflows saved with earlier versions still carry the
 * old JSON string (or a plain object), so those shapes are accepted as well.
 */
function parseAdditionalData(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
    let raw = ctx.getNodeParameter('data', itemIndex, {}) as unknown;

    if (typeof raw === 'string') {
        if (raw.trim() === '') { return {}; }
        try {
            raw = JSON.parse(raw);
        } catch {
            throw new NodeOperationError(ctx.getNode(), 'The "Additional Data" field must be a valid JSON object.', { itemIndex });
        }
    }

    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { return {}; }

    const collection = raw as { property?: Array<{ name: string; value: unknown }> };
    if (Array.isArray(collection.property)) {
        const data: IDataObject = {};
        for (const entry of collection.property) {
            if (entry.name) { data[entry.name] = entry.value as IDataObject[string]; }
        }
        return data;
    }

    return raw as IDataObject;
}
