import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Badge } from "components/ui/badge";
import { Switch } from "components/ui/switch";
import { 
  Smartphone, 
  QrCode, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Download,
  Share,
  Copy,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface WalletConnection {
  id: string;
  name: string;
  type: 'mobile' | 'browser' | 'hardware';
  connected: boolean;
  lastSync: Date;
  address?: string;
}

interface QRCodeData {
  contractAddress: string;
  action: string;
  parameters: Record<string, any>;
  timestamp: number;
  expiresAt: number;
}

export default function MobileIntegration() {
  const [wallets, setWallets] = useState<WalletConnection[]>([
    {
      id: "1",
      name: "Freighter Mobile",
      type: 'mobile',
      connected: false,
      lastSync: new Date()
    },
    {
      id: "2", 
      name: "Lobstr Wallet",
      type: 'mobile',
      connected: false,
      lastSync: new Date()
    },
    {
      id: "3",
      name: "Browser Extension",
      type: 'browser',
      connected: true,
      lastSync: new Date(),
      address: "GALAXY1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    }
  ]);

  const [qrCodeData, setQrCodeData] = useState<QRCodeData>({
    contractAddress: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHH",
    action: "transfer",
    parameters: {
      from: "GALAXY1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      to: "STELLAR1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 
      amount: 1000
    },
    timestamp: Date.now(),
    expiresAt: Date.now() + 300000 // 5 minutes
  });

  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [deepLink, setDeepLink] = useState<string>("");
  const [autoSync, setAutoSync] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Generate QR code
  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    
    // Simulate QR code generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a simple SVG QR code (in real implementation, use a QR library)
    const qrSvg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <rect x="20" y="20" width="160" height="160" fill="black"/>
        <rect x="40" y="40" width="120" height="120" fill="white"/>
        <rect x="60" y="60" width="80" height="80" fill="black"/>
        <rect x="80" y="80" width="40" height="40" fill="white"/>
        <text x="100" y="190" text-anchor="middle" font-family="monospace" font-size="8" fill="black">
          Sora Contract
        </text>
      </svg>
    `;
    
    const qrDataUrl = `data:image/svg+xml;base64,${btoa(qrSvg)}`;
    setQrCodeImage(qrDataUrl);
    
    // Generate deep link
    const deepLinkUrl = `sora://contract/${qrCodeData.contractAddress}?action=${qrCodeData.action}&params=${encodeURIComponent(JSON.stringify(qrCodeData.parameters))}`;
    setDeepLink(deepLinkUrl);
    
    setIsGeneratingQR(false);
  };

  // Connect wallet
  const connectWallet = async (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) return;

    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setWallets(prev => prev.map(w => 
      w.id === walletId 
        ? { 
            ...w, 
            connected: true, 
            lastSync: new Date(),
            address: `WALLET_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          }
        : w
    ));
  };

  // Disconnect wallet
  const disconnectWallet = (walletId: string) => {
    setWallets(prev => prev.map(w => 
      w.id === walletId 
        ? { ...w, connected: false, address: undefined }
        : w
    ));
  };

  // Sync data
  const syncData = async () => {
    setSyncStatus('syncing');
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setWallets(prev => prev.map(w => 
      w.connected ? { ...w, lastSync: new Date() } : w
    ));
    
    setSyncStatus('success');
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  // Auto sync effect
  useEffect(() => {
    if (!autoSync) return;

    const interval = setInterval(() => {
      const connectedWallets = wallets.filter(w => w.connected);
      if (connectedWallets.length > 0) {
        syncData();
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, [autoSync, wallets]);

  // Generate initial QR code
  useEffect(() => {
    generateQRCode();
  }, []);

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'browser': return <Wifi className="h-4 w-4" />;
      case 'hardware': return <QrCode className="h-4 w-4" />;
      default: return <Smartphone className="h-4 w-4" />;
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <RefreshCw className="h-4 w-4 text-gray-400" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadQRCode = () => {
    if (!qrCodeImage) return;
    
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = 'sora-contract-qr.svg';
    link.click();
  };

  const connectedWallets = wallets.filter(w => w.connected).length;
  const totalWallets = wallets.length;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Mobile Integration</span>
          </CardTitle>
          <CardDescription>
            Connect mobile wallets and generate QR codes for contract interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{connectedWallets}</div>
              <div className="text-sm text-muted-foreground">Connected Wallets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalWallets}</div>
              <div className="text-sm text-muted-foreground">Available Wallets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {autoSync ? 'ON' : 'OFF'}
              </div>
              <div className="text-sm text-muted-foreground">Auto Sync</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Contract QR Code</span>
          </CardTitle>
          <CardDescription>
            Generate QR codes for mobile wallet interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                  {qrCodeImage ? (
                    <img 
                      src={qrCodeImage} 
                      alt="Contract QR Code" 
                      className="mx-auto w-48 h-48"
                    />
                  ) : (
                    <div className="w-48 h-48 mx-auto flex items-center justify-center text-gray-400">
                      <QrCode className="h-16 w-16" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Scan with your mobile wallet
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={generateQRCode} 
                  disabled={isGeneratingQR}
                  className="flex-1"
                >
                  {isGeneratingQR ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4 mr-2" />
                  )}
                  Generate QR
                </Button>
                <Button 
                  variant="outline" 
                  onClick={downloadQRCode}
                  disabled={!qrCodeImage}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Deep Link</Label>
                <div className="flex space-x-2 mt-1">
                  <Input 
                    value={deepLink} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(deepLink)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Contract Address</Label>
                <Input 
                  value={qrCodeData.contractAddress} 
                  readOnly 
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <Label>Action</Label>
                <Input 
                  value={qrCodeData.action} 
                  readOnly 
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Parameters</Label>
                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                  {JSON.stringify(qrCodeData.parameters, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Management */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Connections</CardTitle>
          <CardDescription>
            Manage connected wallets and sync settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {wallets.map((wallet) => (
              <div key={wallet.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getWalletIcon(wallet.type)}
                  <div>
                    <p className="font-medium">{wallet.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {wallet.connected 
                        ? `Connected • ${wallet.address?.substring(0, 8)}...`
                        : 'Not connected'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last sync: {wallet.lastSync.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={wallet.connected ? "default" : "secondary"}>
                    {wallet.connected ? "Connected" : "Disconnected"}
                  </Badge>
                  {wallet.connected ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => disconnectWallet(wallet.id)}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => connectWallet(wallet.id)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
          <CardDescription>
            Configure automatic synchronization with mobile wallets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync data with connected wallets
                </p>
              </div>
              <Switch 
                checked={autoSync} 
                onCheckedChange={setAutoSync}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Manual Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Sync data now with all connected wallets
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={syncData}
                disabled={syncStatus === 'syncing' || connectedWallets === 0}
                className="flex items-center space-x-2"
              >
                {getSyncStatusIcon()}
                <span>
                  {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                </span>
              </Button>
            </div>

            {connectedWallets > 0 && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-4 w-4" />
                  <span>
                    {connectedWallets} wallet{connectedWallets > 1 ? 's' : ''} connected and syncing
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}