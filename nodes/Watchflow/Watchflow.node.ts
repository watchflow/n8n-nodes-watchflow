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

export class Watchflow implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Watchflow',
        name: 'watchflow',
        icon: 'file:watchflow.svg',
        group: ['transform'],
        version: 1,
        description: 'Heartbeat monitoring for your cron jobs and scheduled tasks.',
        defaults: {
            name: 'Watchflow',
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
                    {
                        name: 'Error',
                        value: 'fail',
                        action: 'Mark job as failed',
                        description: 'Mark job as failed with error message',
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
