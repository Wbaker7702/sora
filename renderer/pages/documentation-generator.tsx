import React from "react";
import Head from "next/head";
import DocumentationGeneratorComponent from "components/documentation-generator/DocumentationGenerator";
import { trackEvent } from "@aptabase/electron/renderer";

function DocumentationGenerator() {
  trackEvent("documentation-generator-page-viewed");

  return (
    <React.Fragment>
      <Head>
        <title>Documentation Generator - Sora</title>
      </Head>
      <DocumentationGeneratorComponent />
    </React.Fragment>
  );
}

export default DocumentationGenerator;