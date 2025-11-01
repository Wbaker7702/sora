"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { Badge } from "components/ui/badge";
import { Alert, AlertDescription } from "components/ui/alert";
import { Progress } from "components/ui/progress";
import { 
  FileTextIcon, 
  CodeIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon,
  InfoIcon,
  UploadIcon,
  FolderOpenIcon,
  ZapIcon
} from "lucide-react";

interface ContractInfo {
  name: string;
  description: string;
  version: string;
  author: string;
  functions: Array<{
    name: string;
    description: string;
    parameters: Array<{
      name: string;
      type: string;
      description: string;
    }>;
    returnType?: string;
    visibility: "public" | "private" | "internal";
  }>;
  events: Array<{
    name: string;
    description: string;
    parameters: Array<{
      name: string;
      type: string;
      indexed: boolean;
    }>;
  }>;
  errors: Array<{
    name: string;
    description: string;
    code: string;
  }>;
}

interface ContractAnalyzerProps {
  onAnalyze: (contractPath: string) => Promise<void>;
  isAnalyzing: boolean;
  contractInfo: ContractInfo | null;
}

export default function ContractAnalyzer({ onAnalyze, isAnalyzing, contractInfo }: ContractAnalyzerProps) {
  const [contractPath, setContractPath] = useState("");
  const [contractCode, setContractCode] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const analysisSteps = [
    "Reading contract file...",
    "Parsing Rust code...",
    "Extracting function signatures...",
    "Analyzing parameters and types...",
    "Identifying events and errors...",
    "Generating metadata...",
    "Analysis complete!"
  ];

  const handleAnalyze = async () => {
    if (!contractPath && !contractCode) {
      return;
    }

    setAnalysisStep(0);
    setAnalysisProgress(0);

    // Simulate analysis progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev >= analysisSteps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 300);

    await onAnalyze(contractPath || "contract.rs");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContractCode(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CodeIcon className="h-5 w-5" />
            Contract Analysis
          </CardTitle>
          <CardDescription>
            Upload or specify the path to your Soroban contract for automatic documentation generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contractPath">Contract File Path</Label>
                <Input
                  id="contractPath"
                  value={contractPath}
                  onChange={(e) => setContractPath(e.target.value)}
                  placeholder="/path/to/your/contract.rs"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the path to your contract file
                </p>
              </div>

              <div className="space-y-2">
                <Label>Or Upload Contract File</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <UploadIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your contract file here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".rs"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Choose File
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contractCode">Contract Code (Optional)</Label>
                <Textarea
                  id="contractCode"
                  value={contractCode}
                  onChange={(e) => setContractCode(e.target.value)}
                  placeholder="Paste your contract code here..."
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Paste your contract code directly for analysis
                </p>
              </div>
            </div>
          </div>

          {isAnalyzing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ZapIcon className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Analyzing Contract...</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{analysisSteps[analysisStep]}</span>
                      <span>{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!contractPath && !contractCode)}
            >
              {isAnalyzing ? (
                <>
                  <ZapIcon className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <CodeIcon className="h-4 w-4 mr-2" />
                  Analyze Contract
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {contractInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              Analysis Complete
            </CardTitle>
            <CardDescription>
              Contract successfully analyzed and ready for documentation generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {contractInfo.functions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Functions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {contractInfo.events.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {contractInfo.errors.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {contractInfo.version}
                  </div>
                  <div className="text-sm text-muted-foreground">Version</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Contract Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {contractInfo.name}
                  </div>
                  <div>
                    <span className="font-medium">Author:</span> {contractInfo.author}
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">Description:</span> {contractInfo.description}
                  </div>
                </div>
              </div>

              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Contract analysis complete! You can now configure and generate documentation.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}