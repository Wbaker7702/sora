import React from "react";
import Head from "next/head";
import NasacoinCoreComponent from "components/nasacoin-core/NasacoinCore";
import { trackEvent } from "@aptabase/electron/renderer";

function NasacoinCore() {
  trackEvent("nasacoin-core-page-viewed");

  return (
    <React.Fragment>
      <Head>
        <title>Nasacoin Core - Sora</title>
      </Head>
      <NasacoinCoreComponent />
    </React.Fragment>
  );
}

export default NasacoinCore;
