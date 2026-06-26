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
        // NOTE: no leading "=" here. evaluateExpression already treats the string
        // as an expression; a leading "=" would be kept literally, yielding "="
        // (or "=<url>") instead of the URL.
        const evaluated = ctx.evaluateExpression('{{ $execution.url }}', itemIndex) as
            | string
            | undefined;
        // $execution.url is empty when n8n has no configured base URL (e.g. manual
        // runs); only keep a real absolute URL so we never store junk like "=".
        if (typeof evaluated === 'string' && /^https?:\/\//.test(evaluated.trim())) {
            executionUrl = evaluated.trim();
        }
    } catch (e) {
        executionUrl = undefined;
    }
    if (executionUrl) { body.executionUrl = executionUrl; }
}
