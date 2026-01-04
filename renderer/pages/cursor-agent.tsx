import React from "react";
import Head from "next/head";
import CursorAgent from "components/cursor-agent/CursorAgent";
import { trackEvent } from "@aptabase/electron/renderer";

function CursorAgentPage() {
  trackEvent("cursor-agent-page-viewed");

  return (
    <React.Fragment>
      <Head>
        <title>Cursor Agent - Soroban</title>
      </Head>
      <div className="h-screen">
        <CursorAgent />
      </div>
    </React.Fragment>
  );
}

export default CursorAgentPage;
