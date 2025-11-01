"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { ScrollArea } from "components/ui/scroll-area";
import { 
  EyeIcon, 
  DownloadIcon, 
  CopyIcon, 
  FileTextIcon,
  CodeIcon,
  CheckCircleIcon
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DocPreviewProps {
  content: string;
  onDownload: () => void;
  format: "markdown" | "html" | "pdf";
}

export default function DocPreview({ content, onDownload, format }: DocPreviewProps) {
  const [activeView, setActiveView] = useState<"preview" | "source">("preview");

  const copyContent = () => {
    navigator.clipboard.writeText(content);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "markdown": return <FileTextIcon className="h-4 w-4" />;
      case "html": return <CodeIcon className="h-4 w-4" />;
      case "pdf": return <FileTextIcon className="h-4 w-4" />;
      default: return <FileTextIcon className="h-4 w-4" />;
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case "markdown": return "bg-blue-500";
      case "html": return "bg-orange-500";
      case "pdf": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (!content) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Documentation Generated</h3>
          <p className="text-muted-foreground text-center">
            Generate documentation first to see the preview
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <EyeIcon className="h-5 w-5" />
                Documentation Preview
              </CardTitle>
              <CardDescription>
                Preview your generated documentation
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getFormatColor(format)} text-white`}>
                {getFormatIcon(format)}
                <span className="ml-1 uppercase">{format}</span>
              </Badge>
              <Button variant="outline" size="sm" onClick={copyContent}>
                <CopyIcon className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button size="sm" onClick={onDownload}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeView} onValueChange={(value: "preview" | "source") => setActiveView}>
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="source">Source</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <ScrollArea className="h-96 w-full border rounded-lg">
                <div className="p-6 prose prose-sm max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="source" className="mt-4">
              <ScrollArea className="h-96 w-full border rounded-lg">
                <div className="p-4">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {content}
                  </pre>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span>Documentation generated successfully</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}