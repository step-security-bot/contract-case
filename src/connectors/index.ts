import type { SetupFns } from 'core/types';
import {
  PRODUCE_HTTP_RESPONSE,
  CONSUME_HTTP_RESPONSE,
} from 'entities/nodes/interactions/types';
import { setupHttpResponseProducer } from './produceHttpResponse';
import { setupHttpResponseConsumer } from './consumeHttpResponse';

export const SetupFunctions: SetupFns = {
  [PRODUCE_HTTP_RESPONSE]: setupHttpResponseConsumer,
  [CONSUME_HTTP_RESPONSE]: setupHttpResponseProducer,
};
