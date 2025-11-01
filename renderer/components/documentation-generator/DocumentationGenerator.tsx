"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { Switch } from "components/ui/switch";
import { Alert, AlertDescription } from "components/ui/alert";
import { 
  FileTextIcon, 
  CodeIcon, 
  DownloadIcon, 
  EyeIcon, 
  SettingsIcon,
  BookOpenIcon,
  ZapIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoIcon
} from "lucide-react";
import ContractAnalyzer from "./ContractAnalyzer";
import DocPreview from "./DocPreview";
import DocTemplates from "./DocTemplates";

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

interface DocConfig {
  format: "markdown" | "html" | "pdf";
  template: "default" | "minimal" | "comprehensive";
  includeExamples: boolean;
  includeDiagrams: boolean;
  includeApiReference: boolean;
  includeChangelog: boolean;
  theme: "light" | "dark" | "auto";
  outputPath: string;
}

const mockContractInfo: ContractInfo = {
  name: "TokenContract",
  description: "A simple ERC-20 like token contract for the Soroban platform",
  version: "1.0.0",
  author: "Sora Team",
  functions: [
    {
      name: "initialize",
      description: "Initialize the token contract with name, symbol, and decimals",
      parameters: [
        { name: "admin", type: "Address", description: "The admin address" },
        { name: "name", type: "String", description: "Token name" },
        { name: "symbol", type: "String", description: "Token symbol" },
        { name: "decimals", type: "u32", description: "Number of decimals" }
      ],
      visibility: "public"
    },
    {
      name: "mint",
      description: "Mint new tokens to the specified address",
      parameters: [
        { name: "to", type: "Address", description: "Address to mint tokens to" },
        { name: "amount", type: "i128", description: "Amount of tokens to mint" }
      ],
      visibility: "public"
    },
    {
      name: "transfer",
      description: "Transfer tokens from one address to another",
      parameters: [
        { name: "from", type: "Address", description: "Address to transfer from" },
        { name: "to", type: "Address", description: "Address to transfer to" },
        { name: "amount", type: "i128", description: "Amount of tokens to transfer" }
      ],
      returnType: "bool",
      visibility: "public"
    },
    {
      name: "balance",
      description: "Get the token balance of an address",
      parameters: [
        { name: "address", type: "Address", description: "Address to check balance for" }
      ],
      returnType: "i128",
      visibility: "public"
    }
  ],
  events: [
    {
      name: "Transfer",
      description: "Emitted when tokens are transferred",
      parameters: [
        { name: "from", type: "Address", indexed: true },
        { name: "to", type: "Address", indexed: true },
        { name: "amount", type: "i128", indexed: false }
      ]
    },
    {
      name: "Mint",
      description: "Emitted when new tokens are minted",
      parameters: [
        { name: "to", type: "Address", indexed: true },
        { name: "amount", type: "i128", indexed: false }
      ]
    }
  ],
  errors: [
    {
      name: "InsufficientBalance",
      description: "Insufficient balance for the operation",
      code: "INSUFFICIENT_BALANCE"
    },
    {
      name: "Unauthorized",
      description: "Caller is not authorized for this operation",
      code: "UNAUTHORIZED"
    }
  ]
};

