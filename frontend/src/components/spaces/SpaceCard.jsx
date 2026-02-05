import { Link, useNavigate } from 'react-router-dom';
import { FileText, Lock, Globe, MoreHorizontal, Trash2, Settings } from 'lucide-react';
import Dropdown from '../common/Dropdown';

function SpaceCard({ space, onDelete }) {
  const navigate = useNavigate();
  const isPublic = space.visibility === 'public' || space.is_published;

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${space.name}"?`)) {
      onDelete(space.id);
    }
  };

  return (
    <Link
      to={`/spaces/${space.id}`}
      className="
        block p-5 rounded-xl
        bg-[var(--color-bg-primary)]
        border border-[var(--color-border)]
        hover:border-[var(--color-accent)]
        hover:shadow-lg hover:shadow-[var(--color-accent)]/5
        transition-all duration-200
        group
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="
          w-12 h-12 rounded-lg
          bg-gradient-to-br from-[var(--color-accent)] to-blue-600
          flex items-center justify-center
          text-white
        ">
          <FileText size={24} />
        </div>
        
        <div 
          onClick={(e) => e.preventDefault()}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Dropdown
            trigger={
              <button className="
                p-1.5 rounded-lg
                text-[var(--color-text-muted)]
                hover:bg-[var(--color-bg-secondary)]
                hover:text-[var(--color-text-primary)]
              ">
                <MoreHorizontal size={18} />
              </button>
            }
          >
            <Dropdown.Item icon={Settings} onClick={() => navigate(`/spaces/${space.id}/settings`)}>
              Settings
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item icon={Trash2} onClick={handleDelete} danger>
              Delete
            </Dropdown.Item>
          </Dropdown>
        </div>
      </div>

      {/* Title */}
      <h3 className="
        font-semibold text-[var(--color-text-primary)]
        group-hover:text-[var(--color-accent)]
        transition-colors mb-1
      ">
        {space.name}
      </h3>

      {/* Description */}
      {space.description && (
        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
          {space.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 pt-3 border-t border-[var(--color-border)]">
        <span className={`
          inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
          ${isPublic 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }
        `}>
          {isPublic ? <Globe size={12} /> : <Lock size={12} />}
          {isPublic ? 'Public' : 'Private'}
        </span>
        
        {space.pages_count !== undefined && (
          <span className="text-xs text-[var(--color-text-muted)]">
            {space.pages_count} pages
          </span>
        )}
      </div>
    </Link>
  );
}

export default SpaceCard;
