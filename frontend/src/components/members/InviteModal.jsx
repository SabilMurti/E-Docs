import { useState } from 'react';
import { Mail, UserPlus } from 'lucide-react';
import { inviteMember } from '../../api/members';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

function InviteModal({ isOpen, onClose, spaceId, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await inviteMember(spaceId, { email, role });
      setSuccess(true);
      setEmail('');
      setRole('viewer');
      
      // Refresh member list
      if (onInvited) onInvited();
      
      // Close after short delay
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setEmail('');
    setRole('viewer');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        {success ? (
          <div className="text-center py-6">
            <div className="
              w-16 h-16 mx-auto mb-4
              bg-green-100 rounded-full
              flex items-center justify-center
            ">
              <UserPlus size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
              Invitation Sent!
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              An invitation has been sent to the email.
            </p>
          </div>
        ) : (
          <>
            {/* Email Input */}
            <Input
              label="Email Address"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              required
              icon={<Mail size={18} className="text-[var(--color-text-muted)]" />}
            />

            {/* Role Select */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="
                  w-full px-3 py-2.5 rounded-lg
                  bg-[var(--color-bg-primary)]
                  border border-[var(--color-border)]
                  text-[var(--color-text-primary)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]
                "
              >
                <option value="viewer">Viewer - Can view content</option>
                <option value="editor">Editor - Can edit content</option>
              </select>
            </div>

            {/* Role Description */}
            <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-sm">
              {role === 'viewer' ? (
                <p className="text-[var(--color-text-secondary)]">
                  <strong>Viewers</strong> can read all pages but cannot make changes.
                </p>
              ) : (
                <p className="text-[var(--color-text-secondary)]">
                  <strong>Editors</strong> can create, edit, and delete pages in this space.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                <UserPlus size={16} />
                Send Invitation
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

export default InviteModal;
