import {
  MOCK_HTTP_CLIENT,
  MOCK_HTTP_SERVER,
} from '@contract-case/case-entities-internal';
import {
  WillReceiveHttpRequest,
  WillSendHttpRequest,
} from '@contract-case/case-example-mock-types';
import { httpRequestMatcher, httpResponseMatcher } from '../Matchers/core';
import { HttpMockRequest, HttpMockResponse } from '../Matchers/core/http/types';

type HttpRequestResponseDescription = {
  request: HttpMockRequest;
  response: HttpMockResponse;
};

export const willSendHttpRequest = ({
  request,
  response,
}: HttpRequestResponseDescription): WillSendHttpRequest =>
  ({
    request: httpRequestMatcher(request),
    response: httpResponseMatcher(response),
    '_case:mock:type': MOCK_HTTP_SERVER,
    '_case:run:context:setup': {
      write: {
        type: MOCK_HTTP_SERVER,
        stateVariables: 'default',
        triggers: 'provided',
      },
      read: {
        type: MOCK_HTTP_CLIENT,
        stateVariables: 'state',
        triggers: 'generated',
      },
    },
  } as unknown as WillSendHttpRequest);

export const willReceiveHttpRequest = ({
  request,
  response,
}: HttpRequestResponseDescription): WillReceiveHttpRequest =>
  ({
    request: httpRequestMatcher(request),
    response: httpResponseMatcher(response),
    '_case:mock:type': MOCK_HTTP_CLIENT,
    '_case:run:context:setup': {
      write: {
        type: MOCK_HTTP_CLIENT,
        stateVariables: 'state',
        triggers: 'generated',
      },
      read: {
        type: MOCK_HTTP_SERVER,
        stateVariables: 'default',
        triggers: 'provided',
      },
    },
  } as unknown as WillReceiveHttpRequest);
