import { Loader2, RefreshCw } from "lucide-react";
import { Navigate } from "react-router-dom";
import { isLocalhost } from "../../lib/is-localhost";
import { useDownloadTrackingAdmin } from "./useDownloadTrackingAdmin";

export function AdminDownloadsPage() {
  const { status, stats, errorMessage, refresh } = useDownloadTrackingAdmin();

  if (!isLocalhost()) {
    return <Navigate to="/" replace />;
  }

  const totalDownloads = stats.reduce((sum, row) => sum + row.totalCount, 0);
  const totalUnique = stats.reduce((sum, row) => sum + row.uniqueCount, 0);

  return (
    <div className="content-grid admin-downloads-grid">
      <section className="panel admin-downloads-panel">
        <div className="admin-downloads-header">
          <div>
            <p className="section-label">Localhost Admin</p>
            <h1>Download tracking</h1>
            <p className="admin-downloads-note">
              Counts file download clicks from the public site. This page is only available on localhost.
            </p>
          </div>
          <button type="button" className="secondary-button admin-downloads-refresh" onClick={refresh}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>

        <div className="admin-downloads-summary">
          <div className="admin-downloads-stat">
            <span className="admin-downloads-stat-label">Total clicks</span>
            <strong>{totalDownloads}</strong>
          </div>
          <div className="admin-downloads-stat">
            <span className="admin-downloads-stat-label">Unique visitors</span>
            <strong>{totalUnique}</strong>
          </div>
        </div>

        {status === "loading" ? (
          <p className="admin-downloads-loading">
            <Loader2 size={16} className="spin-icon" aria-hidden="true" />
            Loading download stats…
          </p>
        ) : null}

        {errorMessage ? (
          <p role="alert" className="counter-error">
            {errorMessage}
          </p>
        ) : null}

        {status !== "loading" && !errorMessage ? (
          <div className="admin-downloads-table-wrap">
            <table className="admin-downloads-table">
              <thead>
                <tr>
                  <th scope="col">File</th>
                  <th scope="col">Total clicks</th>
                  <th scope="col">Unique visitors</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((row) => (
                  <tr key={row.fileKey}>
                    <td>{row.label}</td>
                    <td>{row.totalCount}</td>
                    <td>{row.uniqueCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
