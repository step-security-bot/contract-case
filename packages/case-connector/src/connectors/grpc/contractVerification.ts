import { ServerDuplexStream } from '@grpc/grpc-js';

import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb.js';
import {
  VerificationRequest as WireVerificationRequest,
  ContractResponse as WireContractResponse,
  StartTestEvent as WireStartTestEvent,
} from '@contract-case/case-connector-proto';
import { UnreachableError } from './UnreachableError.js';
import {
  BoundaryFailure,
  BoundaryFailureKindConstants,
  BoundaryResult,
  BoundarySuccess,
  BoundarySuccessWithAny,
  IInvokeCoreTest,
} from '../../entities/types.js';
import { ConnectorError } from '../../domain/errors/ConnectorError.js';
import {
  availableContractDescriptions,
  beginVerification,
  runVerification,
} from '../../domain/verify.js';
import { maintainerLog } from '../../domain/maintainerLog.js';

import { mapConfig, mapResult } from './requestMappers/index.js';
import {
  makeResolvableId,
  resolveById,
  waitForResolution,
} from './promiseHandler/promiseHandler.js';
import { makeSendContractResponse } from './sendContractResponse.js';
import { makeLogPrinter, makeResultPrinter } from './printers.js';
import { makeResultResponse } from './responseMappers/index.js';
import { loadPlugin } from '../../domain/loadPlugin.js';

const getId = (request: WireVerificationRequest): string => {
  const id = request.getId();
  if (id === undefined) {
    throw new ConnectorError('Request had no id, but we were expecting one');
  }
  return id.getValue();
};

