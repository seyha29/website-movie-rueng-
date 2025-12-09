import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Shield, User as UserIcon, DollarSign, Gift, Wallet, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UserManagement() {
  const { toast } = useToast();
  const [creditAmount, setCreditAmount] = useState<string>("1");
  const [searchPhone, setSearchPhone] = useState<string>("");
  const [individualCreditAmount, setIndividualCreditAmount] = useState<string>("1");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreditDialog, setShowCreditDialog] = useState(false);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    staleTime: 5 * 60 * 1000,
  });

  // Filter users by phone number
  const filteredUsers = users.filter(user => 
    searchPhone === "" || user.phoneNumber.includes(searchPhone)
  );

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "The user has been removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const giveCreditsMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/admin/users/give-credits", { amount });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Credits Added Successfully",
        description: data.message,
      });
      setCreditAmount("1");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add credits",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const giveIndividualCreditMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/credit`, { amount });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Credit Added",
        description: data.message,
      });
      setShowCreditDialog(false);
      setSelectedUser(null);
      setIndividualCreditAmount("1");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add credit",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  const handleGiveCredits = () => {
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount between $1 and $100",
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm(`Are you sure you want to give $${amount.toFixed(2)} credit to ALL ${users.length} users?`)) {
      giveCreditsMutation.mutate(amount);
    }
  };

  const handleOpenCreditDialog = (user: User) => {
    setSelectedUser(user);
    setIndividualCreditAmount("1");
    setShowCreditDialog(true);
  };

  const handleAddIndividualCredit = () => {
    if (!selectedUser) return;
    
    const amount = parseFloat(individualCreditAmount);
    if (isNaN(amount) || amount < 0.5 || amount > 100) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount between $0.50 and $100",
        variant: "destructive",
      });
      return;
    }
    
    giveIndividualCreditMutation.mutate({ userId: selectedUser.id, amount });
  };

  const handleDelete = (user: User) => {
    if (user.isAdmin === 1) {
      toast({
        title: "Cannot delete admin",
        description: "Admin users cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${user.fullName}"?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-muted/20 rounded animate-pulse mb-6" />
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-muted/20 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">User Management</h2>
        <p className="text-sm sm:text-base text-muted-foreground">View and manage all registered users</p>
      </div>

      {/* Search by Phone Number */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Users
          </CardTitle>
          <CardDescription>
            Find users by phone number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Enter phone number to search..."
              className="pl-9"
              data-testid="input-search-phone"
            />
          </div>
          {searchPhone && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching "{searchPhone}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Give Credits Section */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Give Credits to All Users
          </CardTitle>
          <CardDescription>
            Add credit balance ($1 - $100) to all registered users at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full sm:w-auto">
              <label className="text-sm font-medium mb-2 block">Amount (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Enter amount (1-100)"
                  className="pl-9"
                  data-testid="input-credit-amount"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Enter amount between $1 and $100</p>
            </div>
            <Button
              onClick={handleGiveCredits}
              disabled={giveCreditsMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-give-credits"
            >
              <Gift className="h-4 w-4 mr-2" />
              {giveCreditsMutation.isPending ? "Processing..." : `Give Credits to ${users.length} Users`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-3 sm:gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} data-testid={`card-user-${user.id}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 sm:gap-4 space-y-0 pb-2">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {user.isAdmin === 1 ? (
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  ) : (
                    <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-wrap">
                    <span className="truncate">{user.fullName}</span>
                    {user.isAdmin === 1 && (
                      <Badge variant="default" className="text-xs shrink-0">
                        Admin
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{user.phoneNumber}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Wallet className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      Balance: ${parseFloat(user.balance || "0").toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleOpenCreditDialog(user)}
                  data-testid={`button-add-credit-${user.id}`}
                  className="h-8 w-8 sm:h-9 sm:w-9 text-green-600 border-green-600/50 hover:bg-green-600/10"
                  title="Add Credit"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(user)}
                  disabled={user.isAdmin === 1}
                  data-testid={`button-delete-user-${user.id}`}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && searchPhone && (
        <div className="text-center py-12 text-muted-foreground">
          No users found matching "{searchPhone}"
        </div>
      )}

      {users.length === 0 && !searchPhone && (
        <div className="text-center py-12 text-muted-foreground">
          No users registered yet.
        </div>
      )}

      {/* Add Credit Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Add Credit
            </DialogTitle>
            <DialogDescription>
              Add credit to {selectedUser?.fullName}'s account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-primary">
                ${parseFloat(selectedUser?.balance || "0").toFixed(2)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Amount to Add (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0.5"
                  max="100"
                  step="0.5"
                  value={individualCreditAmount}
                  onChange={(e) => setIndividualCreditAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="pl-9"
                  data-testid="input-individual-credit-amount"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Enter amount between $0.50 and $100</p>
            </div>
            {selectedUser && (
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm">
                  New Balance: <span className="font-bold text-green-600">
                    ${(parseFloat(selectedUser.balance || "0") + parseFloat(individualCreditAmount || "0")).toFixed(2)}
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddIndividualCredit}
              disabled={giveIndividualCreditMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-add-credit"
            >
              {giveIndividualCreditMutation.isPending ? "Adding..." : "Add Credit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
