import "./Assets.css";

function AssetDetailsModal({ asset, onClose }) {
  if (!asset) return null;

  return (
    <div className="modal-overlay">
      <div className="asset-modal">

        <div className="modal-header">
          <h2>Asset Details</h2>

          <button
            className="close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">

          <div className="detail-row">
            <span>ID</span>
            <strong>{asset.id}</strong>
          </div>

          <div className="detail-row">
            <span>Hostname</span>
            <strong>{asset.hostname}</strong>
          </div>

          <div className="detail-row">
            <span>IP Address</span>
            <strong>{asset.ipAddress}</strong>
          </div>

          <div className="detail-row">
            <span>Operating System</span>
            <strong>{asset.operatingSystem}</strong>
          </div>

          <div className="detail-row">
            <span>Owner</span>
            <strong>{asset.owner}</strong>
          </div>

          <div className="detail-row">
            <span>Status</span>
            <strong>{asset.status}</strong>
          </div>

          <div className="detail-row">
            <span>Patch Level</span>
            <strong>{asset.patchLevel}%</strong>
          </div>

          <div className="detail-row">
            <span>Assigned Date</span>
            <strong>
              {asset.assignedDate
                ? new Date(asset.assignedDate).toLocaleString()
                : "-"}
            </strong>
          </div>

        </div>

        <div className="modal-footer">
          <button
            className="close-modal-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

export default AssetDetailsModal;