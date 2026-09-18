import "./AssetTable.css";

function AssetTable({
  assets = [],
  onView,
  onEdit,
  onDelete,
}) {
  if (assets.length === 0) {
    return (
      <div className="no-data">
        <h3>No Assets Found</h3>
        <p>No assets available in the inventory.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="asset-table">

        <thead>
          <tr>
            <th>ID</th>
            <th>Asset Name</th>
            <th>Type</th>
            <th>Hostname</th>
            <th>IP Address</th>
            <th>Operating System</th>
            <th>Owner</th>
            <th>Department</th>
            <th>Health</th>
            <th>Status</th>
            <th>Risk</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {assets.map((asset) => (

            <tr key={asset.id}>

              <td>{asset.id}</td>

              <td>{asset.assetName}</td>

              <td>{asset.assetType}</td>

              <td>{asset.hostname}</td>

              <td>{asset.ipAddress}</td>

              <td>{asset.operatingSystem}</td>

              <td>{asset.owner}</td>

              <td>{asset.department}</td>

              <td>
                <span
                  className={`status ${
                    asset.health?.toLowerCase() || ""
                  }`}
                >
                  {asset.health}
                </span>
              </td>

              <td>
                <span
                  className={`status ${
                    asset.status?.toLowerCase() || ""
                  }`}
                >
                  {asset.status}
                </span>
              </td>

              <td>
                <span
                  className={
                    asset.riskScore >= 80
                      ? "risk-high"
                      : asset.riskScore >= 50
                      ? "risk-medium"
                      : "risk-low"
                  }
                >
                  {asset.riskScore}%
                </span>
              </td>

              <td className="action-buttons">

                {onView && (
                  <button
                    className="view-btn"
                    onClick={() => onView(asset)}
                  >
                    View
                  </button>
                )}

                <button
                  className="edit-btn"
                  onClick={() => onEdit(asset)}
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => onDelete(asset.id)}
                >
                  Delete
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>
    </div>
  );
}

export default AssetTable;