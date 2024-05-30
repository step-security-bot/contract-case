package io.contract_testing.contractcase;

import io.contract_testing.contractcase.IndividualFailedTestConfig.IndividualFailedTestConfigBuilder;
import io.contract_testing.contractcase.case_example_mock_types.mocks.base.AnyMockDescriptor;
import io.contract_testing.contractcase.client.InternalDefinerClient;
import io.contract_testing.contractcase.client.server.ContractCaseProcess;
import org.jetbrains.annotations.NotNull;

public class ContractDefiner {

  private static final String TEST_RUN_ID = "JAVA";
  private final InternalDefinerClient definer;


  public ContractDefiner(final @NotNull ContractCaseConfig config) {
    ContractCaseProcess.getInstance().start();
    
    LogPrinter logPrinter = new LogPrinter();
    InternalDefinerClient definer = null;
    try {
      definer = new InternalDefinerClient(
          ConnectorConfigMapper.map(config, TEST_RUN_ID),
          logPrinter,
          new BoundaryVersionGenerator().getVersions()
      );
    } catch (Throwable e) {
      BoundaryCrashReporter.handleAndRethrow(e);
    }
    this.definer = definer;
  }

  public void endRecord() {
    ConnectorResultMapper.mapVoid(this.definer.endRecord());
  }

  public <T, M extends AnyMockDescriptor> void runExample(ExampleDefinition<M> definition,
      final @NotNull IndividualSuccessTestConfig<T> additionalConfig) {
    try {
      ConnectorResultMapper.mapVoid(definer.runExample(
          definition.toJSON(),
          ConnectorConfigMapper.mapSuccessExample(additionalConfig, TEST_RUN_ID)
      ));
    } catch (Throwable e) {
      BoundaryCrashReporter.handleAndRethrow(e);
    }
  }

  public <T, M extends AnyMockDescriptor> void runExample(ExampleDefinition<M> definition,
      final @NotNull IndividualSuccessTestConfig.IndividualSuccessTestConfigBuilder<T> additionalConfig) {
    this.runExample(definition, additionalConfig.build());
  }

  public <M extends AnyMockDescriptor> void runExample(ExampleDefinition<M> definition) {
    this.runExample(
        definition,
        IndividualSuccessTestConfig
            .IndividualSuccessTestConfigBuilder
            .builder()
            .build()
    );
  }

  public <T, M extends AnyMockDescriptor> void runThrowingExample(ExampleDefinition<M> definition,
      IndividualFailedTestConfig<T> additionalConfig) {
    try {
      ConnectorResultMapper.mapVoid(definer.runRejectingExample(
          definition.toJSON(),
          ConnectorConfigMapper.mapFailingExample(additionalConfig, TEST_RUN_ID)
      ));
    } catch (Throwable e) {
      BoundaryCrashReporter.handleAndRethrow(e);
    }
  }

  public <T, M extends AnyMockDescriptor> void runThrowingExample(ExampleDefinition<M> definition,
      IndividualFailedTestConfigBuilder<T> additionalConfig) {
    this.runThrowingExample(definition, additionalConfig.build());
  }

  public <M extends AnyMockDescriptor> void runThrowingExample(ExampleDefinition<M> definition) {
    this.runThrowingExample(
        definition,
        IndividualFailedTestConfig
            .IndividualFailedTestConfigBuilder
            .builder()
            .build()
    );
  }

}
