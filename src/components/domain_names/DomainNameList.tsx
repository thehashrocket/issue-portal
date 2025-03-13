'use client';

import { useState, ChangeEvent } from 'react';
import { DomainName, DomainStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface DomainNameListProps {
  clientId: string;
  domainNames: DomainName[];
  onDomainNameAdded: (domainName: DomainName) => void;
  onDomainNameUpdated: (domainName: DomainName) => void;
  onDomainNameDeleted: (domainNameId: string) => void;
}

export function DomainNameList({
  clientId,
  domainNames,
  onDomainNameAdded,
  onDomainNameUpdated,
  onDomainNameDeleted,
}: DomainNameListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainName | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    domainRegistrar: string;
    hostingProvider: string;
    domainExpiration: string;
    domainStatus: DomainStatus;
  }>({
    name: '',
    domainRegistrar: '',
    hostingProvider: '',
    domainExpiration: '',
    domainStatus: DomainStatus.ACTIVE,
  });

  const StatusBadge = ({ status }: { status: DomainStatus }) => {
    const getStatusColor = () => {
      switch (status) {
        case DomainStatus.ACTIVE:
          return 'bg-green-100 text-green-800';
        case DomainStatus.EXPIRED:
          return 'bg-yellow-100 text-yellow-800';
        case DomainStatus.CANCELLED:
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
        {status.toLowerCase().replace('_', ' ')}
      </span>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/clients/${clientId}/domain-names`, {
        method: editingDomain ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: editingDomain?.id,
          domainExpiration: formData.domainExpiration ? new Date(formData.domainExpiration) : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save domain name');

      const { data } = await response.json();
      if (editingDomain) {
        onDomainNameUpdated(data);
      } else {
        onDomainNameAdded(data);
      }
      setIsDialogOpen(false);
      setFormData({
        name: '',
        domainRegistrar: '',
        hostingProvider: '',
        domainExpiration: '',
        domainStatus: DomainStatus.ACTIVE,
      });
    } catch (error) {
      console.error('Error saving domain name:', error);
    }
  };

  const handleDelete = async (domainNameId: string) => {
    if (!confirm('Are you sure you want to delete this domain name?')) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/domain-names/${domainNameId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete domain name');

      onDomainNameDeleted(domainNameId);
    } catch (error) {
      console.error('Error deleting domain name:', error);
    }
  };

  const handleEdit = (domain: DomainName) => {
    setEditingDomain(domain);
    setFormData({
      name: domain.name,
      domainRegistrar: domain.domainRegistrar || '',
      hostingProvider: domain.hostingProvider || '',
      domainExpiration: domain.domainExpiration ? format(new Date(domain.domainExpiration), 'yyyy-MM-dd') : '',
      domainStatus: domain.domainStatus || DomainStatus.ACTIVE,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Domain Names</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setEditingDomain(null)}>
              Add Domain Name
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDomain ? 'Edit Domain Name' : 'Add Domain Name'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Domain Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domainRegistrar">Domain Registrar</Label>
                <Input
                  id="domainRegistrar"
                  value={formData.domainRegistrar}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, domainRegistrar: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hostingProvider">Hosting Provider</Label>
                <Input
                  id="hostingProvider"
                  value={formData.hostingProvider}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, hostingProvider: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domainExpiration">Domain Expiration</Label>
                <Input
                  id="domainExpiration"
                  type="date"
                  value={formData.domainExpiration}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, domainExpiration: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domainStatus">Domain Status</Label>
                <select
                  id="domainStatus"
                  value={formData.domainStatus}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, domainStatus: e.target.value as DomainStatus })}
                >
                  {Object.values(DomainStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDomain ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {domainNames.map((domain) => (
          <div
            key={domain.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border"
          >
            <div>
              <p className="text-sm text-gray-500">Domain:{domain.name}</p>
              {domain.domainRegistrar && (
                <p className="text-sm text-gray-500">Registrar: {domain.domainRegistrar}</p>
              )}
              {domain.hostingProvider && (
                <p className="text-sm text-gray-500">Hosting: {domain.hostingProvider}</p>
              )}
              {domain.domainExpiration && (
                <p className="text-sm text-gray-500">
                  Expires: {format(new Date(domain.domainExpiration), 'MMM d, yyyy')}
                </p>
              )}
              {domain.domainStatus && (
                <p className="text-sm text-gray-500">Status: <StatusBadge status={domain.domainStatus} /></p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(domain)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(domain.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 