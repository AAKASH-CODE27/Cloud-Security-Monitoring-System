// src/DashboardCharts.jsx

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

import {
  FaChartLine,
  FaChartPie,
  FaChartBar,
  FaChartArea,
  FaSyncAlt,
  FaCalendarAlt
} from "react-icons/fa";

import API from "./api/axios";

import "./DashboardCharts.css";

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6"
];

export default function DashboardCharts() {

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [range, setRange] = useState("30");

  const [charts, setCharts] = useState({

    assets: [],

    alerts: [],

    incidents: [],

    vulnerabilities: []

  });

  const loadCharts = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await API.get(

        `/dashboard/charts?days=${range}`

      );

      setCharts(response.data);

    }

    catch (err) {

      console.error(err);

      setError("Unable to load charts.");

    }

    finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadCharts();

  }, [range]);
    return (

    <motion.div
      className="dashboard-charts"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >

      {/* ================= Header ================= */}

      <div className="charts-header">

        <div>

          <h2>Security Analytics Dashboard</h2>

          <p>

            Real-time infrastructure monitoring and security metrics

          </p>

        </div>

        <div className="charts-actions">

          <div className="range-filter">

            <FaCalendarAlt />

            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >

              <option value="7">Last 7 Days</option>

              <option value="30">Last 30 Days</option>

              <option value="90">Last 90 Days</option>

              <option value="365">Last Year</option>

            </select>

          </div>

          <button
            className="refresh-btn"
            onClick={loadCharts}
          >

            <FaSyncAlt />

            Refresh

          </button>

        </div>

      </div>

      {/* ================= Loading ================= */}

      {loading && (

        <div className="loading-container">

          <div className="loader"></div>

          <h3>Loading Analytics...</h3>

        </div>

      )}

      {/* ================= Error ================= */}

      {error && (

        <div className="error-box">

          {error}

        </div>

      )}

      {!loading && !error && (

        <div className="charts-grid">

          {/* ================= Line Chart ================= */}

          <motion.div
            className="chart-card"
            whileHover={{ y: -5 }}
          >

            <h3>

              <FaChartLine />

              Incident Trend

            </h3>

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <LineChart
                data={charts.incidents}
              >

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={3}
                />

              </LineChart>

            </ResponsiveContainer>

          </motion.div>

          {/* ================= Pie Chart ================= */}

          <motion.div
            className="chart-card"
            whileHover={{ y: -5 }}
          >

            <h3>

              <FaChartPie />

              Asset Distribution

            </h3>

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <PieChart>

                <Pie
                  data={charts.assets}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label
                >

                  {charts.assets.map((item, index) => (

                    <Cell
                      key={index}
                      fill={
                        COLORS[
                          index % COLORS.length
                        ]
                      }
                    />

                  ))}

                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </motion.div>

          {/* ================= Bar Chart ================= */}

          <motion.div
            className="chart-card"
            whileHover={{ y: -5 }}
          >

            <h3>

              <FaChartBar />

              Alert Severity

            </h3>

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <BarChart
                data={charts.alerts}
              >

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="severity" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="count"
                  fill="#ef4444"
                />

              </BarChart>

            </ResponsiveContainer>

          </motion.div>

          {/* ================= Area Chart ================= */}

          <motion.div
            className="chart-card"
            whileHover={{ y: -5 }}
          >

            <h3>

              <FaChartArea />

              Vulnerability Trend

            </h3>

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <AreaChart
                data={charts.vulnerabilities}
              >

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#22c55e"
                  fill="#22c55e55"
                />

              </AreaChart>

            </ResponsiveContainer>

          </motion.div>

        </div>

      )}

    </motion.div>

  );

}
