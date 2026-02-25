import { useState, useEffect } from 'react';
import { Users, Mail, Trash2, Shield, UserPlus, X, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { getSiteMembers, addSiteMember, removeSiteMember } from '../../api/sites';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmModal from '../common/ConfirmModal';

const ROLE_CONFIG = {
  owner:    { label: 'Owner',      color: 'text-amber-500',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  icon: Crown },
  admin:    { label: 'Admin',      color: 'text-red-500',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    icon: Shield },
  maintain: { label: 'Maintainer', color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: Shield },
  write:    { label: 'Editor',     color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent)]/10', border: 'border-[var(--color-accent)]/20', icon: Shield },
  read:     { label: 'Viewer',     color: 'text-[var(--color-text-muted)]', bg: 'bg-[var(--color-bg-hover)]', border: 'border-[var(--color-border-primary)]', icon: Shield },
};

export default function SiteMembers({ siteSlug }) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('write');
  const [memberToRemove, setMemberToRemove] = useState(null);

  useEffect(() => { fetchMembers(); }, [siteSlug]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const data = await getSiteMembers(siteSlug);
      setMembers(data.data || []);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      await addSiteMember(siteSlug, inviteEmail, inviteRole);
      toast.success('Member invited successfully');
      setInviteEmail('');
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await removeSiteMember(siteSlug, memberToRemove.id);
      toast.success(`${memberToRemove.name} removed`);
      setMembers(members.filter(m => m.id !== memberToRemove.id));
      setMemberToRemove(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <section className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border-primary)] p-6">
      {/* Section Header */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Users size={18} className="text-blue-500" />
          Collaborators
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Manage who has access to edit and view this site.
        </p>
      </div>

      {/* ── Invite Form ── */}
      <form
        onSubmit={handleInvite}
        className="mb-6 p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border-primary)]"
      >
        <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Invite New Member
        </label>
        <div className="flex gap-2">
          {/* Email input */}
          <div className="flex-1 relative">
            <Mail
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]/50 transition-all"
              required
            />
          </div>

          {/* Role select */}
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]/50 transition-all"
          >
            <option value="read">Viewer</option>
            <option value="write">Editor</option>
            <option value="maintain">Maintainer</option>
            <option value="admin">Admin</option>
          </select>

          <Button
            type="submit"
            size="sm"
            disabled={isInviting || !inviteEmail}
            isLoading={isInviting}
            icon={UserPlus}
          >
            Invite
          </Button>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          User must have an account registered with this email.
        </p>
      </form>

      {/* ── Members List ── */}
      <div>
        <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Current Members ({members.length})
        </label>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-10 text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] rounded-xl border border-dashed border-[var(--color-border-primary)]">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No collaborators yet.</p>
            <p className="text-xs mt-0.5">Invite someone above!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(member => {
              const roleKey = member.role?.toLowerCase() ?? 'read';
              const role = ROLE_CONFIG[roleKey] ?? ROLE_CONFIG.read;
              const RoleIcon = role.icon;
              const isOwner = roleKey === 'owner';

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border-primary)] group hover:border-[var(--color-border-hover)] transition-all"
                >
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-9 h-9 rounded-full ring-2 ring-[var(--color-bg-secondary)] object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-[var(--color-bg-secondary)] shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{member.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{member.email}</p>
                    </div>
                  </div>

                  {/* Role badge + Remove */}
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${role.color} ${role.bg} ${role.border}`}>
                      <RoleIcon size={10} />
                      {role.label}
                    </span>

                    {!isOwner && (
                      <button
                        onClick={() => setMemberToRemove(member)}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove member"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Remove Confirm Modal */}
      <ConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.name} from this site? They will lose access immediately.`}
        confirmText="Remove Member"
        variant="danger"
      />
    </section>
  );
}
