import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';

type Subscription = {
  id: string;
  serviceName: string;
  price: number | string;
  endDate: string;
  category?: string;
  cancellationUrl?: string;
};

const EditSubscriptionDialog = ({ 
  subscription,
  onSubscriptionUpdated 
}: { 
  subscription: Subscription,
  onSubscriptionUpdated: (subscription: Subscription) => void;
}) => {
  const [serviceName, setServiceName] = useState(subscription.serviceName);
  const [price, setPrice] = useState(subscription.price);
  const [billing, setBilling] = useState('Monthly'); // This can be dynamic
  const [category, setCategory] = useState(subscription.category || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(subscription.endDate.split('T')[0]);
  const [cancelUrl, setCancelUrl] = useState(subscription.cancellationUrl || '');

  const handleSaveChanges = () => {
    onSubscriptionUpdated({
      ...subscription,
      serviceName,
      price,
      category,
      endDate,
      cancellationUrl: cancelUrl,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label>Service</label>
            <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
          </div>
          <div>
            <label>Price</label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label>Billing</label>
            <Input value={billing} onChange={(e) => setBilling(e.target.value)} />
          </div>
          <div>
            <label>Category</label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <label>Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label>End Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label>Cancel URL</label>
            <Input value={cancelUrl} onChange={(e) => setCancelUrl(e.target.value)} />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost">Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubscriptionDialog; 