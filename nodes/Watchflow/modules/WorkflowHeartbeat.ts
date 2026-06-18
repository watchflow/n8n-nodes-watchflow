import {
    IExecuteFunctions,
    INodeExecutionData,
    IDataObject,
} from 'n8n-workflow';

import { ApiHelper } from './ApiHelper';
import { attachExecutionContext } from './ExecutionContext';

export async function executeWorkflowHeartbeat(
    this: IExecuteFunctions,
    apiHelper: ApiHelper,
    itemIndex: number
): Promise<INodeExecutionData[]> {
    const workflow = this.getWorkflow();

    const body: IDataObject = {
        key: workflow.id,
        interval: 'activity_profile',
        source: 'heartbeat',
    };

    if (workflow.name) { body.name = workflow.name; }

    const properties = this.getNodeParameter('properties', itemIndex, {}) as {
        property?: Array<{ name: string; value: any }>;
    };

    const data: IDataObject = {};
    if (properties.property) {
        for (const entry of properties.property) {
            if (entry.name) { data[entry.name] = entry.value; }
        }
    }

    if (Object.keys(data).length > 0) {
        body.data = data;
    }

    attachExecutionContext(this, body, itemIndex);

    const responseData = await apiHelper.request('POST', '/ping', body);
    const executionData = this.helpers.returnJsonArray(responseData);

    return executionData.map((item) => ({
        ...item,
        pairedItem: { item: itemIndex },
    }));
}
