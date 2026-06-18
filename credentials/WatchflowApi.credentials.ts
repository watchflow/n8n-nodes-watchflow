import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  Icon,
  INodeProperties,
} from "n8n-workflow";

export class WatchflowApi implements ICredentialType {
  name = "watchflowApi";
  displayName = "Watchflow (n8n Monitoring Suite) API";
  icon: Icon = "file:watchflow.svg";
  documentationUrl = "https://www.watchflow.io/api/";
  properties: INodeProperties[] = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      typeOptions: { password: true },
      default: "",
      description: "You can get API Key for Watchflow from https://app.watchflow.io",
      required: true,
    },
    {
      displayName: "API Base URL",
      name: "baseUrl",
      type: "string",
      default: "https://api.watchflow.io",
      description:
        "Base URL of the Watchflow API. Leave as is for production; change only for testing against another environment (e.g. staging).",
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        "x-api-key": "={{$credentials.apiKey}}",
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: "={{$credentials.baseUrl || 'https://api.watchflow.io'}}",
      url: "/heartbeat/ping",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        key: "n8n-credential-test",
      },
    },
  };
}
