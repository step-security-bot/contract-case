import {
  AnyMockDescriptor,
  AnyMockDescriptorType,
} from '@contract-case/case-entities-internal';
import {
  CaseMockDescriptorFor,
  MatchContext,
  CaseCoreError,
  addLocation,
  MockData,
} from '@contract-case/case-plugin-base';
import { CoreHttpPlugin } from '@contract-case/case-core-plugin-http';
import {
  AllHttpMatcherTypes,
  MOCK_HTTP_CLIENT,
  MOCK_HTTP_SERVER,
  AllHttpMatcherDescriptors,
  AllHttpMockDescriptors,
} from '@contract-case/case-core-plugin-http-dsl';
import type { MockSetupFns } from './types';
import { loadPlugin } from '../mockExecutors';

const DEFAULT_PLUGINS = [CoreHttpPlugin] as const;

const inferMock = <T extends AnyMockDescriptorType>(
  mock: CaseMockDescriptorFor<AnyMockDescriptor, T>,
  context: MatchContext,
) => {
  context.logger.maintainerDebug('Raw mockDescriptor is', mock);

  const invertedType =
    mock['_case:run:context:setup'][
      context['_case:currentRun:context:contractMode']
    ].type;

  if (invertedType !== mock['_case:mock:type']) {
    context.logger.deepMaintainerDebug(
      `Inverting mock from '${mock['_case:mock:type']}' to '${invertedType}'`,
    );
    return {
      ...mock,
      '_case:mock:type': invertedType,
    };
  }
  context.logger.deepMaintainerDebug(
    `Mock type left at '${mock['_case:mock:type']}'`,
  );
  return mock;
};

const executeMock = <T extends AnyMockDescriptorType>(
  mock: CaseMockDescriptorFor<AnyMockDescriptor, T>,
  MockSetup: MockSetupFns,
  context: MatchContext,
) => {
  const mockType: T = mock['_case:mock:type'];
  if (!mockType) {
    throw new CaseCoreError(
      `Missing type for mock setup. You must pass a MockDescriptor to setup`,
      context,
    );
  }
  DEFAULT_PLUGINS.forEach((plugin) =>
    loadPlugin<
      AllHttpMatcherTypes,
      typeof MOCK_HTTP_CLIENT | typeof MOCK_HTTP_SERVER,
      AllHttpMatcherDescriptors,
      AllHttpMockDescriptors
    >(context, plugin),
  );

  const executor = MockSetup[mockType];
  if (!executor) {
    throw new CaseCoreError(`Missing setup for mock type '${mockType}'`);
  }
  context.logger.debug(
    `Initialising a ${
      mock['_case:mock:type'].startsWith('_case:')
        ? mock['_case:mock:type'].replace('_case:', 'ContractCase ')
        : mock['_case:mock:type']
    }`,
  );
  return executor(mock, addLocation(mockType, context));
};

export const mockExecutor = <T extends AnyMockDescriptorType>(
  mock: CaseMockDescriptorFor<AnyMockDescriptor, T>,
  MockSetup: MockSetupFns,
  context: MatchContext,
): Promise<MockData<unknown, T>> =>
  executeMock(
    inferMock(mock, addLocation('inference', context)),
    MockSetup,
    context,
  );
