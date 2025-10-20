import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Car, Shield, Mail, Crown, Settings, Trash2 } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

interface FamilyGroup {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  family_members: FamilyMember[];
}

interface FamilyMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  permissions: {
    can_book: boolean;
    can_view_documents: boolean;
    can_manage_vehicles: boolean;
  };
  users: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
}

interface SharedVehicle {
  id: string;
  vehicle_id: string;
  family_group_id: string;
  permissions: {
    can_book: boolean;
    can_view_location: boolean;
    can_manage_documents: boolean;
  };
  vehicles: {
    id: string;
    registration_number: string;
    brand: string;
    model: string;
    image_url?: string;
  };
  family_groups: {
    name: string;
    owner_id: string;
  };
}

const Family: React.FC = () => {
  const { user } = useAuth();
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [sharedVehicles, setSharedVehicles] = useState<SharedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'groups' | 'vehicles'>('groups');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadFamilyData();
    }
  }, [user]);

  const loadFamilyData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [groupsRes, vehiclesRes] = await Promise.all([
        api.family.getFamilyGroups(user.id),
        api.family.getSharedVehicles(user.id)
      ]);

      setFamilyGroups(groupsRes as FamilyGroup[]);
      setSharedVehicles(vehiclesRes as SharedVehicle[]);
    } catch (error) {
      console.error('Error loading family data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (groupData: { name: string; description: string }) => {
    if (!user?.id) return;

    try {
      await api.family.createFamilyGroup(user.id, groupData);
      await loadFamilyData();
      setShowCreateGroup(false);
    } catch (error) {
      console.error('Error creating family group:', error);
    }
  };

  const handleInviteMember = async (groupId: string, email: string, role: string = 'member') => {
    if (!user?.id) return;

    try {
      await api.family.inviteToFamilyGroup(groupId, user.id, email, role);
      setShowInviteMember(false);
      // Show success message
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await api.family.removeFamilyMember(memberId);
      await loadFamilyData();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      default:
        return 'Member';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Family Sharing</h1>
              <p className="mt-2 text-gray-600">Share vehicles and coordinate with your family</p>
            </div>
            <Button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Group</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'groups', label: 'Family Groups', icon: '👨‍👩‍👧‍👦' },
            { id: 'vehicles', label: 'Shared Vehicles', icon: '🚗' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {selectedTab === 'groups' && (
          <div className="space-y-6">
            {familyGroups.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Family Groups Yet</h3>
                <p className="text-gray-500 mb-6">Create your first family group to start sharing vehicles and coordinating with loved ones.</p>
                <Button onClick={() => setShowCreateGroup(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Family Group
                </Button>
              </Card>
            ) : (
              familyGroups.map((group) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
                        <p className="text-gray-600 mt-1">{group.description}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {group.family_members.length} member{group.family_members.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGroup(group);
                            setShowInviteMember(true);
                          }}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Invite
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Members List */}
                    <div className="space-y-3">
                      {group.family_members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              {member.users.avatar_url ? (
                                <img
                                  src={member.users.avatar_url}
                                  alt={member.users.full_name}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <span className="text-blue-600 font-semibold">
                                  {member.users.full_name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{member.users.full_name}</span>
                                {getRoleIcon(member.role)}
                                <span className="text-sm text-gray-500">{getRoleLabel(member.role)}</span>
                              </div>
                              <p className="text-sm text-gray-500">{member.users.email}</p>
                            </div>
                          </div>
                          {group.owner_id === user?.id && member.user_id !== user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'vehicles' && (
          <div className="space-y-6">
            {sharedVehicles.length === 0 ? (
              <Card className="p-8 text-center">
                <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Shared Vehicles</h3>
                <p className="text-gray-500">Vehicles shared with your family groups will appear here.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedVehicles.map((shared) => (
                  <motion.div
                    key={shared.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Car className="w-8 h-8 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {shared.vehicles.brand} {shared.vehicles.model}
                          </h3>
                          <p className="text-sm text-gray-600">{shared.vehicles.registration_number}</p>
                          <p className="text-sm text-gray-500 mt-1">Shared by {shared.family_groups.name}</p>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {shared.permissions.can_book && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Can Book
                              </span>
                            )}
                            {shared.permissions.can_view_location && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Can Track
                              </span>
                            )}
                            {shared.permissions.can_manage_documents && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                Can Manage Docs
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onSubmit={handleCreateGroup}
        />
      )}

      {/* Invite Member Modal */}
      {showInviteMember && selectedGroup && (
        <InviteMemberModal
          group={selectedGroup}
          onClose={() => {
            setShowInviteMember(false);
            setSelectedGroup(null);
          }}
          onSubmit={(email, role) => handleInviteMember(selectedGroup.id, email, role)}
        />
      )}
    </div>
  );
};

// Create Group Modal Component
const CreateGroupModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => void;
}> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), description: description.trim() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Family Group</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Smith Family"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of your family group"
                rows={3}
              />
            </div>
          </div>
          <div className="flex space-x-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Group
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Invite Member Modal Component
const InviteMemberModal: React.FC<{
  group: FamilyGroup;
  onClose: () => void;
  onSubmit: (email: string, role: string) => void;
}> = ({ group, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onSubmit(email.trim(), role);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Invite to {group.name}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="family-member@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Send Invitation
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Family;
