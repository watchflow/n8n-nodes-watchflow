import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  Icon,
  INodeProperties,
} from "n8n-workflow";

export class WatchflowApi implements ICredentialType {
  name = "watchflowApi";
  displayName = "Watchflow API";
  icon: Icon = { light: "file:watchflow.svg", dark: "file:watchflow.dark.svg" };
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
      baseURL: "https://api.watchflow.io",
      url: "/heartbeat/auth",
      method: "GET",
    },
  };
}
