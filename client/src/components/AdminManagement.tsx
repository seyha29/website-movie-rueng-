import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Admin } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Shield, Film, Eye, EyeOff } from "lucide-react";

type AdminWithoutPassword = Omit<Admin, "password">;

export default function AdminManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "full" as "full" | "video",
  });
  const [showPassword, setShowPassword] = useState(false);

  const { data: admins = [], isLoading } = useQuery<AdminWithoutPassword[]>({
    queryKey: ["/api/admin/admins"],
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: typeof newAdmin) => {
      const result = await apiRequest("POST", "/api/admin/admins", data);
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({
        title: "Admin created",
        description: "New admin account has been created successfully",
      });
      setIsDialogOpen(false);
      setNewAdmin({ username: "", password: "", fullName: "", role: "full" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create admin",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/admins/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({
        title: "Admin deleted",
        description: "Admin account has been deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete admin",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.username.trim() || !newAdmin.password.trim() || !newAdmin.fullName.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createAdminMutation.mutate(newAdmin);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading admins...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Management</h2>
          <p className="text-muted-foreground">Manage administrator accounts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
              <DialogDescription>
                Add a new administrator account
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  placeholder="admin_username"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  placeholder="John Doe"
                  value={newAdmin.fullName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Strong password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={newAdmin.role}
                  onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value as "full" | "video" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Full Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Film className="h-4 w-4" />
                        Video Manager
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {newAdmin.role === "full" 
                    ? "Full access to all admin features including analytics, users, and settings"
                    : "Access to video management only"}
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createAdminMutation.isPending}>
                  {createAdminMutation.isPending ? "Creating..." : "Create Admin"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrator Accounts</CardTitle>
          <CardDescription>
            {admins.length} admin{admins.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No admins found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.username}</TableCell>
                    <TableCell>{admin.fullName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {admin.role === "full" ? (
                          <>
                            <Shield className="h-4 w-4 text-primary" />
                            <span>Full Admin</span>
                          </>
                        ) : (
                          <>
                            <Film className="h-4 w-4 text-muted-foreground" />
                            <span>Video Manager</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${admin.username}?`)) {
                            deleteAdminMutation.mutate(admin.id);
                          }
                        }}
                        disabled={deleteAdminMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
