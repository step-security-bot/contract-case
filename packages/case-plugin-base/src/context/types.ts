import { CaseExample } from '../core/contract/types';
import { LogLevel, Logger } from '../logger/types';
import { CaseError, MatchResult } from '../matchers/errors.types';
import {
  AnyCaseMatcherOrData,
  AnyData,
  AnyCaseMatcher,
} from '../matchers/matchers.types';

/**
 * Indicates that we are doing a general shape match in this context
 *
 * @public
 */
export const MATCH_BY_TYPE = 'type' as const;
/**
 * Indicates that we are doing an exact values match in this context
 *
 * @public
 */
export const MATCH_BY_EXACT = 'exact' as const;

/**
 * Indicates that values must be serialisable to json
 *
 * @public
 */
export const SERIALISABLE_TO_JSON = 'json' as const;

/**
 * The functions that allows saving or looking up matchers
 * with a provided context
 *
 * @internal
 */
export interface RawLookupFns {
  lookupMatcher: (
    uniqueName: string,
    context: MatchContextWithoutLookup,
  ) => AnyCaseMatcherOrData;
  saveLookupableMatcher: (
    matcher: AnyCaseMatcher,
    context: MatchContextWithoutLookup,
  ) => void;
  addVariable: (
    name: string,
    type: 'default' | 'state',
    stateName: string,
    value: AnyCaseMatcherOrData,
    context: MatchContextWithoutLookup,
  ) => [name: string, value: AnyCaseMatcherOrData];
  lookupVariable: (
    name: string,
    context: MatchContextWithoutLookup,
  ) => AnyCaseMatcherOrData;
}

/**
 * The part of the context that allows saving or looking up data
 * bound to a specific context and contract
 *
 * @public
 */
export interface ContractLookupFns {
  lookupMatcher: (uniqueName: string) => AnyCaseMatcherOrData;
  saveLookupableMatcher: (matcher: AnyCaseMatcher) => void;
  addDefaultVariable: (
    name: string,
    stateName: string,
    value: AnyCaseMatcherOrData,
  ) => [name: string, value: AnyCaseMatcherOrData];
  addStateVariable: (
    name: string,
    stateName: string,
    value: AnyCaseMatcherOrData,
  ) => [name: string, value: AnyCaseMatcherOrData];
  lookupVariable: (name: string) => AnyCaseMatcherOrData;
}

/**
 * A type for the part of the context that contains the makeLookup factory
 *
 * TODO: Move this out of the plugin lib
 *
 * @internal
 */
interface HasMakeLookupFn {
  makeLookup: (c: MatchContextWithoutLookup) => ContractLookupFns;
}

/**
 * Describes the traversals available at this point in the execution
 *
 * @public
 */
export interface TraversalFns {
  descendAndCheck: <T extends AnyCaseMatcherOrData>(
    matcherOrData: T,
    parentMatchContext: MatchContext,
    actual: unknown,
  ) => Promise<MatchResult> | MatchResult;
  descendAndStrip: (
    matcherOrData: AnyCaseMatcherOrData,
    parentMatchContext: MatchContext,
  ) => AnyData;
  descendAndDescribe: (
    matcherOrData: AnyCaseMatcherOrData,
    parentMatchContext: MatchContext,
  ) => string;
  selfVerify: (
    matcherOrData: AnyCaseMatcherOrData,
    parentMatchContext: MatchContext,
  ) => Promise<MatchResult> | MatchResult;
}

/**
 * The parts of the context that are needed for logging
 *
 * @internal
 */
export type LogLevelContext = {
  '_case:currentRun:context:parentVersions': Array<string>;
  '_case:currentRun:context:logLevel': LogLevel;
  '_case:currentRun:context:location': Array<string>;
};

/**
 * The parts of the context that don't have the lookup functions
 *
 * @remarks
 * TODO: This is a convenience type for the Case Core, and could be moved out
 * of the plugin lib.
 *
 * @internal
 */
export type MatchContextWithoutLookup = Omit<
  MatchContext,
  keyof ContractLookupFns | keyof HasMakeLookupFn
>;

/**
 * Context to do with the contract file
 *
 * @internal
 */
export interface ContractFileConfig {
  /**
   * The current test run ID (used to name files uniquely if multiple contract runs are running in parallel)
   */
  '_case:currentRun:context:testRunId': string;
  /**
   * The directory that the contract file(s) is/are in.
   */
  '_case:currentRun:context:contractDir': string;
  /**
   * The filename for the contract file (if known)
   */
  '_case:currentRun:context:contractFilename'?: string;
  /**
   * Whether we should allow overwriting the contract file
   */
  '_case:currentRun:context:overwriteFile'?: boolean;
}

