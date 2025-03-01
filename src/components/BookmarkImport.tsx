
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, FileUp, ExternalLink, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIProgressIndicator } from "@/components/ui/ai-progress-indicator";
import { ChromeBookmark } from "@/types/bookmark";
import { extractDomain } from "@/utils/domainUtils";

interface BookmarkImportProps {
  onImportComplete: (bookmarks: ChromeBookmark[]) => void;
}

export function BookmarkImport({ onImportComplete }: BookmarkImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importedBookmarks, setImportedBookmarks] = useState<ChromeBookmark[]>([]);
  const [importSource, setImportSource] = useState<"chrome" | "file" | "url">("chrome");
  const [urlToImport, setUrlToImport] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const processBookmarkFile = async (file: File): Promise<ChromeBookmark[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          // For HTML bookmark files (most common format)
          if (file.type === "text/html") {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, "text/html");
            const links = Array.from(doc.querySelectorAll("a"));
            
            const bookmarks: ChromeBookmark[] = links.map((link, index) => {
              const url = link.getAttribute("href") || "";
              const title = link.textContent || extractDomain(url);
              const dateAdded = link.getAttribute("add_date") 
                ? parseInt(link.getAttribute("add_date") || "0") * 1000 
                : Date.now();
              
              return {
                id: `imported-${index}-${Date.now()}`,
                title,
                url,
                dateAdded,
                category: link.closest("h3")?.textContent || "Imported",
              };
            });
            
            resolve(bookmarks);
          } else if (file.type === "application/json") {
            // For JSON bookmark files
            try {
              const jsonData = JSON.parse(content);
              
              // Handle different JSON bookmark formats
              if (Array.isArray(jsonData)) {
                const bookmarks: ChromeBookmark[] = jsonData.map((item, index) => ({
                  id: `imported-${index}-${Date.now()}`,
                  title: item.title || extractDomain(item.url || ""),
                  url: item.url || "",
                  dateAdded: item.dateAdded || Date.now(),
                  category: item.category || "Imported",
                }));
                resolve(bookmarks);
              } else if (jsonData.roots) {
                // Chrome JSON format
                const extractChromeBookmarks = (node: any, category = "Imported"): ChromeBookmark[] => {
                  let bookmarks: ChromeBookmark[] = [];
                  
                  if (node.type === "url") {
                    bookmarks.push({
                      id: `imported-${node.id}-${Date.now()}`,
                      title: node.name || extractDomain(node.url || ""),
                      url: node.url || "",
                      dateAdded: node.date_added ? parseInt(node.date_added) : Date.now(),
                      category,
                    });
                  } else if (node.children) {
                    const newCategory = node.name || category;
                    node.children.forEach((child: any) => {
                      bookmarks = bookmarks.concat(extractChromeBookmarks(child, newCategory));
                    });
                  }
                  
                  return bookmarks;
                };
                
                let allBookmarks: ChromeBookmark[] = [];
                Object.values(jsonData.roots).forEach((root: any) => {
                  allBookmarks = allBookmarks.concat(extractChromeBookmarks(root));
                });
                
                resolve(allBookmarks);
              } else {
                reject(new Error("Unsupported JSON bookmark format"));
              }
            } catch (error) {
              reject(new Error("Invalid JSON format"));
            }
          } else {
            reject(new Error("Unsupported file format"));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };
      
      reader.readAsText(file);
    });
  };

  const importFromChrome = async () => {
    setIsProcessing(true);
    setImportProgress(0);
    
    try {
      if (!chrome.bookmarks) {
        toast.error("Chrome bookmarks API not available");
        setIsProcessing(false);
        return;
      }
      
      const processChromeBookmarks = (nodes: chrome.bookmarks.BookmarkTreeNode[], category = "Imported"): ChromeBookmark[] => {
        let bookmarks: ChromeBookmark[] = [];
        
        for (const node of nodes) {
          if (node.url) {
            bookmarks.push({
              id: node.id,
              title: node.title || extractDomain(node.url),
              url: node.url,
              dateAdded: node.dateAdded ? node.dateAdded : Date.now(),
              category,
            });
          } else if (node.children) {
            const newCategory = node.title || category;
            bookmarks = bookmarks.concat(processChromeBookmarks(node.children, newCategory));
          }
        }
        
        return bookmarks;
      };
      
      const chromeBookmarks = await chrome.bookmarks.getTree();
      
      // Simulate progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress <= 90) {
          setImportProgress(progress);
        } else {
          clearInterval(progressInterval);
        }
      }, 100);
      
      const processedBookmarks = processChromeBookmarks(chromeBookmarks);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      setTimeout(() => {
        setImportedBookmarks(processedBookmarks);
        setIsProcessing(false);
      }, 500);
      
      toast.success(`Successfully imported ${processedBookmarks.length} bookmarks`);
    } catch (error) {
      console.error("Error importing Chrome bookmarks:", error);
      toast.error("Failed to import Chrome bookmarks");
      setIsProcessing(false);
    }
  };

  const importFromFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to import");
      return;
    }
    
    setIsProcessing(true);
    setImportProgress(0);
    
    try {
      // Simulate progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        if (progress <= 90) {
          setImportProgress(progress);
        } else {
          clearInterval(progressInterval);
        }
      }, 100);
      
      const bookmarks = await processBookmarkFile(selectedFile);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      setTimeout(() => {
        setImportedBookmarks(bookmarks);
        setIsProcessing(false);
      }, 500);
      
      toast.success(`Successfully imported ${bookmarks.length} bookmarks`);
    } catch (error) {
      console.error("Error processing bookmark file:", error);
      toast.error("Failed to import bookmarks from file");
      setIsProcessing(false);
    }
  };

  const importFromUrl = async () => {
    if (!urlToImport) {
      toast.error("Please enter a URL to import");
      return;
    }
    
    setIsProcessing(true);
    setImportProgress(0);
    
    try {
      // Simulate progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress <= 90) {
          setImportProgress(progress);
        } else {
          clearInterval(progressInterval);
        }
      }, 150);
      
      // For demo purposes, just create a single bookmark
      const bookmarks: ChromeBookmark[] = [{
        id: `imported-url-${Date.now()}`,
        title: urlToImport,
        url: urlToImport.startsWith("http") ? urlToImport : `https://${urlToImport}`,
        dateAdded: Date.now(),
        category: "Imported URL",
      }];
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      setTimeout(() => {
        setImportedBookmarks(bookmarks);
        setIsProcessing(false);
      }, 500);
      
      toast.success(`Successfully imported bookmark from URL`);
    } catch (error) {
      console.error("Error importing from URL:", error);
      toast.error("Failed to import bookmark from URL");
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    switch (importSource) {
      case "chrome":
        importFromChrome();
        break;
      case "file":
        importFromFile();
        break;
      case "url":
        importFromUrl();
        break;
    }
  };

  const handleConfirmImport = () => {
    onImportComplete(importedBookmarks);
    setIsOpen(false);
    setSelectedFile(null);
    setImportedBookmarks([]);
    setImportProgress(0);
    toast.success(`Added ${importedBookmarks.length} bookmarks to your collection`);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1.5"
        onClick={() => setIsOpen(true)}
      >
        <Download className="h-4 w-4" />
        <span>Import</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Bookmarks</DialogTitle>
          </DialogHeader>

          {isProcessing ? (
            <div className="space-y-4 py-4">
              <AIProgressIndicator 
                isLoading={true} 
                message={`Importing bookmarks, please wait...`} 
                progress={importProgress}
                status="importing"
              />
            </div>
          ) : importedBookmarks.length > 0 ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Ready to Import</h3>
                <span className="text-sm text-muted-foreground">
                  {importedBookmarks.length} bookmarks found
                </span>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 text-xs font-medium">Title</th>
                        <th className="text-left p-2 text-xs font-medium">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedBookmarks.slice(0, 100).map((bookmark, i) => (
                        <tr key={bookmark.id} className="border-t">
                          <td className="p-2 text-sm truncate max-w-[200px]">{bookmark.title}</td>
                          <td className="p-2 text-sm text-muted-foreground">{bookmark.category}</td>
                        </tr>
                      ))}
                      {importedBookmarks.length > 100 && (
                        <tr>
                          <td colSpan={2} className="p-2 text-center text-sm text-muted-foreground">
                            And {importedBookmarks.length - 100} more...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <Tabs value={importSource} onValueChange={(v) => setImportSource(v as any)}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="chrome">From Chrome</TabsTrigger>
                <TabsTrigger value="file">From File</TabsTrigger>
                <TabsTrigger value="url">From URL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chrome" className="space-y-4">
                <div className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-lg">
                  <Download className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <h3 className="font-medium">Import from Chrome</h3>
                    <p className="text-sm text-muted-foreground">
                      Import all your bookmarks directly from Chrome
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="file" className="space-y-4">
                <div 
                  className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-lg"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files && files[0]) {
                      setSelectedFile(files[0]);
                    }
                  }}
                >
                  <FileUp className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <h3 className="font-medium">Import from File</h3>
                    <p className="text-sm text-muted-foreground">
                      Drag & drop a bookmark file or click to select
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".html,.htm,.json"
                      onChange={handleFileChange}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleFileButtonClick}
                      className="mt-2"
                    >
                      Select File
                    </Button>
                  </div>
                </div>
                
                {selectedFile && (
                  <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
                    <span className="text-sm truncate max-w-[300px]">{selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="url" className="space-y-4">
                <div className="flex flex-col gap-4 p-6 border-2 border-dashed rounded-lg">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Import from URL</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter a URL to import as a bookmark
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://example.com"
                      className="flex-1 px-3 py-2 border rounded"
                      value={urlToImport}
                      onChange={(e) => setUrlToImport(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            {importedBookmarks.length > 0 ? (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setImportedBookmarks([])}>
                  Back
                </Button>
                <Button onClick={handleConfirmImport}>
                  <Check className="h-4 w-4 mr-1.5" />
                  Confirm Import
                </Button>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={importSource === "file" && !selectedFile || importSource === "url" && !urlToImport}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Import
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
