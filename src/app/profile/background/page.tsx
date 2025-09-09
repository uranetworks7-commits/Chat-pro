
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ImageUp, Link as LinkIcon } from 'lucide-react';
import { useBackground } from '@/context/BackgroundContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function BackgroundPage() {
    const router = useRouter();
    const { setBackground } = useBackground();
    const { toast } = useToast();
    const [url, setUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSetUrlBackground = () => {
        if (!url) {
            toast({ title: "Please enter a URL.", variant: "destructive" });
            return;
        }
        try {
            // Basic URL validation
            new URL(url);
            setBackground(`url('${url}')`);
            toast({ title: "Background updated successfully!" });
            router.push('/profile');
        } catch (error) {
            toast({ title: "Invalid URL.", description: "Please enter a valid image URL.", variant: "destructive" });
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({ title: "File is too large.", description: "Please select an image smaller than 5MB.", variant: "destructive" });
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                setBackground(`url('${dataUrl}')`);
                toast({ title: "Background updated successfully!" });
                router.push('/profile');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <main className="h-screen w-screen bg-background flex flex-col">
            <header className="flex flex-row items-center justify-between p-2 border-b">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}><ArrowLeft /></Button>
                    <h1 className="text-xl font-semibold">Custom Background</h1>
                </div>
            </header>
            <div className="flex-1 flex items-center justify-center p-4">
                <Tabs defaultValue="upload" className="w-full max-w-md">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">
                            <ImageUp className="mr-2 h-4 w-4" />
                            From File
                        </TabsTrigger>
                        <TabsTrigger value="url">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            From URL
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload">
                        <Card>
                            <CardHeader>
                                <CardTitle>Upload from Device</CardTitle>
                                <CardDescription>
                                    Choose an image from your gallery. The image will be stored locally in your browser.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center h-48">
                                <Button onClick={handleUploadClick} variant="outline" size="lg">
                                    <ImageUp className="mr-2 h-5 w-5" />
                                    Select Image
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/gif, image/webp"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="url">
                        <Card>
                            <CardHeader>
                                <CardTitle>Load from URL</CardTitle>
                                <CardDescription>
                                    Paste a direct link to an image.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Label htmlFor="url">Image URL</Label>
                                <Input 
                                    id="url" 
                                    placeholder="https://..." 
                                    value={url} 
                                    onChange={(e) => setUrl(e.target.value)} 
                                />
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSetUrlBackground} className="w-full">Set Background</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}
