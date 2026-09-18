import "./SkeletonLoader.css";

/* ==========================================
   Card Skeleton
========================================== */

export function CardSkeleton({ count = 4 }) {

  return (

    <div className="skeleton-card-grid">

      {Array.from({ length: count }).map((_, index) => (

        <div
          key={index}
          className="skeleton-card"
        >

          <div className="skeleton skeleton-icon"></div>

          <div className="skeleton skeleton-title"></div>

          <div className="skeleton skeleton-text"></div>

          <div className="skeleton skeleton-text short"></div>

        </div>

      ))}

    </div>

  );

}

/* ==========================================
   Table Skeleton
========================================== */

export function TableSkeleton({

  rows = 8,

  columns = 5

}) {

  return (

    <div className="table-skeleton">

      <table>

        <thead>

          <tr>

            {Array.from({

              length: columns

            }).map((_, index) => (

              <th key={index}>

                <div className="skeleton skeleton-header"></div>

              </th>

            ))}

          </tr>

        </thead>

        <tbody>

          {Array.from({

            length: rows

          }).map((_, row) => (

            <tr key={row}>

              {Array.from({

                length: columns

              }).map((_, col) => (

                <td key={col}>

                  <div className="skeleton skeleton-cell"></div>

                </td>

              ))}

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

/* ==========================================
   Chart Skeleton
========================================== */

export function ChartSkeleton() {

  return (

    <div className="chart-skeleton">

      <div className="skeleton skeleton-chart-title"></div>

      <div className="skeleton skeleton-chart"></div>

    </div>

  );

}

/* ==========================================
   Dashboard Skeleton
========================================== */

export function DashboardSkeleton() {

  return (

    <>

      <CardSkeleton count={4} />

      <div className="dashboard-chart-grid">

        <ChartSkeleton />

        <ChartSkeleton />

      </div>

      <TableSkeleton
        rows={6}
        columns={6}
      />

    </>

  );

}

/* ==========================================
   List Skeleton
========================================== */

export function ListSkeleton({

  count = 6

}) {

  return (

    <div className="list-skeleton">

      {Array.from({

        length: count

      }).map((_, index) => (

        <div
          className="list-item"
          key={index}
        >

          <div className="skeleton avatar"></div>

          <div className="list-content">

            <div className="skeleton skeleton-title"></div>

            <div className="skeleton skeleton-text"></div>

          </div>

        </div>

      ))}

    </div>

  );

}

/* ==========================================
   Default Export
========================================== */

export default DashboardSkeleton;