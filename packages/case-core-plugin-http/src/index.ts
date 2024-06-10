/*!
 * ContractCase Core HTTP Plugin
 * Copyright(c) 2022-2024 Timothy Jones (TLJ)
 * BSD-3-Clause license
 */

import {
  AllHttpMatcherDescriptors,
  AllHttpMatcherTypes,
  AllHttpMockDescriptors,
  AllHttpMockSetupInfo,
  HTTP_BASIC_AUTH_TYPE,
  HTTP_REQUEST_MATCHER_TYPE,
  HTTP_RESPONSE_MATCHER_TYPE,
  HTTP_STATUS_CODE_MATCHER_TYPE,
  MOCK_HTTP_CLIENT,
  MOCK_HTTP_SERVER,
  URL_ENCODED_STRING_TYPE,
} from '@contract-case/case-core-plugin-http-dsl';
import { ContractCasePlugin } from '@contract-case/case-plugin-base';
import {
  HttpBasicAuthMatcher,
  HttpRequestMatcher,
  HttpResponseMatcher,
  HttpStatusCodeMatcher,
  UrlEncodedStringMatcher,
} from './matchers';
import { setupHttpResponseConsumer, setupHttpResponseProducer } from './mocks';
import { pluginVersion } from './version';

export * from './matchers';
export * from './mocks';
export * from './mocks/types';

export const CoreHttpPlugin: ContractCasePlugin<
  AllHttpMatcherTypes,
  typeof MOCK_HTTP_CLIENT | typeof MOCK_HTTP_SERVER,
  AllHttpMatcherDescriptors,
  AllHttpMockDescriptors,
  AllHttpMockSetupInfo
> = {
  name: `_CaseCore: Http / Rest Plugin`,
  version: pluginVersion,
  matcherExecutors: {
    [HTTP_BASIC_AUTH_TYPE]: HttpBasicAuthMatcher,
    [HTTP_REQUEST_MATCHER_TYPE]: HttpRequestMatcher,
    [HTTP_RESPONSE_MATCHER_TYPE]: HttpResponseMatcher,
    [HTTP_STATUS_CODE_MATCHER_TYPE]: HttpStatusCodeMatcher,
    [URL_ENCODED_STRING_TYPE]: UrlEncodedStringMatcher,
  },
  setupMocks: {
    [MOCK_HTTP_CLIENT]: setupHttpResponseConsumer,
    [MOCK_HTTP_SERVER]: setupHttpResponseProducer,
  },
};
