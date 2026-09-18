import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaSort,
  FaSortUp,
  FaSortDown
} from "react-icons/fa";

import "./AnimatedTable.css";

export default function AnimatedTable({

  columns = [],

  data = [],

  loading = false,

  pageSize = 10,

  searchable = true,

  onView,

  onEdit,

  onDelete

}) {

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [sortField, setSortField] = useState("");

  const [sortOrder, setSortOrder] = useState("asc");

  /* ==========================
     Search
  ========================== */

  const filteredData = useMemo(() => {

    return data.filter((row) =>

      Object.values(row)

        .join(" ")

        .toLowerCase()

        .includes(search.toLowerCase())

    );

  }, [search, data]);

  /* ==========================
     Sorting
  ========================== */

  const sortedData = useMemo(() => {

    if (!sortField)

      return filteredData;

    return [...filteredData].sort(

      (a, b) => {

        const valueA = a[sortField];

        const valueB = b[sortField];

        if (valueA < valueB)

          return sortOrder === "asc"

            ? -1

            : 1;

        if (valueA > valueB)

          return sortOrder === "asc"

            ? 1

            : -1;

        return 0;

      }

    );

  }, [

    filteredData,

    sortField,

    sortOrder

  ]);

  /* ==========================
     Pagination
  ========================== */

  const totalPages = Math.ceil(

    sortedData.length / pageSize

  );

  const paginatedData = sortedData.slice(

    (page - 1) * pageSize,

    page * pageSize

  );

  const handleSort = (field) => {

    if (sortField === field) {

      setSortOrder(

        sortOrder === "asc"

          ? "desc"

          : "asc"

      );

    }

    else {

      setSortField(field);

      setSortOrder("asc");

    }

  };

  const renderSortIcon = (field) => {

    if (sortField !== field)

      return <FaSort />;

    return sortOrder === "asc"

      ? <FaSortUp />

      : <FaSortDown />;

  };
    return (

    <div className="animated-table-container">

      {/* ================= Search ================= */}

      {searchable && (

        <div className="table-toolbar">

          <div className="search-box">

            <FaSearch />

            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {

                setSearch(e.target.value);

                setPage(1);

              }}
            />

          </div>

        </div>

      )}

      {/* ================= Loading ================= */}

      {loading ? (

        <div className="table-loading">

          <div className="loader"></div>

          <h3>Loading Data...</h3>

        </div>

      ) : (

        <>

          <div className="table-wrapper">

            <table className="animated-table">

              <thead>

                <tr>

                  {columns.map((column) => (

                    <th
                      key={column.accessor}
                      onClick={() =>
                        handleSort(column.accessor)
                      }
                    >

                      <span>

                        {column.label}

                      </span>

                      {renderSortIcon(column.accessor)}

                    </th>

                  ))}

                  <th>

                    Actions

                  </th>

                </tr>

              </thead>

              <tbody>

                <AnimatePresence>

                  {paginatedData.length > 0 ? (

                    paginatedData.map((row, index) => (

                      <motion.tr

                        key={row.id || index}

                        initial={{
                          opacity: 0,
                          y: 20
                        }}

                        animate={{
                          opacity: 1,
                          y: 0
                        }}

                        exit={{
                          opacity: 0
                        }}

                        transition={{
                          duration: .3
                        }}

                      >

                        {columns.map((column) => (

                          <td
                            key={column.accessor}
                          >

                            {column.accessor === "status"

                              ? (

                                <span
                                  className={`status ${String(
                                    row.status || ""
                                  ).toLowerCase()}`}
                                >

                                  {row.status}

                                </span>

                              )

                              : (

                                row[column.accessor]

                              )}

                          </td>

                        ))}

                        <td>

                          <div className="action-buttons">

                            <button
                              className="view-btn"
                              onClick={() =>
                                onView?.(row)
                              }
                            >

                              <FaEye />

                            </button>

                            <button
                              className="edit-btn"
                              onClick={() =>
                                onEdit?.(row)
                              }
                            >

                              <FaEdit />

                            </button>

                            <button
                              className="delete-btn"
                              onClick={() =>
                                onDelete?.(row)
                              }
                            >

                              <FaTrash />

                            </button>

                          </div>

                        </td>

                      </motion.tr>

                    ))

                  ) : (

                    <tr>

                      <td
                        colSpan={
                          columns.length + 1
                        }
                        className="empty-state"
                      >

                        No records found.

                      </td>

                    </tr>

                  )}

                </AnimatePresence>

              </tbody>

            </table>

          </div>
                    {/* ================= Pagination ================= */}

          {totalPages > 1 && (

            <div className="table-footer">

              <div className="table-info">

                Showing

                <strong>

                  {" "}
                  {(page - 1) * pageSize + 1}
                </strong>

                -

                <strong>

                  {" "}
                  {Math.min(
                    page * pageSize,
                    sortedData.length
                  )}
                </strong>

                {" "}of{" "}

                <strong>

                  {sortedData.length}

                </strong>

                {" "}records

              </div>

              <div className="pagination">

                <button

                  className="page-btn"

                  disabled={page === 1}

                  onClick={() =>

                    setPage(page - 1)

                  }

                >

                  Previous

                </button>

                {Array.from(

                  { length: totalPages },

                  (_, index) => (

                    <button

                      key={index}

                      className={`page-btn ${
                        page === index + 1
                          ? "active"
                          : ""
                      }`}

                      onClick={() =>

                        setPage(index + 1)

                      }

                    >

                      {index + 1}

                    </button>

                  )

                )}

                <button

                  className="page-btn"

                  disabled={

                    page === totalPages

                  }

                  onClick={() =>

                    setPage(page + 1)

                  }

                >

                  Next

                </button>

              </div>

            </div>

          )}

        </>

      )}

    </div>

  );

}