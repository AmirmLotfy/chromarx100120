import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { chromeDb } from "@/lib/chrome-storage";
import { AffiliateProduct } from "@/config/affiliateContent";

const AffiliateSettings = () => {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [newProduct, setNewProduct] = useState<AffiliateProduct>({
    id: "",
    title: "",
    description: "",
    imageUrl: "",
    affiliateUrl: "",
    price: "",
    featured: false,
    showOnHome: false
  });

  const loadAffiliateContent = async () => {
    try {
      const docRef = doc(chromeDb, "config", "affiliateContent");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProducts(docSnap.data().products || []);
      }
    } catch (error) {
      console.error("Error loading affiliate content:", error);
      toast.error("Failed to load affiliate content");
    }
  };

  const saveAffiliateContent = async () => {
    try {
      const docRef = doc(chromeDb, "config", "affiliateContent");
      await setDoc(docRef, { products });
      toast.success("Affiliate content saved successfully");
    } catch (error) {
      console.error("Error saving affiliate content:", error);
      toast.error("Failed to save affiliate content");
    }
  };

  const addProduct = () => {
    if (!newProduct.title || !newProduct.description || !newProduct.affiliateUrl) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setProducts([...products, { ...newProduct, id: Date.now().toString() }]);
    setNewProduct({
      id: "",
      title: "",
      description: "",
      imageUrl: "",
      affiliateUrl: "",
      price: "",
      featured: false,
      showOnHome: false
    });
    toast.success("Product added successfully");
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(product => product.id !== id));
    toast.success("Product removed successfully");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Affiliate Content Management</CardTitle>
        <CardDescription>
          Manage affiliate products and services that appear on the home and services pages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Add New Product</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newProduct.title}
                onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                placeholder="Product title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Product description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={newProduct.imageUrl}
                onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                placeholder="Image URL"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="affiliateUrl">Affiliate URL</Label>
              <Input
                id="affiliateUrl"
                value={newProduct.affiliateUrl}
                onChange={(e) => setNewProduct({ ...newProduct, affiliateUrl: e.target.value })}
                placeholder="Affiliate URL"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder="Price (e.g., $9.99/month)"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={newProduct.featured}
                  onCheckedChange={(checked) => setNewProduct({ ...newProduct, featured: checked })}
                />
                <Label htmlFor="featured">Featured</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="showOnHome"
                  checked={newProduct.showOnHome}
                  onCheckedChange={(checked) => setNewProduct({ ...newProduct, showOnHome: checked })}
                />
                <Label htmlFor="showOnHome">Show on Home</Label>
              </div>
            </div>
            <Button onClick={addProduct}>Add Product</Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Current Products</h3>
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{product.title}</h4>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                      <p className="text-sm mt-1">{product.price}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeProduct(product.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button onClick={saveAffiliateContent} className="w-full">
            Save All Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AffiliateSettings;
