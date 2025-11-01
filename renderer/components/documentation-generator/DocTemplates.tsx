"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { 
  FileTextIcon, 
  CodeIcon, 
  DownloadIcon, 
  EyeIcon,
  StarIcon,
  ClockIcon,
  UsersIcon
} from "lucide-react";

interface DocTemplate {
  id: string;
  name: string;
  description: string;
  category: "basic" | "advanced" | "enterprise";
  format: "markdown" | "html" | "pdf";
  features: string[];
  popularity: number;
  lastUpdated: string;
  author: string;
  preview: string;
}

const templates: DocTemplate[] = [
  {
    id: "minimal",
    name: "Minimal Template",
    description: "Clean and simple documentation template with essential sections",
    category: "basic",
    format: "markdown",
    features: ["API Reference", "Basic Examples", "Installation Guide"],
    popularity: 85,
    lastUpdated: "2024-01-10",
    author: "Sora Team",
    preview: `# Contract Name

Brief description of your contract.

## Installation
\`\`\`bash
# Installation instructions
\`\`\`

## API Reference
### Functions
- \`function_name()\` - Description

## Examples
\`\`\`rust
// Usage example
\`\`\`
`
  },
  {
    id: "comprehensive",
    name: "Comprehensive Template",
    description: "Full-featured template with all documentation sections",
    category: "advanced",
    format: "markdown",
    features: ["API Reference", "Examples", "Architecture", "Testing", "Deployment", "Troubleshooting"],
    popularity: 92,
    lastUpdated: "2024-01-15",
    author: "Sora Team",
    preview: `# Contract Name

Comprehensive documentation for your Soroban contract.

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Architecture](#architecture)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview
Detailed overview of the contract...

## Installation
\`\`\`bash
# Detailed installation steps
\`\`\`

## API Reference
### Functions
Detailed function documentation...

## Examples
Comprehensive usage examples...

## Architecture
System architecture diagrams and explanations...

## Testing
Testing strategies and examples...

## Deployment
Deployment instructions and considerations...

## Troubleshooting
Common issues and solutions...
`
  },
  {
    id: "enterprise",
    name: "Enterprise Template",
    description: "Professional template designed for enterprise contracts",
    category: "enterprise",
    format: "html",
    features: ["API Reference", "Examples", "Security", "Compliance", "Performance", "Monitoring"],
    popularity: 78,
    lastUpdated: "2024-01-12",
    author: "Sora Team",
    preview: `# Enterprise Contract Documentation

Professional documentation template for enterprise-grade contracts.

## Security Considerations
- Security best practices
- Vulnerability assessments
- Audit recommendations

## Compliance
- Regulatory compliance information
- Standards adherence
- Certification details

## Performance
- Performance benchmarks
- Optimization guidelines
- Monitoring recommendations

## API Reference
Comprehensive API documentation...

## Examples
Enterprise usage patterns...

## Monitoring
Observability and monitoring setup...
`
  }
];

export default function DocTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredTemplates = templates.filter(template => 
    activeCategory === "all" || template.category === activeCategory
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "basic": return "bg-green-500";
      case "advanced": return "bg-blue-500";
      case "enterprise": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "markdown": return <FileTextIcon className="h-4 w-4" />;
      case "html": return <CodeIcon className="h-4 w-4" />;
      case "pdf": return <FileTextIcon className="h-4 w-4" />;
      default: return <FileTextIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documentation Templates</h2>
          <p className="text-muted-foreground">
            Choose from pre-built templates for your contract documentation
          </p>
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getFormatIcon(template.format)}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <Badge className={`${getCategoryColor(template.category)} text-white`}>
                      {template.category}
                    </Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-3 w-3" />
                        <span>{template.popularity}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        <span>{template.lastUpdated}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                        }}
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement template selection
                        }}
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedTemplate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getFormatIcon(selectedTemplate.format)}
                  {selectedTemplate.name} Preview
                </CardTitle>
                <CardDescription>
                  {selectedTemplate.description}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Full Preview
                </Button>
                <Button>
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Use This Template
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted/50">
              <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {selectedTemplate.preview}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}