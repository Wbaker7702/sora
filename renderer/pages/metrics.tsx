import React from "react";
import Head from "next/head";
import MetricsDashboard from "components/metrics/MetricsDashboard";
import { trackEvent } from "@aptabase/electron/renderer";

function Metrics() {
  trackEvent("metrics-page-viewed");

  return (
    <React.Fragment>
      <Head>
        <title>Contract Metrics - Soroban</title>
      </Head>
      <div className="h-screen">
        <MetricsDashboard />
      </div>
    </React.Fragment>
  );
}

export default Metrics;