/**
 * Convenience type combining base context and contract file context
 *
 * @internal
 */
export type HasContractFileConfig = DataContext & ContractFileConfig;

/**
 * The default context for a run
 *
 * @public
 */
export type DefaultContext = LogLevelContext & {
  '_case:context:matchBy': typeof MATCH_BY_TYPE | typeof MATCH_BY_EXACT;
  /**
   * What the contract must be serialisable to - used by matchers for excluding
   * values of number (etc) that are not valid in json
   */
  '_case:context:serialisableTo': typeof SERIALISABLE_TO_JSON;
  /**
   * Whether we are currently writing (ie, defining) or reading (ie, verifying) a contract.
   * This is only different to 'define' and 'verify' to avoid confusing terminology internally
   */
  '_case:currentRun:context:contractMode': 'write' | 'read';
  /**
   * Whether or not we should print results during this run
   */
  '_case:currentRun:context:printResults': boolean;
};

interface InjectableContext {
  '_case:currentRun:context:baseUrlUnderTest'?: string;
  '_case:currentRun:context:contractMode': 'write' | 'read';
}

/**
 * The part of the context that contains the base url under test.
 *
 * @internal
 */
export interface HasBaseUrlUnderTest {
  '_case:currentRun:context:baseUrlUnderTest': string;
}

/**
 * RunContext exists distinct from CaseConfig, as it allows us to have internal configuration properties that aren't exposed
 *
 * @internal
 */
export interface RunContext
  extends Partial<
    InjectableContext &
      LogLevelContext &
      HasBaseUrlUnderTest &
      ContractFileConfig
  > {
  '_case:currentRun:context:testName': string | 'OUTSIDE_TESTS';
  '_case:currentRun:context:printResults': boolean;
  '_case:currentRun:context:variables': Record<string, AnyCaseMatcherOrData>;
  '_case:currentRun:context:defaultConfig': Record<string, AnyData>;
  // TODO: These are from CaseConfig and should be auto generated
  '_case:currentRun:context:throwOnFail'?: boolean;
  '_case:currentRun:context:brokerCiAccessToken'?: string;
  '_case:currentRun:context:publish'?:
    | false
    | true
    | 'ONLY_IN_CI'
    | 'NEVER'
    | 'ALWAYS';
  '_case:currentRun:context:brokerBasicAuth'?: {
    username: string;
    password: string;
  };
  '_case:currentRun:context:brokerBaseUrl'?: string;
  '_case:currentRun:context:internals'?: {
    asyncVerification: boolean;
  };
}

/**
 * Indicates that the matchers should default to shape matching
 *
 * @public
 */
export interface MatchContextByType {
  '_case:context:matchBy': 'type';
}

/**
 * Indicates that the matchers should default to exact matching
 *
 * @public
 */
export interface MatchContextByExact {
  '_case:context:matchBy': 'exact';
}

/**
 * Setup information for HTTP tests
 * TODO: Move this out of the base plugin
 *
 * @internal
 */
export interface HttpTestContext {
  baseUrl: string;
}

/**
 * Part of the context with the logger attached.
 *
 * @public
 */
export interface LogContext {
  /** Current logger */
  logger: Logger;
  /** Used for printing results (should not be called by plugins) */
  resultPrinter: ResultFormatter;
  /** Constructor for making the logger when moving to different locations (should not be called by plugins) */
  makeLogger: (m: LogLevelContext) => Logger;
}

/**
 * Just the parts of the context that have data
 *
 * @public
 */
export type DataContext = DefaultContext &
  Partial<InjectableContext> &
  Partial<ContractFileConfig> &
  RunContext &
  LogLevelContext &
  LogContext;

/**
 * The part of the context used during a matching run - contains traversal functions
 *
 * @public
 */
export type MatchContext = DataContext &
  TraversalFns &
  ContractLookupFns &
  HasMakeLookupFn;

/**
 * The result formatter object
 * @internal
 */
export type ResultFormatter = {
  printError: (e: CaseError, context: DataContext) => void;
  printSuccessTitle: (
    example: CaseExample,
    index: string,
    context: DataContext,
  ) => void;
  printFailureTitle: (
    example: CaseExample,
    index: string,
    context: DataContext,
  ) => void;
  printDownloadedContract: (filename: string, context: DataContext) => void;
};
