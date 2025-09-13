'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Copy,
  MoreHorizontal,
  Edit,
  Trash2,
  BarChart2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Link } from '@/lib/definitions';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { deleteDoc, doc, increment, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';

type LinksTableProps = {
  links: Link[];
  loading: boolean;
};

export function LinksTable({ links, loading }: LinksTableProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [editedOriginalUrl, setEditedOriginalUrl] = useState('');
  const [editedShortCode, setEditedShortCode] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [host, setHost] = useState('');

  useEffect(() => {
    setIsClient(true);
    setHost(window.location.origin);
  }, []);
  

  const handleCopy = (shortCode: string) => {
    if (!host) return;
    const shortUrl = `${host}/r/${shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    toast({
      title: 'Copied to clipboard!',
      description: shortUrl,
    });
  };

  const openDeleteDialog = (link: Link) => {
    setSelectedLink(link);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (link: Link) => {
    setSelectedLink(link);
    setEditedOriginalUrl(link.originalUrl);
    setEditedShortCode(link.shortCode);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedLink) return;
    try {
      await deleteDoc(doc(db, 'links', selectedLink.id));
      toast({
        title: 'Link deleted',
        description: 'The link has been successfully deleted.',
        variant: 'destructive',
      });
    } catch (error) {
       toast({
        title: 'Error',
        description: 'Failed to delete link.',
        variant: 'destructive',
      });
    }
    setIsDeleteDialogOpen(false);
    setSelectedLink(null);
  };
  
  const handleEdit = async () => {
    if (!selectedLink) return;
    try {
      const linkRef = doc(db, 'links', selectedLink.id);
      await updateDoc(linkRef, {
        originalUrl: editedOriginalUrl,
        shortCode: editedShortCode,
      });
      toast({
        title: 'Link updated',
        description: 'The link has been successfully updated.',
      });
    } catch (error) {
       toast({
        title: 'Error',
        description: 'Failed to update link.',
        variant: 'destructive',
      });
    }
    setIsEditDialogOpen(false);
    setSelectedLink(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">My Links</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Short Link</TableHead>
                <TableHead className="hidden md:table-cell">Original URL</TableHead>
                <TableHead className="hidden sm:table-cell">Clicks</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : links.length > 0 ? (
                links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <a
                          href={`/r/${link.shortCode}`}
                          className="font-medium text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {host ? `${host.replace(/https?:\/\//, '')}/r/${link.shortCode}` : `r/${link.shortCode}`}
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(link.shortCode)}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copy</span>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">
                      <a
                        href={link.originalUrl}
                        className="text-muted-foreground hover:text-foreground"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.originalUrl}
                      </a>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                        {isClient ? link.clicks.toLocaleString() : link.clicks}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {isClient && link.createdAt ? format(parseISO(link.createdAt), 'MMM d, yyyy') : ''}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(link)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => alert(`Viewing stats for ${link.shortCode}`)}
                          >
                            <BarChart2 className="mr-2 h-4 w-4" />
                            View Stats
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                              <a href={link.originalUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Open Original
                              </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => openDeleteDialog(link)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : null}
            </TableBody>
          </Table>
        </div>
        {!loading && links.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
            You haven't created any links yet.
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your short
              link and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>
              Make changes to your short link here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="originalUrl" className="text-right">
                Original URL
              </Label>
              <Input
                id="originalUrl"
                value={editedOriginalUrl}
                onChange={(e) => setEditedOriginalUrl(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shortCode" className="text-right">
                Short Code
              </Label>
              <Input
                id="shortCode"
                value={editedShortCode}
                onChange={(e) => setEditedShortCode(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
