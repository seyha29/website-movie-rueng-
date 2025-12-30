import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, DollarSign, Clock, Gift, ShoppingCart, RefreshCw } from "lucide-react";

interface AppSetting {
  key: string;
  value: string;
  description: string | null;
  updatedAt: number;
}

interface CreditTransaction {
  id: string;
  userId: string;
  userName: string;
  type: string;
  amount: string;
  balanceAfter: string;
  description: string | null;
  movieId: string | null;
  adminId: string | null;
  createdAt: number;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [welcomeCredit, setWelcomeCredit] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery<AppSetting[]>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery<CreditTransaction[]>({
    queryKey: ["/api/admin/credits/transactions"],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await apiRequest("PUT", `/api/admin/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Setting Updated",
        description: "The setting has been updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentWelcomeCredit = settings?.find(s => s.key === 'welcome_credit_amount')?.value || '5.00';

  const handleSaveWelcomeCredit = () => {
    const amount = parseFloat(welcomeCredit);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount (0 or greater)",
        variant: "destructive",
      });
      return;
    }
    updateSettingMutation.mutate({ 
      key: 'welcome_credit_amount', 
      value: amount.toFixed(2) 
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'welcome_bonus':
        return { label: 'Welcome Bonus', color: 'bg-green-500' };
      case 'admin_gift':
        return { label: 'Admin Gift', color: 'bg-blue-500' };
      case 'purchase':
        return { label: 'Purchase', color: 'bg-red-500' };
      case 'refund':
        return { label: 'Refund', color: 'bg-yellow-500' };
      default:
        return { label: type, color: 'bg-gray-500' };
    }
  };

  if (settingsLoading) {
    return <div className="flex justify-center py-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">App Settings</h1>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Credit Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                Welcome Credit Amount
              </CardTitle>
              <CardDescription>
                Amount of credits given to new users when they register. 
                Current value: <span className="font-bold text-orange-500">${currentWelcomeCredit}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={welcomeCredit}
                      onChange={(e) => setWelcomeCredit(e.target.value)}
                      className="pl-7 w-32"
                      placeholder="5.00"
                    />
                  </div>
                  <Button 
                    onClick={handleSaveWelcomeCredit}
                    disabled={updateSettingMutation.isPending}
                  >
                    {updateSettingMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setWelcomeCredit(currentWelcomeCredit);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button onClick={() => {
                  setIsEditing(true);
                  setWelcomeCredit(currentWelcomeCredit);
                }}>
                  Edit Amount
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Settings</CardTitle>
              <CardDescription>View all application settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings?.map((setting) => (
                    <TableRow key={setting.key}>
                      <TableCell className="font-mono text-sm">{setting.key}</TableCell>
                      <TableCell className="font-bold">{setting.value}</TableCell>
                      <TableCell className="text-muted-foreground">{setting.description || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(setting.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!settings || settings.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No settings found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Credit Transaction History</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetchTransactions()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {transactionsLoading ? (
            <div className="flex justify-center py-8">Loading transactions...</div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance After</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>User Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((tx) => {
                      const typeInfo = getTransactionTypeLabel(tx.type);
                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm">
                            {formatDate(tx.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${typeInfo.color} text-white`}>
                              {tx.type === 'welcome_bonus' && <Gift className="h-3 w-3 mr-1" />}
                              {tx.type === 'admin_gift' && <Gift className="h-3 w-3 mr-1" />}
                              {tx.type === 'purchase' && <ShoppingCart className="h-3 w-3 mr-1" />}
                              {typeInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-bold ${parseFloat(tx.amount) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {parseFloat(tx.amount) >= 0 ? '+' : ''}${tx.amount}
                          </TableCell>
                          <TableCell className="font-mono">${tx.balanceAfter}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {tx.description || '-'}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {tx.userName}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!transactions || transactions.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
