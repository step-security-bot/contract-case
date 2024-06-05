import { AnyCaseMatcherOrData } from '@contract-case/case-plugin-base';
import { state } from '../../entities/states';
import type { AnyState } from '../../entities/types';

export const inState = (
  name: string,
  variables?: Record<string, AnyCaseMatcherOrData>,
): AnyState => state(name, variables);
