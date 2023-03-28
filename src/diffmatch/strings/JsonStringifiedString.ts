import { CaseConfigurationError } from '../../entities';
import { addLocation } from '../../entities/context';
import {
  actualToString,
  makeResults,
  matchingError,
} from '../../entities/results';
import type {
  MatchContext,
  MatchResult,
  AnyData,
  MatcherExecutor,
  JSON_STRINGIFIED_TYPE,
  CoreJsonStringified,
} from '../../entities/types';

const check = (
  matcher: CoreJsonStringified,
  matchContext: MatchContext,
  actual: unknown
): Promise<MatchResult> | MatchResult => {
  if (typeof actual !== 'string') {
    return makeResults(
      matchingError(
        matcher,
        `${actualToString(
          actual
        )} is not a string; so it can't match a json stringified string`,
        actual,
        matchContext,
        '<A string that would parse as json>'
      )
    );
  }

  let decodedActual: string;
  try {
    decodedActual = JSON.parse(actual);
  } catch (parseError) {
    return makeResults(
      matchingError(
        matcher,
        `${actualToString(actual)} failed to parse as json (${
          (parseError as Error).message
        })`,
        actual,
        matchContext,
        '<A string that would parse as json>'
      )
    );
  }

  return matchContext.descendAndCheck(
    matcher['case:matcher:child'],
    addLocation(':jsonStringify', matchContext),
    decodedActual
  );
};

const strip = (
  matcher: CoreJsonStringified,
  matchContext: MatchContext
): AnyData => {
  const result = matchContext.descendAndStrip(
    matcher['case:matcher:child'],
    addLocation(':jsonStringify', matchContext)
  );

  let encoded: string;
  try {
    encoded = JSON.stringify(result);
  } catch (parseError) {
    throw new CaseConfigurationError(
      `Unable to json stringify '${result}' during stripMatchers (${
        (parseError as Error).message
      })`
    );
  }
  return encoded;
};

export const JsonStringifiedString: MatcherExecutor<
  typeof JSON_STRINGIFIED_TYPE
> = {
  describe: (matcher, matchContext) =>
    `json stringified '${matchContext.descendAndDescribe(
      matcher['case:matcher:child'],
      addLocation(':jsonStringify', matchContext)
    )}'`,
  check,
  strip,
};
