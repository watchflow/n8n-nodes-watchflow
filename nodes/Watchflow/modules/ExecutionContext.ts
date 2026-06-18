import { IExecuteFunctions, IDataObject } from 'n8n-workflow';

/**
 * Reads the current execution id and (if available) the execution URL from the
 * n8n execution context and attaches them to the given request body.
 */
export function attachExecutionContext(
    ctx: IExecuteFunctions,
    body: IDataObject,
    itemIndex: number
): void {
    const executionId = ctx.getExecutionId();
    if (executionId) { body.executionId = executionId; }

    let executionUrl: string | undefined;
    try {
        executionUrl = ctx.evaluateExpression('={{ $execution.url }}', itemIndex) as string;
    } catch (e) {
        executionUrl = undefined;
    }
    if (executionUrl) { body.executionUrl = executionUrl; }
}
