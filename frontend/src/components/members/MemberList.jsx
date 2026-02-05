import { useState, useEffect } from 'react';
import { User, Crown, Edit3, Eye, MoreVertical, Trash2, UserPlus } from 'lucide-react';
import { getMembers, updateMember, removeMember } from '../../api/members';
import Dropdown from '../common/Dropdown';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import InviteModal from './InviteModal';

const roleIcons = {
  owner: Crown,
  editor: Edit3,
  viewer: Eye,
};

const roleLabels = {
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
};

const roleColors = {
  owner: 'text-yellow-600 bg-yellow-50',
  editor: 'text-blue-600 bg-blue-50',
  viewer: 'text-gray-600 bg-gray-50',
};

function MemberItem({ member, spaceId, currentUserId, isOwner, onUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const RoleIcon = roleIcons[member.role] || User;
  const isCurrentUser = member.user?.id === currentUserId;
  const canManage = isOwner && !isCurrentUser && member.role !== 'owner';

  const handleRoleChange = async (newRole) => {
    setIsUpdating(true);
    try {
      await updateMember(spaceId, member.id, { role: newRole });
      onUpdate();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
    setIsUpdating(false);
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${member.user?.name} from this space?`)) return;
    
    setIsUpdating(true);
    try {
      await removeMember(spaceId, member.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
    setIsUpdating(false);
  };

  return (
    <div className="
      flex items-center justify-between p-4
      border-b border-[var(--color-border)] last:border-b-0
      hover:bg-[var(--color-bg-secondary)] transition-colors
    ">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {member.user?.avatar_url ? (
          <img 
            src={member.user.avatar_url} 
            alt={member.user.name}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="
            w-10 h-10 rounded-full
            bg-[var(--color-bg-tertiary)]
            flex items-center justify-center
            text-[var(--color-text-secondary)] font-medium
          ">
            {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--color-text-primary)]">
              {member.user?.name || 'Unknown'}
            </span>
            {isCurrentUser && (
              <span className="text-xs text-[var(--color-text-muted)]">(you)</span>
            )}
          </div>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {member.user?.email}
          </span>
        </div>
      </div>

      {/* Role & Actions */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <span className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
          text-xs font-medium
          ${roleColors[member.role]}
        `}>
          <RoleIcon size={12} />
          {roleLabels[member.role]}
        </span>

        {/* Actions */}
        {canManage && (
          <Dropdown
            trigger={
              <button className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                {isUpdating ? <LoadingSpinner size="sm" /> : <MoreVertical size={16} />}
              </button>
            }
            align="right"
          >
            <Dropdown.Item onClick={() => handleRoleChange('editor')}>
              <Edit3 size={14} /> Make Editor
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleRoleChange('viewer')}>
              <Eye size={14} /> Make Viewer
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleRemove} danger>
              <Trash2 size={14} /> Remove
            </Dropdown.Item>
          </Dropdown>
        )}
      </div>
    </div>
  );
}

function MemberList({ spaceId, currentUserId }) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState(null);

  const currentUserRole = members.find(m => m.user?.id === currentUserId)?.role;
  const isOwner = currentUserRole === 'owner';

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getMembers(spaceId);
      setMembers(response.data || response);
    } catch (err) {
      setError('Failed to load members');
      console.error(err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (spaceId) {
      fetchMembers();
    }
  }, [spaceId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-[var(--color-text-secondary)]">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          Members ({members.length})
        </h3>
        {isOwner && (
          <Button variant="primary" size="sm" onClick={() => setShowInvite(true)}>
            <UserPlus size={16} />
            Invite
          </Button>
        )}
      </div>

      {/* Member List */}
      <div>
        {members.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-text-muted)]">
            No members yet
          </div>
        ) : (
          members.map((member) => (
            <MemberItem
              key={member.id}
              member={member}
              spaceId={spaceId}
              currentUserId={currentUserId}
              isOwner={isOwner}
              onUpdate={fetchMembers}
            />
          ))
        )}
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        spaceId={spaceId}
        onInvited={fetchMembers}
      />
    </div>
  );
}

export default MemberList;
