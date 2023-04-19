import qs from 'qs';
import {
  CoreHttpRequestMatcher,
  AnyData,
  AnyCaseMatcherOrData,
  HTTP_REQUEST_MATCHER_TYPE,
} from '@contract-case/case-entities-internal';

import { CaseConfigurationError, CaseCoreError } from '../../entities';
import { addLocation } from '../../entities/context';
import { mustResolveToString } from '../../entities/nodes/matchers/resolve';
import { combineResults, makeResults } from '../../entities/results';
import type {
  HttpRequestData,
  MatchContext,
  MatchResult,
  MatcherExecutor,
  CaseError,
} from '../../entities/types';

const isHttpRequestData = (data: unknown): data is HttpRequestData => {
  const maybeRequestData = data as HttpRequestData;
  return (
    typeof maybeRequestData.method === 'string' &&
    typeof maybeRequestData.path === 'string'
  );
};

const strip = (
  matcher: CoreHttpRequestMatcher,
  matchContext: MatchContext
): AnyData => ({
  ...(matcher.body
    ? {
        body: matchContext.descendAndStrip(
          matcher.body,
          addLocation('body', matchContext)
        ),
      }
    : {}),
  ...(matcher.query
    ? {
        query: matchContext.descendAndStrip(
          matcher.query,
          addLocation('query', matchContext)
        ),
      }
    : {}),
  ...(matcher.headers
    ? {
        headers: matchContext.descendAndStrip(
          matcher.headers,
          addLocation('headers', matchContext)
        ),
      }
    : {}),
  method: mustResolveToString(
    matcher.method,
    addLocation('method', matchContext)
  ),
  path: mustResolveToString(matcher.path, addLocation('path', matchContext)),
});

const check = async (
  matcher: CoreHttpRequestMatcher,
  matchContext: MatchContext,
  actual: unknown
): Promise<MatchResult> => {
  if (!actual) {
    throw new CaseConfigurationError(
      'The server was never called. Please confirm that you are calling the mock server, and not your real server',
      matchContext
    );
  }
  if (!isHttpRequestData(actual)) {
    throw new CaseCoreError(
      "The HttpRequestMatcher was invoked with something that isn't http request data.",
      matchContext
    );
  }
  return combineResults(
    ...(await Promise.all<CaseError[]>([
      matchContext.descendAndCheck(
        matcher.method,
        addLocation('method', matchContext),
        actual.method
      ),
      matchContext.descendAndCheck(
        matcher.path,
        addLocation('path', matchContext),
        actual.path
      ),
      matcher.query !== undefined
        ? matchContext.descendAndCheck(
            matcher.query,
            addLocation('query', matchContext),
            actual.query
          )
        : Promise.resolve(makeResults()),
      matcher.headers !== undefined
        ? matchContext.descendAndCheck(
            matcher.headers,
            addLocation('headers', matchContext),
            actual.headers
          )
        : Promise.resolve(makeResults()),
      matcher.body !== undefined
        ? matchContext.descendAndCheck(
            matcher.body,
            addLocation('body', matchContext),
            actual.body
          )
        : Promise.resolve(makeResults()),
    ]))
  );
};

const name = (request: CoreHttpRequestMatcher, context: MatchContext): string =>
  request.uniqueName
    ? request.uniqueName
    : `an http ${context.descendAndDescribe(
        request.method,
        addLocation('method', context)
      )} request to ${context.descendAndDescribe(
        request.path,
        addLocation('path', context)
      )}${
        request.query !== undefined
          ? `?${qs.stringify(
              Object.entries(
                request.query as Record<string, AnyCaseMatcherOrData>
              ).reduce<Record<string, string>>(
                (acc, [key, value]) => ({
                  ...acc,
                  [key]: context.descendAndDescribe(
                    value,
                    addLocation(`query[${key}]`, context)
                  ),
                }),
                {} as Record<string, string>
              ),
              { encode: false }
            )}`
          : ''
      }${
        request.headers
          ? ` with the following headers ${context.descendAndDescribe(
              request.headers,
              addLocation('headers', context)
            )}`
          : ''
      }${
        request.body
          ? ` and body ${context.descendAndDescribe(
              request.body,
              addLocation('body', context)
            )}`
          : ' without a body'
      }`;

export const HttpRequestMatcher: MatcherExecutor<
  typeof HTTP_REQUEST_MATCHER_TYPE
> = { describe: name, check, strip };
