import React, { useState } from 'react';
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
import { toast } from 'react-hot-toast';
import api from '~lib/api';
import { useUser } from '@clerk/chrome-extension';

interface AddSubscriptionDialogProps {
  onSubscriptionAdded: () => void;
}

export function AddSubscriptionDialog({ onSubscriptionAdded }: AddSubscriptionDialogProps) {
  const [newSub, setNewSub] = useState({
    serviceName: "",
    price: "",
    startDate: "",
    endDate: ""
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const promise = api.addSubscription({
      ...newSub,
      userId: user.id,
      price: parseFloat(newSub.price) || 0
    });

    toast.promise(promise, {
      loading: "Adding subscription...",
      success: () => {
        setNewSub({ serviceName: "", price: "", startDate: "", endDate: "" }); // Reset form
        onSubscriptionAdded();
        setDialogOpen(false);
        setLoading(false);
        return "Subscription added successfully!"
      },
      error: (err) => {
        setLoading(false);
        return err.message || "Error adding subscription."
      }
    });
  }
  
  const resetState = () => {
    setNewSub({ serviceName: "", price: "", startDate: "", endDate: "" });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetState(); }}>
      <DialogTrigger asChild>
        <Button className={'bg-black text-white hover:bg-purple-600 transition-colors'}>
            Add Manually
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-lg bg-white/70 backdrop-blur-sm border border-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add New Subscription</DialogTitle>
          <DialogDescription className="text-base">
            Manually add a new subscription to your list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddSubscription}>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <Input
                    type="text"
                    placeholder="Service Name"
                    value={newSub.serviceName}
                    onChange={(e) =>
                    setNewSub({ ...newSub, serviceName: e.target.value })
                    }
                    className="bg-white"
                    required
                />
                <Input
                    type="number"
                    placeholder="Price"
                    value={newSub.price}
                    onChange={(e) => setNewSub({ ...newSub, price: e.target.value })}
                    className="bg-white"
                    required
                />
                <Input
                    type="date"
                    placeholder="Start Date"
                    value={newSub.startDate}
                    onChange={(e) =>
                    setNewSub({ ...newSub, startDate: e.target.value })
                    }
                    className="bg-white"
                    required
                />
                <Input
                    type="date"
                    placeholder="End Date"
                    value={newSub.endDate}
                    onChange={(e) => setNewSub({ ...newSub, endDate: e.target.value })}
                    className="bg-white"
                    required
                />
            </div>
            
            <DialogFooter className="mt-4">
                <DialogClose asChild>
                    <Button type="button" className="bg-white text-black" variant="outline">Close</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Subscription'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 