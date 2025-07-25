'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { toast } from 'sonner';
import { useUser } from '@clerk/chrome-extension';
import api from '~lib/api';

interface Match {
  name: string;
  category?: string | null;
  cancellationLink?: string | null;
  amountUSD?: number | null;
}

interface BillUploadDialogProps {
  onSubscriptionsAdded: () => void;
  disabled?: boolean;
  triggerClassName?: string;
  label?: string;
}

export function BillUploadDialog({ onSubscriptionsAdded, disabled, triggerClassName, label = 'Auto-add from Bill' }: BillUploadDialogProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (!dialogOpen) return;

    const handlePaste = (event: ClipboardEvent) => {
      // Don't do anything if a file is already selected or we are in loading/results state
      if (file || matches.length > 0) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setFile(new File([blob], 'pasted-image.png', { type: blob.type }));
            toast.info('Image pasted from clipboard');
          }
          break; // only handle first image
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [dialogOpen, file, matches.length]);

  const handleDetect = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:3000/api/detect-subscriptions', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error('Failed to detect subscriptions');
      }
      const data = await res.json();
      let detected: Match[] = [];
      const matchesArr: any[] = Array.isArray(data.matches) ? data.matches : [];
      const itemsArr: any[] = Array.isArray(data.items) ? data.items : [];

      if (matchesArr.length > 0) {
        detected = matchesArr;
      }

      // Add any raw items that were not in matches (e.g., not found in DB)
      itemsArr.forEach((i: any) => {
        const exists = detected.some((d) => d.name.toLowerCase() === i.name.toLowerCase());
        if (!exists) {
          detected.push({ name: i.name, amountUSD: i.amountUSD ?? null });
        }
      });
      setMatches(detected);
      // default select all
      const defaultSel: Record<string, boolean> = {};
      detected.forEach((s) => (defaultSel[s.name] = true));
      setSelected(defaultSel);
      if (detected.length === 0) {
        toast.info('No subscriptions detected.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Detection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const toAdd = matches.filter((m) => selected[m.name]);
    if (toAdd.length === 0) {
      toast.info('No subscriptions selected');
      return;
    }
    try {
      setLoading(true);
      for (const sub of toAdd) {
        const payload = {
          userId: user.id,
          serviceName: sub.name,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          billingCycle: 'monthly',
          price: sub.amountUSD ? Number(sub.amountUSD.toFixed(2)) : 0,
          category: sub.category,
          cancellationUrl: sub.cancellationLink,
        };
        await api.addSubscription(payload as any);
      }
      toast.success(`${toAdd.length} subscriptions added`);
      setDialogOpen(false);
      onSubscriptionsAdded();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setMatches([]);
    setSelected({});
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetState(); }}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className={triggerClassName || 'bg-black text-white hover:bg-purple-600 transition-colors'}>
          {disabled ? 'Auto-add (disabled)' : label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-lg bg-white/70 backdrop-blur-sm border border-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Scan your monthly bill</DialogTitle>
          <DialogDescription className="text-base">
            Upload an image of your billing statement or paste one from your clipboard. We will detect recurring subscriptions
            automatically.
          </DialogDescription>
        </DialogHeader>

        {/* File input */}
        {!file && (
          <Input
            type="file"
            accept="image/*,application/pdf"
            ref={fileRef}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="bg-white"
          />
        )}

        {/* Preview shown only before detection results */}
        {file && matches.length === 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium">Preview:</p>
            {file.type.startsWith('image') ? (
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="mt-2 max-h-64 object-contain border rounded"
              />
            ) : (
              <p className="text-sm text-gray-500 mt-2">{file.name}</p>
            )}
          </div>
        )}

        {/* Detect button */}
        {file && matches.length === 0 && (
          <Button onClick={handleDetect} disabled={loading} className="mt-4 bg-black text-white hover:bg-purple-600">
            {loading ? 'Detecting...' : 'Detect Subscriptions'}
          </Button>
        )}

        {/* Matches list */}
        {matches.length > 0 && (
          <div className="mt-4 max-h-64 overflow-y-auto">
            <p className="font-medium mb-2">Woo! We found these, Please pick the ones to add to your list.</p>
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th className="text-left py-1 border-b px-2">Select</th>
                  <th className="text-left py-1 border-b px-2">Subscription</th>
                  <th className="text-left py-1 border-b px-2">Amount (USD)</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.name} className="border-b last:border-none">
                    <td className="px-2 py-1">
                      <input
                        type="checkbox"
                        checked={selected[m.name]}
                        onChange={(e) => setSelected({ ...selected, [m.name]: e.target.checked })}
                      />
                    </td>
                    <td className="px-2 py-1">{m.name}</td>
                    <td className="px-2 py-1">{m.amountUSD !== undefined && m.amountUSD !== null ? `$${m.amountUSD.toFixed(2)}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button className="bg-white text-black" variant="outline">Close</Button>
          </DialogClose>
          {matches.length > 0 && (
            <Button
              onClick={handleAdd}
              disabled={loading}
              className={'bg-black text-white hover:bg-purple-600 transition-colors'}>
              {loading ? 'Adding...' : 'Add Selected'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 