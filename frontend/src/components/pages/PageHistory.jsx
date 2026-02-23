import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GitCommit,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Plus,
  Minus,
  Edit2,
  FileText,
} from 'lucide-react';
import { getPage } from '../../api/pages';
import { getPageCommits, getCommit } from '../../api/pulls';
import LoadingSpinner from '../common/LoadingSpinner';
import * as Diff from 'diff';

function extractText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  let text = '';
  if (node.text) text += node.text;
  if (node.content && Array.isArray(node.content)) {
    node.content.forEach((child, i) => {
      if (child.type === 'paragraph' && i > 0) text += '\n';
      text += extractText(child);
    });
  }
  return text;
}

function timeAgo(date) {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString();
}

function CommitDiff({ siteSlug, commit, thisPageId }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diffParts, setDiffParts] = useState([]);

  const toggle = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    setIsExpanded(true);
    if (detail) return; // already loaded

    setLoading(true);
    try {
      const res = await getCommit(siteSlug, commit.id);
      const commitData = res.data || res;
      setDetail(commitData);

      // Find the page entry for this specific page
      const pages = commitData.pages || [];
      const thisPage = pages.find(p => p.page_id === thisPageId);

      if (thisPage) {
        const oldText = thisPage.previous_content
          ? extractText(typeof thisPage.previous_content === 'string'
              ? JSON.parse(thisPage.previous_content)
              : thisPage.previous_content)
          : '';
        const newText = thisPage.content
          ? extractText(typeof thisPage.content === 'string'
              ? JSON.parse(thisPage.content)
              : thisPage.content)
          : '';
        setDiffParts(Diff.diffLines(oldText, newText));
      }
    } catch (err) {
      console.error('Failed to load commit detail', err);
    } finally {
      setLoading(false);
    }
  };

  const pageEntry = detail?.pages?.find(p => p.page_id === thisPageId);
  const action = pageEntry?.action || 'modified';

  const actionIcon = action === 'added'
    ? <Plus className="w-3 h-3 text-green-400" />
    : action === 'deleted'
    ? <Minus className="w-3 h-3 text-red-400" />
    : <Edit2 className="w-3 h-3 text-yellow-400" />;

  const actionBadgeClass = action === 'added'
    ? 'bg-green-900/40 text-green-400'
    : action === 'deleted'
    ? 'bg-red-900/40 text-red-400'
    : 'bg-yellow-900/40 text-yellow-400';

  return (
    <div>
      <button
        onClick={toggle}
        className="w-full text-left rounded-xl border p-4 transition-colors"
        style={{
          borderColor: 'var(--color-border-primary)',
          backgroundColor: isExpanded ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {isExpanded
              ? <ChevronDown className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              : <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            }
            <div>
              <div className="flex items-center gap-2 mb-1">
                {actionIcon}
                <p className="font-semibold text-sm">{commit.message}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded ${actionBadgeClass}`}>
                  {action}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {commit.user?.name || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(commit.created_at)}
                </span>
                {commit.branch && (
                  <span className="flex items-center gap-1 opacity-70">
                    {commit.branch.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <code
            className="text-xs font-mono px-2 py-0.5 rounded shrink-0"
            style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-accent)' }}
          >
            {commit.short_sha || commit.hash?.substring(0, 7) || String(commit.id).substring(0, 7)}
          </code>
        </div>
      </button>

      {/* Diff panel */}
      {isExpanded && (
        <div
          className="ml-7 mt-2 rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--color-border-primary)' }}
        >
          {loading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <>
              {/* Diff header */}
              <div
                className="flex items-center justify-between px-4 py-2 border-b text-xs"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-primary)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{pageEntry?.title || 'Page Content'}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-green-400">
                    +{diffParts.reduce((a, p) => p.added ? a + p.count : a, 0)} additions
                  </span>
                  <span className="text-red-400">
                    -{diffParts.reduce((a, p) => p.removed ? a + p.count : a, 0)} deletions
                  </span>
                </div>
              </div>

              {/* Diff lines */}
              <div className="overflow-x-auto font-mono text-xs leading-5">
                {diffParts.length > 0 ? diffParts.map((part, i) => {
                  const lines = part.value.replace(/\n$/, '').split('\n');
                  return lines.map((line, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="flex"
                      style={{
                        backgroundColor: part.added
                          ? 'rgba(46,160,67,0.12)'
                          : part.removed
                          ? 'rgba(248,81,73,0.12)'
                          : 'transparent',
                      }}
                    >
                      <div
                        className="w-8 flex-shrink-0 text-center py-0.5 select-none opacity-60"
                        style={{
                          backgroundColor: part.added
                            ? 'rgba(46,160,67,0.2)'
                            : part.removed
                            ? 'rgba(248,81,73,0.2)'
                            : 'transparent',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {part.added ? '+' : part.removed ? '-' : ' '}
                      </div>
                      <div
                        className="flex-1 px-3 py-0.5 whitespace-pre-wrap break-all"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {line || <br />}
                      </div>
                    </div>
                  ));
                }) : (
                  <div
                    className="p-6 text-center italic text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    No text changes detected in this commit.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function PageHistory() {
  const { siteSlug, pageSlug } = useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(null);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!siteSlug || !pageSlug) return;
    loadData();
  }, [siteSlug, pageSlug]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load page meta (needed for the page ID to filter commits)
      const pageRes = await getPage(siteSlug, pageSlug);
      const pageData = pageRes.data || pageRes;
      setPage(pageData);

      // Load commits for this page
      const commitsRes = await getPageCommits(siteSlug, pageData.id);
      const list = commitsRes?.data || commitsRes || [];
      setCommits(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load page history', err);
      setError('Failed to load history. The page may not exist or you may not have access.');
    } finally {
      setLoading(false);
    }
  };

  // Group commits by date
  const grouped = commits.reduce((acc, commit) => {
    const date = new Date(commit.created_at).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(commit);
    return acc;
  }, {});

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-4 border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
          <button
            onClick={() => navigate(`/sites/${siteSlug}/pages/${pageSlug}`)}
            className="p-2 rounded-full transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Back to page"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <GitCommit size={24} style={{ color: 'var(--color-accent)' }} />
            <div>
              <h1 className="text-2xl font-bold">Version History</h1>
              {page && (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Showing commits for{' '}
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {page.title}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-16" style={{ color: 'var(--color-error)' }}>
            <p>{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 text-sm rounded-lg border transition-colors"
              style={{ borderColor: 'var(--color-border-primary)', color: 'var(--color-text-secondary)' }}
            >
              Try again
            </button>
          </div>
        ) : commits.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
            <GitCommit className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No commit history yet</p>
            <p className="text-sm">
              History will appear here after you commit changes using the{' '}
              <strong>Commit</strong> button in the editor.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([dateStr, dayCommits]) => (
              <div key={dateStr}>
                {/* Date group header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  />
                  <h2
                    className="text-sm font-semibold"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {new Date(dateStr).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h2>
                  <div
                    className="flex-1 h-px"
                    style={{ backgroundColor: 'var(--color-border-primary)' }}
                  />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {dayCommits.length} commit{dayCommits.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Commits for this date */}
                <div
                  className="space-y-2 ml-4 pl-6 border-l-2"
                  style={{ borderColor: 'var(--color-border-primary)' }}
                >
                  {dayCommits.map(commit => (
                    <CommitDiff
                      key={commit.id}
                      siteSlug={siteSlug}
                      commit={commit}
                      thisPageId={page?.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
