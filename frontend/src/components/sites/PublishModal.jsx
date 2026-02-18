import { useState } from 'react';
import { Globe, X, ExternalLink, Copy, Check, AlertCircle } from 'lucide-react';
import { publishSite, unpublishSite } from '../../api/sites';
import useSiteStore from '../../stores/siteStore';
import LoadingSpinner from '../common/LoadingSpinner';

export default function PublishModal({ isOpen, onClose, site }) {
  const { fetchSite } = useSiteStore(); // To refresh site data after publish
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !site) return null;

  // Construct public URL
  // TODO: Use env variable for base URL if needed, currently using window location
  const publicUrl = `${window.location.origin}/public/${site.slug}`;

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    try {
      await publishSite(site.id);
      await fetchSite(site.id); // Refresh state
      // Don't close modal, show success state instead
    } catch (err) {
      console.error(err);
      setError('Failed to publish site.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Are you sure? The public link will stop working immediately.')) return;
    
    setLoading(true);
    setError(null);
    try {
      await unpublishSite(site.id);
      await fetchSite(site.id);
    } catch (err) {
      console.error(err);
      setError('Failed to unpublish site.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-[#0d1117]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe size={18} className={site.is_published ? "text-green-400" : "text-gray-400"} />
            {site.is_published ? 'Site is Live' : 'Publish to Web'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {site.is_published ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                  <Globe size={32} className="text-green-400" />
                </div>
                <h3 className="text-white font-medium mb-1">Your site is published!</h3>
                <p className="text-sm text-gray-400">
                  Anyone with the link can view your documentation.
                </p>
              </div>

              {/* URL Box */}
              <div className="bg-[#0d1117] border border-gray-700 rounded-lg p-1 flex items-center pl-3">
                 <div className="truncate text-sm text-gray-300 flex-1 font-mono">
                    {publicUrl}
                 </div>
                 <button 
                   onClick={copyToClipboard}
                   className="p-2 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white transition-colors ml-1"
                   title="Copy Link"
                 >
                   {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                 </button>
                 <a 
                   href={publicUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="p-2 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white transition-colors ml-1"
                   title="Open in new tab"
                 >
                   <ExternalLink size={16} />
                 </a>
              </div>

              {/* Unpublish Zone */}
              <div className="border-t border-gray-700 pt-6 mt-6">
                <button 
                  onClick={handleUnpublish}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Unpublish Site'}
                </button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  This will immediately make your site private.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
                  <Globe size={32} className="text-blue-400" />
                </div>
                <h3 className="text-white font-medium mb-1">Make your knowledge public</h3>
                <p className="text-sm text-gray-400">
                  Publishing creates a public link for your site. You can unpublish at any time.
                </p>
              </div>

              <div className="bg-[#0d1117] border border-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 min-w-[5px] h-[5px] rounded-full bg-blue-400" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-200">Public Access</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Pages in this site will be visible to anyone with the link.
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handlePublish}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all font-semibold flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? <LoadingSpinner size="sm" color="white" /> : (
                  <>
                    <Globe size={18} />
                    Publish Now
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
