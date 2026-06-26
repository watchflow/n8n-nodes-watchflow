import {
    IExecuteFunctions,
    INodeExecutionData,
    IDataObject,
} from 'n8n-workflow';

import { ApiHelper } from './ApiHelper';

export async function executeGlobalErrorHandler(
    this: IExecuteFunctions,
    apiHelper: ApiHelper,
    itemIndex: number
): Promise<INodeExecutionData[]> {
    const workflowId = this.getNodeParameter('workflowId', itemIndex, '') as string;
    const workflowName = this.getNodeParameter('workflowName', itemIndex, '') as string;
    const errorMessage = this.getNodeParameter('errorMessage', itemIndex, '') as string;
    // The Error Trigger payload carries the FAILED workflow's execution id/url
    // (via $json.execution.*). We read them as explicit parameters instead of
    // evaluating $execution.* here, which would resolve to this error handler's
    // own execution rather than the workflow that actually failed.
    const executionId = this.getNodeParameter('executionId', itemIndex, '') as string;
    const executionUrl = this.getNodeParameter('executionUrl', itemIndex, '') as string;

    const body: IDataObject = {
        key: workflowId,
        source: 'n8n_error_trigger',
    };

    if (workflowName) { body.name = workflowName; }
    if (errorMessage) { body.error = errorMessage; }
    if (executionId) { body.executionId = executionId; }
    // Only forward a real absolute URL so Watchflow never stores junk (e.g. when
    // n8n has no configured base URL, $json.execution.url is empty).
    if (typeof executionUrl === 'string' && /^https?:\/\//.test(executionUrl.trim())) {
        body.executionUrl = executionUrl.trim();
    }

    const responseData = await apiHelper.request('POST', '/ping/fail', body);
    const executionData = this.helpers.returnJsonArray(responseData);

    return executionData.map((item) => ({
        ...item,
        pairedItem: { item: itemIndex },
    }));
}
