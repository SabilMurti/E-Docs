import { useState, useEffect } from 'react';
import { Users, Mail, Trash2, Shield, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { getSiteMembers, addSiteMember, removeSiteMember } from '../../api/sites';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmModal from '../common/ConfirmModal';

export default function SiteMembers({ siteId }) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [memberToRemove, setMemberToRemove] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, [siteId]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const data = await getSiteMembers(siteId);
      setMembers(data.data || []);
    } catch (err) {
      console.error('Failed to fetch members:', err);
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
      await addSiteMember(siteId, inviteEmail, inviteRole);
      toast.success('Member invited successfully');
      setInviteEmail('');
      fetchMembers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeSiteMember(siteId, memberToRemove.id);
      toast.success('Member removed');
      setMembers(members.filter(m => m.id !== memberToRemove.id));
      setMemberToRemove(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="bg-[#1c1c1c] rounded-2xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
        <Users size={20} className="text-blue-400" />
        Collaborators
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Manage who has access to edit and view this site.
      </p>

      {/* Invite Form */}
      <form onSubmit={handleInvite} className="mb-8 p-4 bg-[#252525] rounded-xl border border-white/5">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Invite New Member
        </label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full pl-9 pr-4 py-2 bg-[#1c1c1c] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
              required
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="px-3 py-2 bg-[#1c1c1c] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit" disabled={isInviting || !inviteEmail} isLoading={isInviting} size="sm">
            <UserPlus size={16} />
            Invite
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          User must have an account registered with this email.
        </p>
      </form>

      {/* Members List */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Current Members ({members.length})
        </label>
        
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-[#252525]/50 rounded-xl border border-white/5 border-dashed">
            No collaborators yet. Invite someone above!
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-[#252525] rounded-xl group transition-colors hover:bg-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.name} className="w-9 h-9 rounded-full ring-2 ring-[#1c1c1c]" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium text-sm ring-2 ring-[#1c1c1c]">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="px-2 py-0.5 rounded text-xs font-medium bg-[#1c1c1c] text-gray-300 border border-white/5 uppercase tracking-wide flex items-center gap-1">
                    <Shield size={10} className={
                        member.role === 'admin' ? 'text-purple-400' : 
                        member.role === 'editor' ? 'text-blue-400' : 'text-gray-400'
                    } />
                    {member.role}
                  </div>
                  
                  <button 
                    onClick={() => setMemberToRemove(member)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove member"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.name} from this site?`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}
