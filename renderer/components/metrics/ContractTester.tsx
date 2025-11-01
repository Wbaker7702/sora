import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { Badge } from "components/ui/badge";
import { Progress } from "components/ui/progress";
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TestTube,
  Code,
  Database,
  Zap
} from "lucide-react";

interface TestCase {
  id: string;
  name: string;
  description: string;
  contractMethod: string;
  parameters: string;
  expectedResult: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  gasUsed?: number;
  actualResult?: string;
  error?: string;
}

interface MockData {
  id: string;
  name: string;
  type: string;
  value: string;
  description: string;
}

export default function ContractTester() {
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: "1",
      name: "Token Transfer Test",
      description: "Test basic token transfer functionality",
      contractMethod: "transfer",
      parameters: '{"from": "GALAXY...", "to": "STELLAR...", "amount": 1000}',
      expectedResult: "Success",
      status: 'pending'
    },
    {
      id: "2", 
      name: "Balance Query Test",
      description: "Test balance retrieval",
      contractMethod: "balance",
      parameters: '{"account": "GALAXY..."}',
      expectedResult: "1000",
      status: 'pending'
    },
    {
      id: "3",
      name: "Contract Deployment Test", 
      description: "Test contract deployment",
      contractMethod: "deploy",
      parameters: '{"wasm": "contract.wasm"}',
      expectedResult: "Contract deployed",
      status: 'pending'
    }
  ]);

  const [mockData, setMockData] = useState<MockData[]>([
    {
      id: "1",
      name: "Test Account 1",
      type: "Account",
      value: "GALAXY1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      description: "Primary test account with 1000 tokens"
    },
    {
      id: "2",
      name: "Test Account 2", 
      type: "Account",
      value: "STELLAR1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      description: "Secondary test account with 500 tokens"
    },
    {
      id: "3",
      name: "Test Amount",
      type: "Amount",
      value: "1000",
      description: "Standard test transfer amount"
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedTestCase, setSelectedTestCase] = useState<string | null>(null);

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      // Update test case to running
      setTestCases(prev => prev.map(tc => 
        tc.id === testCase.id 
          ? { ...tc, status: 'running' as const }
          : tc
      ));

      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate test result
      const isSuccess = Math.random() > 0.2; // 80% success rate
      const duration = Math.random() * 2 + 0.5;
      const gasUsed = Math.floor(Math.random() * 50000) + 10000;

      setTestCases(prev => prev.map(tc => 
        tc.id === testCase.id 
          ? { 
              ...tc, 
              status: isSuccess ? 'passed' : 'failed',
              duration,
              gasUsed,
              actualResult: isSuccess ? tc.expectedResult : "Error occurred",
              error: isSuccess ? undefined : "Mock error: Contract call failed"
            }
          : tc
      ));

      setProgress(((i + 1) / testCases.length) * 100);
    }

    setIsRunning(false);
  };

  const runSingleTest = async (testId: string) => {
    const testCase = testCases.find(tc => tc.id === testId);
    if (!testCase) return;

    setTestCases(prev => prev.map(tc => 
      tc.id === testId 
        ? { ...tc, status: 'running' as const }
        : tc
    ));

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isSuccess = Math.random() > 0.3;
    const duration = Math.random() * 1.5 + 0.3;
    const gasUsed = Math.floor(Math.random() * 30000) + 5000;

    setTestCases(prev => prev.map(tc => 
      tc.id === testId 
        ? { 
            ...tc, 
            status: isSuccess ? 'passed' : 'failed',
            duration,
            gasUsed,
            actualResult: isSuccess ? tc.expectedResult : "Error occurred",
            error: isSuccess ? undefined : "Mock error: Invalid parameters"
          }
        : tc
    ));
  };

  const generateMockData = () => {
    const newMockData: MockData = {
      id: Date.now().toString(),
      name: `Mock Data ${mockData.length + 1}`,
      type: "String",
      value: `mock_value_${Math.random().toString(36).substr(2, 9)}`,
      description: "Auto-generated mock data for testing"
    };
    setMockData(prev => [...prev, newMockData]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const passedTests = testCases.filter(tc => tc.status === 'passed').length;
  const totalTests = testCases.length;

  return (
    <div className="space-y-6">
      {/* Test Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>Test Suite Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{passedTests}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalTests - passedTests}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalTests}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
          
          {isRunning && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Running tests...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Run individual tests or execute the entire test suite
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Run All Tests</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={generateMockData}
              className="flex items-center space-x-2"
            >
              <Database className="h-4 w-4" />
              <span>Generate Mock Data</span>
            </Button>
            <Button 
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Code className="h-4 w-4" />
              <span>Export Results</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Cases</CardTitle>
            <CardDescription>
              Individual test cases and their execution status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testCases.map((testCase) => (
                <div 
                  key={testCase.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTestCase === testCase.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTestCase(
                    selectedTestCase === testCase.id ? null : testCase.id
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(testCase.status)}
                      <div>
                        <p className="font-medium">{testCase.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {testCase.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(testCase.status)}>
                        {testCase.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          runSingleTest(testCase.id);
                        }}
                        disabled={testCase.status === 'running'}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {testCase.duration && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Duration: {testCase.duration.toFixed(2)}s | 
                      Gas Used: {testCase.gasUsed?.toLocaleString()} units
                    </div>
                  )}
                  
                  {testCase.error && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      Error: {testCase.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mock Data */}
        <Card>
          <CardHeader>
            <CardTitle>Mock Data</CardTitle>
            <CardDescription>
              Generated test data for contract testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockData.map((data) => (
                <div key={data.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground">{data.description}</p>
                    </div>
                    <Badge variant="outline">{data.type}</Badge>
                  </div>
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">Value:</Label>
                    <Input 
                      value={data.value} 
                      readOnly 
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Details */}
      {selectedTestCase && (
        <Card>
          <CardHeader>
            <CardTitle>Test Case Details</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const testCase = testCases.find(tc => tc.id === selectedTestCase);
              if (!testCase) return null;
              
              return (
                <div className="space-y-4">
                  <div>
                    <Label>Contract Method</Label>
                    <Input value={testCase.contractMethod} readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label>Parameters</Label>
                    <Textarea 
                      value={testCase.parameters} 
                      readOnly 
                      className="mt-1 font-mono text-sm"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Expected Result</Label>
                    <Input value={testCase.expectedResult} readOnly className="mt-1" />
                  </div>
                  {testCase.actualResult && (
                    <div>
                      <Label>Actual Result</Label>
                      <Input value={testCase.actualResult} readOnly className="mt-1" />
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}