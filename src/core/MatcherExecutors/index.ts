import {
  type AnyCaseNodeType,
  NUMBER_MATCHER_TYPE,
  STRING_MATCHER_TYPE,
  BOOLEAN_MATCHER_TYPE,
  CASCADING_EXACT_MATCHER_TYPE,
  NULL_MATCHER_TYPE,
} from 'core/matchers/types';
import { BooleanMatcher } from './leaves/BooleanMatcher';
import { NullMatcher } from './leaves/NullMatcher';
import { NumberMatcher } from './leaves/NumberMatcher';
import { StringMatcher } from './leaves/StringMatcher';
import { ExactCascadingContext } from './contextShift/ExactCascadingContext';
import type { MatcherExecutor } from './types';

export const MatcherExecutors: { [T in AnyCaseNodeType]: MatcherExecutor<T> } =
  {
    [NUMBER_MATCHER_TYPE]: NumberMatcher,
    [STRING_MATCHER_TYPE]: StringMatcher,
    [BOOLEAN_MATCHER_TYPE]: BooleanMatcher,
    [CASCADING_EXACT_MATCHER_TYPE]: ExactCascadingContext,
    [NULL_MATCHER_TYPE]: NullMatcher,
  };
