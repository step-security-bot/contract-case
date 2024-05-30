package io.contract_testing.contractcase.client;

import io.contract_testing.contractcase.ContractCaseConfigurationError;
import io.contract_testing.contractcase.ContractCaseCoreError;
import io.contract_testing.contractcase.ContractCaseExpectationsNotMet;
import io.contract_testing.contractcase.edge.ConnectorFailure;
import io.contract_testing.contractcase.edge.ConnectorFailureKindConstants;
import io.contract_testing.contractcase.edge.ConnectorResult;
import io.contract_testing.contractcase.edge.ConnectorResultTypeConstants;

class RpcConnectorResultMapper {
  // Todo: Replace this class with the ConnectorResultMapper at the top level
  // Without exposing it to users

  static void map(ConnectorResult result) {
    final var resultType = result.getResultType();

    if (resultType.equals(ConnectorResultTypeConstants.RESULT_SUCCESS)) {
      return;
    }
    if (resultType.equals(ConnectorResultTypeConstants.RESULT_FAILURE)) {
      mapFailure((ConnectorFailure) result);
    }
  }

  private static void mapFailure(ConnectorFailure result) {
    String kind = result.getKind();

    if (kind.equals(ConnectorFailureKindConstants.CASE_BROKER_ERROR)
        || kind.equals(ConnectorFailureKindConstants.CASE_CONFIGURATION_ERROR)
        || kind.equals(ConnectorFailureKindConstants.CASE_TRIGGER_ERROR)) {
      throw new ContractCaseConfigurationError(result.getMessage(), result.getLocation());
    } else if (kind.equals(ConnectorFailureKindConstants.CASE_CORE_ERROR)) {
      throw new ContractCaseCoreError(result.getMessage(), result.getLocation());
    } else if (kind.equals(ConnectorFailureKindConstants.CASE_FAILED_ASSERTION_ERROR)
        || kind.equals(ConnectorFailureKindConstants.CASE_VERIFY_RETURN_ERROR)) {
      throw new ContractCaseExpectationsNotMet(result.getMessage(), result.getLocation());
    }

    throw new ContractCaseCoreError(
        "Unhandled error kind (" + kind + "): " + result.getMessage(),
        result.getLocation()
    );
  }


}
