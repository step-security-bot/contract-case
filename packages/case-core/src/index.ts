import {
  MOCK_HTTP_SERVER,
  ArbitraryConfig,
} from '@contract-case/case-core-plugin-http-dsl';
import type { Assertable } from './entities/types';
import { AnyCaseMatcher } from '@contract-case/case-entities-internal';
import { AnyLeafOrStructure } from '@contract-case/case-plugin-base';

/*!
 * ContractCase
 * Copyright(c) 2022-2024 Timothy Jones (TLJ)
 * BSD-3-Clause license
 */

export * from './boundaries';
export * from './boundaries/types';
export { CaseConfig } from './core/types';
export { TestInvoker, MultiTestInvoker } from './core/executeExample/types';
export { BrokerError } from './core';
export { LogLevel } from '@contract-case/case-plugin-base';

export {
  CaseConfigurationError,
  CaseCoreError,
  CaseFailedAssertionError,
  CaseTriggerError,
  VerifyTriggerReturnObjectError,
} from '@contract-case/case-plugin-base';
export {
  AnyMockDescriptorType,
  AnyMockDescriptor,
} from '@contract-case/case-entities-internal';

export type AnyCaseMatcherOrData = AnyCaseMatcher | AnyLeafOrStructure;

export * from './connectors';

export type HttpRequestConfig =
  | Assertable<typeof MOCK_HTTP_SERVER>['config']
  | ArbitraryConfig<typeof MOCK_HTTP_SERVER>;
