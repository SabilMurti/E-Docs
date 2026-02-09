import { useState, useRef, useEffect } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Plus,
  MoreHorizontal,
  Trash2,
  Copy,
  ExternalLink,
  Grid,
  Book,
  X
} from 'lucide-react';
import usePageStore from '../../stores/pageStore';
import Dropdown from '../common/Dropdown';
import ConfirmModal from '../common/ConfirmModal';
import InputModal from '../common/InputModal';

// Compact Page Tree Item
function PageTreeItem({ page, siteId, level = 0, onDeleteRequest, onAddSubpageRequest }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { pageId } = useParams();
  const navigate = useNavigate();
  const hasChildren = page.children && page.children.length > 0;
  const isActive = pageId === page.id;

  // Compact indentation: 16px per level
  const paddingLeft = level * 16 + 8;

  return (
    <div>
      <div 
        className={`
          group flex items-center gap-1.5 py-1 pr-1.5 rounded-md
          cursor-pointer transition-colors text-[13px] select-none
          ${isActive 
            ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
          }
        `}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={() => navigate(`/sites/${siteId}/pages/${page.id}`)}
      >
        {/* Expand/Collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={`
            p-0.5 rounded hover:bg-[var(--color-bg-hover)] transition-colors
            ${hasChildren ? '' : 'invisible'}
          `}
        >
          {isExpanded ? (
            <ChevronDown size={12} strokeWidth={2.5} />
          ) : (
            <ChevronRight size={12} strokeWidth={2.5} />
          )}
        </button>

        {/* Icon */}
        {page.icon && (
          <span className="text-sm leading-none shrink-0">{page.icon}</span>
        )}

        {/* Title */}
        <span className="truncate flex-1">{page.title || 'Untitled'}</span>

        {/* Actions (hover only) */}
        <div 
          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Dropdown
            trigger={
              <button className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]">
                <MoreHorizontal size={12} />
              </button>
            }
            align="right"
          >
            <Dropdown.Item icon={Plus} onClick={() => onAddSubpageRequest(page.id)}>
              Add subpage
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item icon={Trash2} onClick={() => onDeleteRequest(page)} danger>
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
              siteId={siteId}
              level={level + 1}
              onDeleteRequest={onDeleteRequest}
              onAddSubpageRequest={onAddSubpageRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main Sidebar Component
function Sidebar({ siteId, isOpen, onClose }) {
  const { pages, isLoading, createPage, deletePage } = usePageStore();
  const [activeTab, setActiveTab] = useState('pages');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pageToDelete, setPageToDelete] = useState(null);
  const [parentIdForNewPage, setParentIdForNewPage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPage = (e) => {
    e?.stopPropagation();
    setParentIdForNewPage(null);
    setShowAddModal(true);
  };

  const handleAddSubpage = (parentId) => {
    setParentIdForNewPage(parentId);
    setShowAddModal(true);
  };

  const handleCreatePage = async (title) => {
    setIsSubmitting(true);
    try {
      await createPage(siteId, { 
        title, 
        content: {},
        parent_id: parentIdForNewPage 
      });
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (page) => {
    setPageToDelete(page);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!pageToDelete) return;
    setIsSubmitting(true);
    try {
      await deletePage(siteId, pageToDelete.id);
      setShowDeleteModal(false);
      setPageToDelete(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 left-0 z-50 lg:z-auto
        w-[220px] h-screen lg:h-[calc(100vh-var(--navbar-height,0px))]
        bg-[var(--color-bg-secondary)] 
        border-r border-[var(--color-border-primary)]
        flex flex-col
        transition-transform duration-200 ease-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header Tabs */}
        <div className="flex items-center px-3 pt-3 pb-2 border-b border-[var(--color-border-primary)]">
          <button 
            onClick={() => setActiveTab('pages')}
            className={`
              pb-2 text-xs font-medium mr-4 transition-colors relative
              ${activeTab === 'pages' 
                ? 'text-[var(--color-text-primary)]' 
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }
            `}
          >
            Pages
            {activeTab === 'pages' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-accent)] rounded-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`
              pb-2 text-xs font-medium transition-colors relative
              ${activeTab === 'library' 
                ? 'text-[var(--color-text-primary)]' 
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }
            `}
          >
            Library
            {activeTab === 'library' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-accent)] rounded-full" />
            )}
          </button>

          {/* Mobile Close */}
          <button
            onClick={onClose}
            className="lg:hidden ml-auto p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === 'pages' ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Pages
                </span>
                <button 
                  onClick={handleAddPage}
                  className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                  title="Create new page"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Page Tree */}
              {isLoading ? (
                <div className="py-6 text-center">
                  <div className="w-full h-0.5 bg-[var(--color-bg-hover)] overflow-hidden rounded-full">
                    <div className="h-full bg-[var(--color-accent)]/50 w-1/3 animate-pulse" />
                  </div>
                </div>
              ) : pages.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText size={20} className="mx-auto mb-2 text-[var(--color-text-muted)] opacity-50" />
                  <p className="text-xs text-[var(--color-text-muted)]">No pages yet</p>
                  <button 
                    onClick={handleAddPage}
                    className="mt-2 text-[var(--color-accent)] text-xs hover:underline"
                  >
                    Create one?
                  </button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {pages.map((page) => (
                    <PageTreeItem 
                      key={page.id} 
                      page={page} 
                      siteId={siteId}
                      onDeleteRequest={handleDeleteRequest}
                      onAddSubpageRequest={handleAddSubpage}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Book size={20} className="text-[var(--color-text-muted)] mb-2" />
              <p className="text-xs text-[var(--color-text-muted)]">Library is empty</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Reusable blocks appear here</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-[var(--color-border-primary)]">
          <button className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-md transition-colors">
            <Grid size={14} />
            <span>Developer Platform</span>
          </button>
        </div>
      </aside>

      {/* Add Page Modal */}
      <InputModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreatePage}
        title={parentIdForNewPage ? "Add Subpage" : "Add New Page"}
        message="Enter a title for your page."
        placeholder="e.g. Getting Started"
        submitText="Create"
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPageToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Page"
        message={`Are you sure you want to delete "${pageToDelete?.title}"?`}
        confirmText="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </>
  );
}

export default Sidebar;
