import { useState } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  History
} from 'lucide-react';
import usePageStore from '../../stores/pageStore';
import Button from '../common/Button';
import Dropdown from '../common/Dropdown';

function PageTreeItem({ page, spaceId, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { deletePage } = usePageStore();
  const hasChildren = page.children && page.children.length > 0;
  const isActive = pageId === page.id;

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this page?')) {
      await deletePage(spaceId, page.id);
    }
  };

  return (
    <div>
      <div 
        className={`
          group flex items-center gap-1 py-1.5 px-2 rounded-lg
          cursor-pointer transition-colors
          ${isActive 
            ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]' 
            : 'hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={`
            p-0.5 rounded transition-colors
            ${hasChildren ? 'hover:bg-[var(--color-bg-tertiary)]' : 'invisible'}
          `}
        >
          {isExpanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>

        {/* Page Link */}
        <NavLink
          to={`/spaces/${spaceId}/pages/${page.id}`}
          className="flex-1 flex items-center gap-2 text-sm truncate"
        >
          <FileText size={14} className="shrink-0" />
          <span className="truncate">{page.title}</span>
        </NavLink>

        {/* Actions */}
        <div className={`transition-opacity flex items-center ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/spaces/${spaceId}/pages/${page.id}/history`);
            }}
            className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] mr-1 text-[var(--color-text-secondary)]"
            title="View History"
          >
            <History size={14} />
          </button>
          
          <Dropdown
            trigger={
              <button className="p-1 rounded hover:bg-[var(--color-bg-tertiary)]">
                <MoreHorizontal size={14} />
              </button>
            }
            align="right"
          >
            <Dropdown.Item icon={Edit} onClick={() => navigate(`/spaces/${spaceId}/pages/${page.id}`)}>
              Edit
            </Dropdown.Item>
            <Dropdown.Item icon={Plus}>Add subpage</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item icon={Trash2} onClick={handleDelete} danger>
              Delete
            </Dropdown.Item>
          </Dropdown>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {page.children.map((child) => (
            <PageTreeItem 
              key={child.id} 
              page={child} 
              spaceId={spaceId}
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar({ spaceId }) {
  const { pages, isLoading, createPage } = usePageStore();

  const handleAddPage = async () => {
    const title = prompt('Enter page title:');
    if (title) {
      await createPage(spaceId, { title, content: {} });
    }
  };

  return (
    <aside className="
      fixed left-0 top-[var(--navbar-height)]
      w-[var(--sidebar-width)] h-[calc(100vh-var(--navbar-height))]
      bg-[var(--color-bg-sidebar)]
      border-r border-[var(--color-border)]
      flex flex-col
    ">
      <div className="flex-1 overflow-y-auto p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm text-[var(--color-text-primary)]">
            Pages
          </h3>
          <Button variant="ghost" size="sm" onClick={handleAddPage} className="!p-1.5">
            <Plus size={16} />
          </Button>
        </div>

        {/* Page Tree */}
        {isLoading ? (
          <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
            Loading...
          </div>
        ) : pages.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--color-text-muted)] mb-3">
              No pages yet
            </p>
            <Button variant="secondary" size="sm" onClick={handleAddPage}>
              <Plus size={14} />
              Add your first page
            </Button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {pages.map((page) => (
              <PageTreeItem 
                key={page.id} 
                page={page} 
                spaceId={spaceId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom - Settings Link */}
      <div className="border-t border-[var(--color-border)] p-3">
        <NavLink
          to={`/spaces/${spaceId}/settings`}
          className={({ isActive }) => `
            flex items-center gap-2 px-3 py-2 rounded-lg
            text-sm transition-colors
            ${isActive 
              ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]' 
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;
