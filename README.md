# @watchflow/n8n-nodes-watchflow

This is an n8n community node for [Watchflow.io](https://www.watchflow.io/). It allows you to send heartbeats from your n8n workflows to monitor their health and execution time.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Credentials

To use this node, you'll need a Watchflow API Key. You can get one from the [Watchflow Dashboard](https://app.watchflow.io).

## Resources & Operations

### Heartbeat

Monitor your scheduled tasks and cron jobs.

#### Operations:
- **Ping**: Simple heartbeat successful notification. Marks the job as successful.
- **Start**: Signal the start of a job. Use this at the beginning of a workflow to track execution duration.
- **Error**: Signal a job failure. Marks the job as failed and allows you to provide an error message.

#### Parameters:
- **Monitor Key**: A unique identifier for your monitor (e.g., `daily-backup`).
- **Monitor Name**: A human-readable name for your monitor.
- **Interval**: Expected heartbeat interval (e.g., `5m`, `1h`, `24h`).
- **Additional Data**: Custom metrics or metadata as a JSON object.
- **Error Message**: Description of why the job failed (only for Error operation).

## Local Development

See [LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md) for instructions on how to run and test this node locally using Docker.

## License

[MIT](LICENSE)