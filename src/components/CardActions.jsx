import { SyncIcon, DownloadIcon, MoreIcon } from './Icons.jsx';

// The small circular action icons in a panel header (refresh / download / more),
// matching the reference dashboard. Handlers are optional.
export default function CardActions({ onRefresh, onDownload, onMore }) {
  return (
    <div className="card-actions no-print">
      {onRefresh && (
        <button className="card-act" onClick={onRefresh} aria-label="Refresh" title="Refresh">
          <SyncIcon size={15} />
        </button>
      )}
      {onDownload && (
        <button className="card-act" onClick={onDownload} aria-label="Download" title="Download">
          <DownloadIcon size={15} />
        </button>
      )}
      <button className="card-act" onClick={onMore} aria-label="More" title="More">
        <MoreIcon size={15} />
      </button>
    </div>
  );
}
