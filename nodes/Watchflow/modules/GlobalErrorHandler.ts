import {
    IExecuteFunctions,
    INodeExecutionData,
    IDataObject,
} from 'n8n-workflow';

import { ApiHelper } from './ApiHelper';
import { attachExecutionContext } from './ExecutionContext';

export async function executeGlobalErrorHandler(
    this: IExecuteFunctions,
    apiHelper: ApiHelper,
    itemIndex: number
): Promise<INodeExecutionData[]> {
    const workflowId = this.getNodeParameter('workflowId', itemIndex, '') as string;
    const workflowName = this.getNodeParameter('workflowName', itemIndex, '') as string;
    const errorMessage = this.getNodeParameter('errorMessage', itemIndex, '') as string;

    const body: IDataObject = {
        key: workflowId,
        source: 'n8n_error_trigger',
    };

    if (workflowName) { body.name = workflowName; }
    if (errorMessage) { body.error = errorMessage; }

    attachExecutionContext(this, body, itemIndex);

    const responseData = await apiHelper.request('POST', '/ping/fail', body);
    const executionData = this.helpers.returnJsonArray(responseData);

    return executionData.map((item) => ({
        ...item,
        pairedItem: { item: itemIndex },
    }));
}
