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
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
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
                        name: 'Heartbeat',
                        value: 'heartbeat',
                    },
                    {
                        name: 'Global Error Handler',
                        value: 'globalErrorHandler',
                    },
                    {
                        name: 'Workflow Heartbeat',
                        value: 'workflowHeartbeat',
                    },
                ],
                default: 'heartbeat',
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
                        name: 'Error',
                        value: 'fail',
                        action: 'Mark job as failed',
                        description: 'Mark job as failed with error message',
                    },
                    {
                        name: 'Ping',
                        value: 'ping',
                        action: 'Mark job as successful',
                        description: 'Simple ping to mark job as successful',
                    },
                    {
                        name: 'Start',
                        value: 'start',
                        action: 'Start job tracking',
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
                displayName: 'Workflow ID',
                name: 'workflowId',
                type: 'string',
                default: '={{ $json.workflow.id }}',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['globalErrorHandler'],
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
                        resource: ['globalErrorHandler'],
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
                        resource: ['globalErrorHandler'],
                    },
                },
                description: 'Error message from the Error Trigger to log',
            },
            {
                displayName: 'Properties',
                name: 'properties',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: true,
                },
                default: {},
                placeholder: 'Add Property',
                displayOptions: {
                    show: {
                        resource: ['workflowHeartbeat'],
                    },
                },
                description: 'Custom data sent with the heartbeat. Each value supports expressions.',
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
                                description: 'Name of the property',
                            },
                            {
                                displayName: 'Value',
                                name: 'value',
                                type: 'string',
                                default: '',
                                description: 'Value of the property (supports expressions for dynamic values)',
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
                } else if (resource === 'globalErrorHandler') {
                    const result = await executeGlobalErrorHandler.call(this, apiHelper, i);
                    returnData.push(...result);
                } else if (resource === 'workflowHeartbeat') {
                    const result = await executeWorkflowHeartbeat.call(this, apiHelper, i);
                    returnData.push(...result);
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
