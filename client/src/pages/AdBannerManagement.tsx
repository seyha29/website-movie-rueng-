import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, ExternalLink, Image } from "lucide-react";
import type { AdBanner } from "@shared/schema";

export default function AdBannerManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdBanner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
    linkUrl: "",
    position: "top",
    isActive: 1,
  });

  const { data: banners = [], isLoading } = useQuery<AdBanner[]>({
    queryKey: ["/api/admin/banners"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/banners", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({ title: "Success", description: "Ad banner created successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PUT", `/api/admin/banners/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({ title: "Success", description: "Ad banner updated successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/banners/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({ title: "Success", description: "Ad banner deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      imageUrl: "",
      linkUrl: "",
      position: "top",
      isActive: 1,
    });
    setEditingBanner(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (banner: AdBanner) => {
    setEditingBanner(banner);
    setFormData({
      name: banner.name,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      position: banner.position,
      isActive: banner.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleActive = (banner: AdBanner) => {
    updateMutation.mutate({
      id: banner.id,
      data: { isActive: banner.isActive === 1 ? 0 : 1 },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading ad banners...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-banner-title">Ad Banner Management</h1>
          <p className="text-muted-foreground">Manage advertisement banners for the video player and detail modal</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} data-testid="button-add-banner">
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingBanner ? "Edit Ad Banner" : "Add New Ad Banner"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Banner Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., TapTap Gaming Ad"
                  required
                  data-testid="input-banner-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/banner.gif"
                  required
                  data-testid="input-banner-image"
                />
                <p className="text-xs text-muted-foreground">Recommended size: 728x180 pixels (GIF, PNG, JPG)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkUrl">Click Link URL</Label>
                <Input
                  id="linkUrl"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://example.com"
                  required
                  data-testid="input-banner-link"
                />
                <p className="text-xs text-muted-foreground">Users will be redirected here when clicking the banner</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger data-testid="select-banner-position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top (Above Video)</SelectItem>
                    <SelectItem value="bottom">Bottom (Below Video)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive === 1}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked ? 1 : 0 })}
                  data-testid="switch-banner-active"
                />
              </div>
              {formData.imageUrl && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <img
                    src={formData.imageUrl}
                    alt="Banner preview"
                    className="w-full h-auto rounded border"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    data-testid="img-banner-preview"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-banner"
                >
                  {editingBanner ? "Update" : "Create"} Banner
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Image className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Ad Banners Yet</h3>
            <p className="text-muted-foreground mb-4">Add your first ad banner to start monetizing your video player</p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-banner">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden" data-testid={`card-banner-${banner.id}`}>
              <div className="flex flex-col md:flex-row">
                <div className="md:w-64 h-32 md:h-auto bg-muted flex-shrink-0">
                  <img
                    src={banner.imageUrl}
                    alt={banner.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><rect fill="%23333" width="100" height="50"/><text x="50" y="30" text-anchor="middle" fill="%23666" font-size="8">No Image</text></svg>';
                    }}
                    data-testid={`img-banner-${banner.id}`}
                  />
                </div>
                <CardContent className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold" data-testid={`text-banner-name-${banner.id}`}>{banner.name}</h3>
                        <Badge variant={banner.isActive === 1 ? "default" : "secondary"}>
                          {banner.isActive === 1 ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{banner.position === "top" ? "Top" : "Bottom"}</Badge>
                      </div>
                      <a
                        href={banner.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                        data-testid={`link-banner-url-${banner.id}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                        {banner.linkUrl}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.isActive === 1}
                        onCheckedChange={() => toggleActive(banner)}
                        data-testid={`switch-toggle-${banner.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(banner)}
                        data-testid={`button-edit-${banner.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this banner?")) {
                            deleteMutation.mutate(banner.id);
                          }
                        }}
                        data-testid={`button-delete-${banner.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
