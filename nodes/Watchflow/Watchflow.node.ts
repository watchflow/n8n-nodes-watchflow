import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeConnectionType,
    NodeApiError,
    JsonObject,
} from 'n8n-workflow';

import { ApiHelper } from './modules/ApiHelper';
import { executeHeartbeat } from './modules/Heartbeat';
import { executeGlobalErrorHandler } from './modules/GlobalErrorHandler';
import { executeWorkflowHeartbeat } from './modules/WorkflowHeartbeat';

export class Watchflow implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Watchflow (n8n Monitoring Suite)',
        name: 'watchflow',
        icon: 'file:watchflow.svg',
        group: ['transform'],
        version: 1,
        description: 'Heartbeat monitoring for your cron jobs and scheduled tasks.',
        subtitle: '={{ ({ reportFailure: "Report a failed run", reportSuccess: "Report a successful run", ping: "Send a success ping", fail: "Send a failure ping", start: "Send a start ping" })[$parameter["operation"]] || $parameter["operation"] }}',
        defaults: {
            name: 'Watchflow (n8n Monitoring Suite)',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'watchflowApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Workflow Monitoring (Recommended)',
                        value: 'workflowMonitoring',
                    },
                    {
                        name: 'Generic Heartbeat (Advanced)',
                        value: 'heartbeat',
                    },
                ],
                default: 'workflowMonitoring',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['workflowMonitoring'],
                    },
                },
                options: [
                    {
                        name: 'Report a Failed Run',
                        value: 'reportFailure',
                        action: 'Report a failed run',
                        description: 'Place behind the global Error Trigger; pulls workflow and error automatically',
                    },
                    {
                        name: 'Report a Successful Run',
                        value: 'reportSuccess',
                        action: 'Report a successful run',
                        description: 'Place at the end of the workflow; heartbeat plus your metrics',
                    },
                ],
                default: 'reportFailure',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['heartbeat'],
                    },
                },
                options: [
                    {
                        name: 'Send a Success Ping',
                        value: 'ping',
                        action: 'Send a success ping',
                        description: 'Simple ping to mark the job as successful',
                    },
                    {
                        name: 'Send a Failure Ping',
                        value: 'fail',
                        action: 'Send a failure ping',
                        description: 'Mark the job as failed with an error message',
                    },
                    {
                        name: 'Send a Start Ping',
                        value: 'start',
                        action: 'Send a start ping',
                        description: 'Start job tracking for duration measurement',
                    },
                ],
                default: 'ping',
            },
            {
                displayName: 'Monitor Key',
                name: 'key',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['heartbeat'],
                    },
                },
                description: 'Unique identifier for your monitor (e.g., "daily-backup")',
            },
            {
                displayName: 'Monitor Name',
                name: 'name',
                type: 'string',
                default: '',
                displayOptions: {
                    show: {
                        resource: ['heartbeat'],
                    },
                },
                description: 'Human-readable name for your monitor',
            },
            {
                displayName: 'Interval',
                name: 'interval',
                type: 'string',
                default: '24h',
                displayOptions: {
                    show: {
                        resource: ['heartbeat'],
                    },
                },
                description: 'Expected heartbeat interval (e.g., "5m", "1h", "24h"). Default: 24h',
            },
            {
                displayName: 'Error Message',
                name: 'error',
                type: 'string',
                default: '',
                displayOptions: {
                    show: {
                        resource: ['heartbeat'],
                        operation: ['fail'],
                    },
                },
                description: 'Description of why the job failed',
            },
            {
                displayName: 'Additional Data',
                name: 'data',
                type: 'json',
                default: '{}',
                displayOptions: {
                    show: {
                        resource: ['heartbeat'],
                    },
                },
                description: 'Custom metrics or metadata (JSON object)',
            },
            {
                displayName: 'Connect an <b>Error Trigger</b> node to this node. Add the Error Trigger to your workflow (or set it as the workflow\'s error workflow) so the failed workflow and its error message are pulled in automatically.',
                name: 'reportFailureNotice',
                type: 'notice',
                default: '',
                displayOptions: {
                    show: {
                        resource: ['workflowMonitoring'],
                        operation: ['reportFailure'],
                    },
                },
            },
            {
                displayName: 'Workflow ID',
                name: 'workflowId',
                type: 'string',
                default: '={{ $json.workflow.id }}',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['workflowMonitoring'],
                        operation: ['reportFailure'],
                    },
                },
                description: 'Workflow ID from the Error Trigger, used as the monitor key',
            },
            {
                displayName: 'Workflow Name',
                name: 'workflowName',
                type: 'string',
                default: '={{ $json.workflow.name }}',
                displayOptions: {
                    show: {
                        resource: ['workflowMonitoring'],
                        operation: ['reportFailure'],
                    },
                },
                description: 'Workflow name from the Error Trigger, used as the monitor label',
            },
            {
                displayName: 'Error Message',
                name: 'errorMessage',
                type: 'string',
                default: '={{ $json.execution.error.message }}',
                displayOptions: {
                    show: {
                        resource: ['workflowMonitoring'],
                        operation: ['reportFailure'],
                    },
                },
                description: 'Error message from the Error Trigger to log',
            },
            {
                displayName: 'Add your own metrics to send with each successful run, e.g. how many items were processed. Each value supports expressions, so you can pull dynamic data from the workflow. These show up on the monitor in Watchflow.',
                name: 'reportSuccessNotice',
                type: 'notice',
                default: '',
                displayOptions: {
                    show: {
                        resource: ['workflowMonitoring'],
                        operation: ['reportSuccess'],
                    },
                },
            },
            {
                displayName: 'Custom Properties',
                name: 'properties',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: true,
                },
                default: {
                    property: [
                        {
                            name: 'itemsProcessed',
                            value: '={{ $input.all().length }}',
                        },
                    ],
                },
                placeholder: 'Add Property',
                displayOptions: {
                    show: {
                        resource: ['workflowMonitoring'],
                        operation: ['reportSuccess'],
                    },
                },
                description: 'Custom metrics or metadata sent with the heartbeat. Each value supports expressions for dynamic data. Remove the default row if you do not need it.',
                options: [
                    {
                        name: 'property',
                        displayName: 'Property',
                        values: [
                            {
                                displayName: 'Name',
                                name: 'name',
                                type: 'string',
                                default: '',
                                placeholder: 'e.g. itemsProcessed',
                                description: 'Name of the metric as it appears in Watchflow',
                            },
                            {
                                displayName: 'Value',
                                name: 'value',
                                type: 'string',
                                default: '',
                                placeholder: '={{ $input.all().length }}',
                                description: 'Value of the metric. Supports expressions, e.g. ={{ $input.all().length }} for the number of incoming items',
                            },
                        ],
                    },
                ],
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const apiHelper = new ApiHelper(this);

        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i) as string;

                if (resource === 'heartbeat') {
                    const result = await executeHeartbeat.call(this, apiHelper, i);
                    returnData.push(...result);
                } else if (resource === 'workflowMonitoring') {
                    const operation = this.getNodeParameter('operation', i) as string;
                    if (operation === 'reportFailure') {
                        const result = await executeGlobalErrorHandler.call(this, apiHelper, i);
                        returnData.push(...result);
                    } else if (operation === 'reportSuccess') {
                        const result = await executeWorkflowHeartbeat.call(this, apiHelper, i);
                        returnData.push(...result);
                    }
                }
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: (error as any).message }, pairedItem: { item: i } });
                    continue;
                }
                throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
            }
        }

        return [returnData];
    }
}
