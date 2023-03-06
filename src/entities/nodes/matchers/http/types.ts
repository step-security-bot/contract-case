import type {
  AnyCaseNodeOrData,
  AnyData,
  AnyStringMatcher,
} from '../../../../entities/types';

export const HTTP_STATUS_CODE_MATCHER_TYPE = 'HttpStatusCode' as const;
export const HTTP_RESPONSE_MATCHER_TYPE = 'HttpResponseMatcher' as const;
export const HTTP_REQUEST_MATCHER_TYPE = 'HttpRequestMatcher' as const;

export interface CoreHttpStatusCodeMatcher {
  'case:matcher:type': typeof HTTP_STATUS_CODE_MATCHER_TYPE;
  'case:matcher:rule': string | Array<string>;
  'case:matcher:example': number;
  'case:matcher:resolvesTo': 'HttpStatusCode';
}

export type CoreHttpResponseMatcher = {
  'case:matcher:type': typeof HTTP_RESPONSE_MATCHER_TYPE;
  'case:matcher:uniqueName'?: string;
  uniqueName?: string;
  status: number | CoreHttpStatusCodeMatcher;
  body?: AnyCaseNodeOrData;
  headers?: AnyCaseNodeOrData | Record<string, AnyCaseNodeOrData>;
};

export type CoreHttpRequestMatcher = {
  'case:matcher:type': typeof HTTP_REQUEST_MATCHER_TYPE;
  'case:matcher:uniqueName'?: string;
  uniqueName?: string;
  path: AnyStringMatcher | string;
  method: AnyStringMatcher | string;
  body?: AnyCaseNodeOrData;
  headers?: AnyCaseNodeOrData | Record<string, AnyCaseNodeOrData>;
};

export type HttpRequestData = {
  body: AnyData;
  method: string;
  path: string;
  headers?: Record<string, string | string[] | undefined>;
};

export type HttpResponseData = {
  status: number;
  body: AnyData;
  headers?: Record<string, string>;
};

export interface HttpMockResponse {
  uniqueName?: string;
  status: number | CoreHttpStatusCodeMatcher;
  headers?: AnyCaseNodeOrData | Record<string, AnyCaseNodeOrData>;
  body?: AnyCaseNodeOrData;
}

export interface HttpMockRequest {
  uniqueName?: string;
  path: AnyStringMatcher | string;
  method: AnyStringMatcher | string;
  headers?: AnyCaseNodeOrData | Record<string, AnyCaseNodeOrData>;
  body?: AnyCaseNodeOrData;
}