export default function DocumentationGeneratorComponent() {
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [docConfig, setDocConfig] = useState<DocConfig>({
    format: "markdown",
    template: "default",
    includeExamples: true,
    includeDiagrams: true,
    includeApiReference: true,
    includeChangelog: false,
    theme: "auto",
    outputPath: "./docs"
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<string>("");
  const [activeTab, setActiveTab] = useState("analyze");

  const analyzeContract = async (contractPath: string) => {
    setIsGenerating(true);
    try {
      // Simulate contract analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      setContractInfo(mockContractInfo);
    } catch (error) {
      console.error("Error analyzing contract:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDocumentation = async () => {
    if (!contractInfo) return;
    
    setIsGenerating(true);
    try {
      // Simulate documentation generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const doc = generateMarkdownDoc(contractInfo, docConfig);
      setGeneratedDoc(doc);
      setActiveTab("preview");
    } catch (error) {
      console.error("Error generating documentation:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMarkdownDoc = (contract: ContractInfo, config: DocConfig): string => {
    let doc = `# ${contract.name}\n\n`;
    doc += `${contract.description}\n\n`;
    doc += `**Version:** ${contract.version}  \n`;
    doc += `**Author:** ${contract.author}\n\n`;
    
    if (config.includeApiReference) {
      doc += `## API Reference\n\n`;
      
      doc += `### Functions\n\n`;
      contract.functions.forEach(func => {
        doc += `#### \`${func.name}\`\n\n`;
        doc += `${func.description}\n\n`;
        
        if (func.parameters.length > 0) {
          doc += `**Parameters:**\n`;
          func.parameters.forEach(param => {
            doc += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
          });
          doc += `\n`;
        }
        
        if (func.returnType) {
          doc += `**Returns:** \`${func.returnType}\`\n\n`;
        }
      });
      
      if (contract.events.length > 0) {
        doc += `### Events\n\n`;
        contract.events.forEach(event => {
          doc += `#### \`${event.name}\`\n\n`;
          doc += `${event.description}\n\n`;
          if (event.parameters.length > 0) {
            doc += `**Parameters:**\n`;
            event.parameters.forEach(param => {
              doc += `- \`${param.name}\` (${param.type})${param.indexed ? ' (indexed)' : ''}\n`;
            });
            doc += `\n`;
          }
        });
      }
      
      if (contract.errors.length > 0) {
        doc += `### Errors\n\n`;
        contract.errors.forEach(error => {
          doc += `#### \`${error.name}\`\n\n`;
          doc += `**Code:** \`${error.code}\`  \n`;
          doc += `${error.description}\n\n`;
        });
      }
    }
    
    if (config.includeExamples) {
      doc += `## Examples\n\n`;
      doc += `### Basic Usage\n\n`;
      doc += `\`\`\`rust\n`;
      doc += `// Initialize the contract\n`;
      doc += `token.initialize(admin, "MyToken", "MTK", 7);\n\n`;
      doc += `// Mint tokens\n`;
      doc += `token.mint(user_address, 1000);\n\n`;
      doc += `// Transfer tokens\n`;
      doc += `token.transfer(from_address, to_address, 100);\n`;
      doc += `\`\`\`\n\n`;
    }
    
    return doc;
  };

  const downloadDocumentation = () => {
    if (!generatedDoc) return;
    
    const blob = new Blob([generatedDoc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contractInfo?.name || 'contract'}-documentation.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentation Generator</h1>
          <p className="text-muted-foreground">
            Automatically generate comprehensive documentation for your Soroban contracts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Templates
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="analyze">Contract Analysis</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-4">
          <ContractAnalyzer 
            onAnalyze={analyzeContract}
            isAnalyzing={isGenerating}
            contractInfo={contractInfo}
          />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentation Configuration</CardTitle>
              <CardDescription>
                Configure the format and content of your generated documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Output Format</Label>
                  <Select
                    value={docConfig.format}
                    onValueChange={(value: "markdown" | "html" | "pdf") =>
                      setDocConfig(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={docConfig.template}
                    onValueChange={(value: "default" | "minimal" | "comprehensive") =>
                      setDocConfig(prev => ({ ...prev, template: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outputPath">Output Path</Label>
                <Input
                  id="outputPath"
                  value={docConfig.outputPath}
                  onChange={(e) => setDocConfig(prev => ({ ...prev, outputPath: e.target.value }))}
                  placeholder="./docs"
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Content Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="includeExamples">Include Code Examples</Label>
                      <p className="text-sm text-muted-foreground">
                        Add practical usage examples
                      </p>
                    </div>
                    <Switch
                      id="includeExamples"
                      checked={docConfig.includeExamples}
                      onCheckedChange={(checked) =>
                        setDocConfig(prev => ({ ...prev, includeExamples: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="includeDiagrams">Include Diagrams</Label>
                      <p className="text-sm text-muted-foreground">
                        Generate flowcharts and architecture diagrams
                      </p>
                    </div>
                    <Switch
                      id="includeDiagrams"
                      checked={docConfig.includeDiagrams}
                      onCheckedChange={(checked) =>
                        setDocConfig(prev => ({ ...prev, includeDiagrams: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="includeApiReference">Include API Reference</Label>
                      <p className="text-sm text-muted-foreground">
                        Generate detailed function and event documentation
                      </p>
                    </div>
                    <Switch
                      id="includeApiReference"
                      checked={docConfig.includeApiReference}
                      onCheckedChange={(checked) =>
                        setDocConfig(prev => ({ ...prev, includeApiReference: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="includeChangelog">Include Changelog</Label>
                      <p className="text-sm text-muted-foreground">
                        Add version history and changes
                      </p>
                    </div>
                    <Switch
                      id="includeChangelog"
                      checked={docConfig.includeChangelog}
                      onCheckedChange={(checked) =>
                        setDocConfig(prev => ({ ...prev, includeChangelog: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={generateDocumentation}
                  disabled={!contractInfo || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <ZapIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      Generate Documentation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <DocPreview 
            content={generatedDoc}
            onDownload={downloadDocumentation}
            format={docConfig.format}
          />
        </TabsContent>

        <TabsContent value="templates">
          <DocTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
}