export const contractVerification = (
  call: ServerDuplexStream<WireVerificationRequest, WireContractResponse>,
): void => {
  const sendContractResponse = makeSendContractResponse(call);

  let verificationId: string | undefined;

  call.on('data', (request: WireVerificationRequest) => {
    maintainerLog('[RECEIVED]', JSON.stringify(request.toObject(), null, 2));
    const type = request.getKindCase();
    try {
      switch (type) {
        case WireVerificationRequest.KindCase.KIND_NOT_SET:
          throw new ConnectorError(
            `Verify contract was called with a request type it didn't understand (${type})`,
          );
        case WireVerificationRequest.KindCase.BEGIN_VERIFICATION:
          {
            const beginVerificationRequest = request.getBeginVerification();
            if (beginVerificationRequest == null) {
              throw new ConnectorError(
                'Begin definition was called with something that returned an undefined getBeginDefinition',
              );
            }

            try {
              verificationId = beginVerification(
                mapConfig(
                  beginVerificationRequest.getConfig(),
                  sendContractResponse,
                ),
                {
                  runTest: (testName: string, invoker: IInvokeCoreTest) => {
                    const invokerId = makeResolvableId(
                      async () => {},
                      (result: BoundaryResult): BoundaryResult => {
                        // TODO: Replace this with a nice 'isBoundarySuccessWithAny' function
                        if (result.resultType === 'SuccessAny') {
                          const id = `${
                            (result as BoundarySuccessWithAny).payload
                          }`;
                          invoker.verify().then((verificationResult) => {
                            sendContractResponse(
                              id,
                              makeResultResponse(verificationResult),
                            );
                          });
                        }
                        return result;
                      },
                    );

                    return waitForResolution(
                      makeResolvableId((id: string) =>
                        sendContractResponse(
                          id,
                          new WireContractResponse().setStartTestEvent(
                            new WireStartTestEvent()
                              .setTestName(new StringValue().setValue(testName))
                              .setInvokerId(
                                new StringValue().setValue(invokerId),
                              ),
                          ),
                        ),
                      ),
                    );
                  },
                },
                makeLogPrinter(sendContractResponse),
                makeResultPrinter(sendContractResponse),
                beginVerificationRequest
                  .getCallerVersionsList()
                  .map((s) =>
                    s != null ? s.getValue() : 'missing-version-value',
                  ),
              );
            } catch (e) {
              sendContractResponse(
                getId(request),
                makeResultResponse(
                  new BoundaryFailure(
                    BoundaryFailureKindConstants.CASE_CORE_ERROR,
                    `Unable to create verifier: ${(e as Error).message}`,
                    'ContractCase Connector',
                  ),
                ),
              );
              return;
            }

            sendContractResponse(
              getId(request),
              makeResultResponse(new BoundarySuccess()),
            );
          }
          break;
        case WireVerificationRequest.KindCase.AVAILABLE_CONTRACT_DEFINITIONS: {
          if (verificationId === undefined) {
            throw new ConnectorError(
              'availableContractDefinitions was called before beginVerification',
            );
          }

          availableContractDescriptions(verificationId).then((result) =>
            sendContractResponse(getId(request), makeResultResponse(result)),
          );
          break;
        }
        case WireVerificationRequest.KindCase.RUN_VERIFICATION: {
          const runVerificationRequest = request.getRunVerification();
          if (runVerificationRequest == null) {
            throw new ConnectorError(
              'run rejecting example called with something that returned an undefined request',
            );
          }
          if (verificationId === undefined) {
            throw new ConnectorError(
              'runVerification was called before beginVerification',
            );
          }

          runVerification(
            verificationId,
            mapConfig(runVerificationRequest.getConfig(), sendContractResponse),
          ).then((result) =>
            sendContractResponse(getId(request), makeResultResponse(result)),
          );
          break;
        }
        case WireVerificationRequest.KindCase.RESULT_RESPONSE:
          {
            const resultPrinterResponse = request.getResultResponse();
            if (resultPrinterResponse == null) {
              throw new ConnectorError(
                'Result response was called with an undefined request',
              );
            }

            resolveById(
              getId(request),
              mapResult(resultPrinterResponse.getResult()),
            );
          }
          break;
        case WireVerificationRequest.KindCase.INVOKE_TEST:
          {
            const invokeTestResponse = request.getInvokeTest();
            if (invokeTestResponse == null) {
              throw new ConnectorError(
                'Invoke test was called with an undefined invokeTest',
              );
            }
            const wrappedInvokerId = invokeTestResponse.getInvokerId();
            if (wrappedInvokerId == null) {
              throw new ConnectorError(
                'Invoke test was called with an undefined invoker ID',
              );
            }

            const id = request.getId()?.getValue();
            resolveById(
              wrappedInvokerId.getValue(),
              new BoundarySuccessWithAny(
                JSON.stringify(id != null ? id : null),
              ),
            );

            //     sendContractResponse(getId(request), makeResultResponse(result));
          }
          break;
        case WireVerificationRequest.KindCase.LOAD_PLUGIN:
          {
            const loadPluginRequest = request.getLoadPlugin();
            if (loadPluginRequest == null) {
              throw new ConnectorError(
                'loadPlugin called with something that returned an undefined request',
              );
            }

            loadPlugin(
              mapConfig(loadPluginRequest.getConfig(), sendContractResponse),
              makeLogPrinter(sendContractResponse),
              makeResultPrinter(sendContractResponse),
              loadPluginRequest
                .getCallerVersionsList()
                .map((s) =>
                  s != null ? s.getValue() : 'missing-version-value',
                ),
              loadPluginRequest.getModuleNamesList().map((s, index) => {
                if (s == null) {
                  throw new ConnectorError(
                    `loadPlugin called with a null module name at position '${index}'`,
                  );
                }
                return s.getValue();
              }),
            ).then((result) =>
              sendContractResponse(getId(request), makeResultResponse(result)),
            );
          }
          break;
        default:
          throw new UnreachableError(type);
      }
    } catch (e) {
      sendContractResponse(
        request.getId()?.getValue() || '',
        makeResultResponse(
          new BoundaryFailure(
            BoundaryFailureKindConstants.CASE_CORE_ERROR,
            `[${(e as Error).name}] ${(e as Error).message}`,
            (e as Error).stack ?? 'ContractCase Connector',
          ),
        ),
      );
    }
  });
  call.on('end', () => {
    call.end();
  });
};
