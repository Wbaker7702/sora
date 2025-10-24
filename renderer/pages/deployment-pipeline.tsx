import React from "react";
import Head from "next/head";
import DeploymentPipelineComponent from "components/deployment-pipeline/DeploymentPipeline";
import { trackEvent } from "@aptabase/electron/renderer";

function DeploymentPipeline() {
  trackEvent("deployment-pipeline-page-viewed");

  return (
    <React.Fragment>
      <Head>
        <title>Deployment Pipeline - Sora</title>
      </Head>
      <DeploymentPipelineComponent />
    </React.Fragment>
  );
}

export default DeploymentPipeline;