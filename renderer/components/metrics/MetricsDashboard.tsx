import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Separator } from "components/ui/separator";
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  Smartphone, 
  QrCode, 
  TestTube,
  BarChart3,
  Network,
  Clock,
  DollarSign,
  Users,
  Database,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";

// Real-time metrics data types
interface ContractMetrics {
  contractId: string;
  name: string;
  network: string;
  totalTransactions: number;
  activeUsers: number;
  gasUsed: number;
  lastActivity: Date;
  successRate: number;
  avgResponseTime: number;
}

interface TestResult {
  id: string;
  testName: string;
  status: 'passed' | 'failed' | 'running';
  duration: number;
  gasUsed: number;
  timestamp: Date;
}

interface MobileIntegration {
  qrCode: string;
  deepLink: string;
  walletConnected: boolean;
  lastSync: Date;
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<ContractMetrics[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [mobileIntegration, setMobileIntegration] = useState<MobileIntegration | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState("");

  // Mock data for demonstration
  useEffect(() => {
    const mockMetrics: ContractMetrics[] = [
      {
        contractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHH",
        name: "Token Contract",
        network: "testnet",
        totalTransactions: 1247,
        activeUsers: 89,
        gasUsed: 4567890,
        lastActivity: new Date(),
        successRate: 98.5,
        avgResponseTime: 1.2
      },
      {
        contractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHH",
        name: "NFT Marketplace",
        network: "mainnet",
        totalTransactions: 3421,
        activeUsers: 156,
        gasUsed: 8923456,
        lastActivity: new Date(Date.now() - 300000),
        successRate: 99.1,
        avgResponseTime: 0.8
      }
    ];

    const mockTestResults: TestResult[] = [
      {
        id: "1",
        testName: "Token Transfer Test",
        status: 'passed',
        duration: 1.2,
        gasUsed: 45000,
        timestamp: new Date()
      },
      {
        id: "2", 
        testName: "Contract Deployment Test",
        status: 'running',
        duration: 0,
        gasUsed: 0,
        timestamp: new Date()
      },
      {
        id: "3",
        testName: "Event Emission Test",
        status: 'failed',
        duration: 0.8,
        gasUsed: 23000,
        timestamp: new Date(Date.now() - 60000)
      }
    ];

    setMetrics(mockMetrics);
    setTestResults(mockTestResults);

    // Generate QR code for mobile integration
    setMobileIntegration({
      qrCode: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIj5Tb3JhIENvbnRyYWN0PC90ZXh0Pjwvc3ZnPg==",
      deepLink: "sora://contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHH",
      walletConnected: false,
      lastSync: new Date()
    });
  }, []);

  // Real-time updates simulation
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        totalTransactions: metric.totalTransactions + Math.floor(Math.random() * 3),
        gasUsed: metric.gasUsed + Math.floor(Math.random() * 1000),
        lastActivity: new Date(),
        successRate: Math.min(100, metric.successRate + (Math.random() - 0.5) * 0.1)
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatGas = (gas: number) => {
    return gas.toLocaleString() + ' units';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contract Metrics</h1>
          <p className="text-muted-foreground">
            Real-time analytics, testing suite, and mobile integration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={isRealTimeEnabled ? "default" : "outline"}
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            className="flex items-center space-x-2"
          >
            {isRealTimeEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRealTimeEnabled ? "Pause" : "Resume"} Real-time
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Contract Address Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Contract Address</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter contract address (e.g., CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHH)"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="flex-1"
            />
            <Button>Load Metrics</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center space-x-2">
            <TestTube className="h-4 w-4" />
            <span>Testing Suite</span>
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4" />
            <span>Mobile Integration</span>
          </TabsTrigger>
          <TabsTrigger value="visualizer" className="flex items-center space-x-2">
            <Network className="h-4 w-4" />
            <span>Contract Visualizer</span>
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <Card key={metric.contractId} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                    <Badge variant="outline">{metric.network}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Transactions</span>
                      <span className="font-medium">{formatNumber(metric.totalTransactions)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Active Users</span>
                      <span className="font-medium">{metric.activeUsers}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Gas Used</span>
                      <span className="font-medium">{formatGas(metric.gasUsed)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium text-green-600">{metric.successRate}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Avg Response</span>
                      <span className="font-medium">{metric.avgResponseTime}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Real-time Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Real-time Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.map((metric) => (
                  <div key={metric.contractId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium">{metric.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last activity: {metric.lastActivity.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">+{Math.floor(Math.random() * 5)} transactions</p>
                      <p className="text-xs text-muted-foreground">in the last minute</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Suite Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube className="h-5 w-5" />
                <span>Smart Contract Testing Suite</span>
              </CardTitle>
              <CardDescription>
                Run comprehensive tests on your Soroban contracts with mock data generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button className="flex items-center space-x-2">
                    <Play className="h-4 w-4" />
                    <span>Run All Tests</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <TestTube className="h-4 w-4" />
                    <span>Generate Mock Data</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Coverage Report</span>
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Test Results</h4>
                  {testResults.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(test.status)}`}></div>
                        <div>
                          <p className="font-medium">{test.testName}</p>
                          <p className="text-sm text-muted-foreground">
                            {test.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {test.status === 'running' ? 'Running...' : `${test.duration}s`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {test.gasUsed > 0 ? `${formatGas(test.gasUsed)}` : 'Pending'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mobile Integration Tab */}
        <TabsContent value="mobile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Mobile Integration</span>
              </CardTitle>
              <CardDescription>
                Connect your mobile wallet and generate QR codes for contract interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-medium mb-2">Contract QR Code</h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <img 
                        src={mobileIntegration?.qrCode} 
                        alt="Contract QR Code" 
                        className="mx-auto w-32 h-32"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Scan with your mobile wallet
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Deep Link</Label>
                    <Input 
                      value={mobileIntegration?.deepLink || ''} 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button variant="outline" size="sm" className="w-full">
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate New QR
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Wallet Connection</h4>
                    <Badge variant={mobileIntegration?.walletConnected ? "default" : "secondary"}>
                      {mobileIntegration?.walletConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Last Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      {mobileIntegration?.lastSync.toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full" disabled={mobileIntegration?.walletConnected}>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Connect Mobile Wallet
                    </Button>
                    <Button variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Data
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contract Visualizer Tab */}
        <TabsContent value="visualizer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5" />
                <span>Contract Visualizer</span>
              </CardTitle>
              <CardDescription>
                Visual representation of contract structure and function call flows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Contract Structure</h4>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium">Token Contract</span>
                        </div>
                        <div className="ml-4 space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs">transfer()</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs">balance()</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs">mint()</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Function Call Flow</h4>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">1</span>
                          </div>
                          <span className="text-sm">User calls transfer()</span>
                        </div>
                        <div className="ml-4 w-px h-4 bg-gray-300"></div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">2</span>
                          </div>
                          <span className="text-sm">Contract validates input</span>
                        </div>
                        <div className="ml-4 w-px h-4 bg-gray-300"></div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">3</span>
                          </div>
                          <span className="text-sm">Updates balances</span>
                        </div>
                        <div className="ml-4 w-px h-4 bg-gray-300"></div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">4</span>
                          </div>
                          <span className="text-sm">Emits Transfer event</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">State Transitions</h4>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Database className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium">Initial State</p>
                        <p className="text-xs text-muted-foreground">Balance: 0</p>
                      </div>
                      <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-sm font-medium">After Mint</p>
                        <p className="text-xs text-muted-foreground">Balance: 1000</p>
                      </div>
                      <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Zap className="h-6 w-6 text-yellow-600" />
                        </div>
                        <p className="text-sm font-medium">After Transfer</p>
                        <p className="text-xs text-muted-foreground">Balance: 500</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}