import React from "react";
import Head from "next/head";
import ContractDetail from "components/contracts/contract-detail";
import { trackEvent } from "@aptabase/electron/renderer";

function ContractDetailPage() {
  trackEvent("contract-detail-page-viewed");

  return (
    <React.Fragment>
      <Head>
        <title>Contract Actions - Sora</title>
      </Head>
      <ContractDetail />
    </React.Fragment>
  );
}

export default ContractDetailPage;
