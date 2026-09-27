import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function SearchBar({ placeholder = "" }) {
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const pages = [
    { name: "Dashboard",       path: "/dashboard",       keywords: ["dashboard", "home", "main"] },
    { name: "Assets",          path: "/assets",          keywords: ["asset", "assets", "device", "devices", "server"] },
    { name: "Alerts",          path: "/alerts",          keywords: ["alert", "alerts", "notification"] },
    { name: "Users",           path: "/users",           keywords: ["user", "users", "employee"] },
    { name: "Incidents",       path: "/incidents",       keywords: ["incident", "incidents", "security"] },
    { name: "Vulnerabilities", path: "/vulnerabilities", keywords: ["vulnerability", "vulnerabilities", "cve"] },
    { name: "Reports",         path: "/reports",         keywords: ["report", "reports", "analytics"] },
    { name: "Cloud",           path: "/cloud",           keywords: ["cloud", "aws", "azure", "gcp"] },
    { name: "Profile",         path: "/profile",         keywords: ["profile", "account"] },
    { name: "Settings",        path: "/settings",        keywords: ["setting", "settings", "config"] },
  ];

  const filteredPages = pages.filter((page) => {
    const search = value.toLowerCase();
    return (
      page.name.toLowerCase().includes(search) ||
      page.keywords.some((kw) => kw.toLowerCase().includes(search))
    );
  });

  const handleSearch = () => {
    const search = value.trim().toLowerCase();
    if (!search) return;
    const page = pages.find(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.keywords.some((kw) => kw.includes(search) || search.includes(kw))
    );
    if (page) {
      navigate(page.path);
      setValue("");
      setShowSuggestions(false);
    } else {
      alert("No matching page found.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSelect = (page) => {
    navigate(page.path);
    setValue("");
    setShowSuggestions(false);
  };

  return (
    <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", gap: 0 }}>

      <span
        onClick={handleSearch}
        className="search-icon"
        style={{
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        <FaSearch style={{ fontSize: "13px", color: "var(--muted)" }} />
      </span>

      <input
        type="text"
        value={value}
        onChange={(e) => { setValue(e.target.value); setShowSuggestions(true); }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text)",
          padding: "0 8px",
          fontSize: "13px",
          lineHeight: "1",
          height: "auto",
          alignSelf: "center",
        }}
        placeholder=""
      />

      {value && (
        <button
          type="button"
          onClick={() => { setValue(""); setShowSuggestions(false); }}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            padding: 0,
            fontSize: "12px",
          }}
        >
          <FaTimes />
        </button>
      )}

      {showSuggestions && value && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: 0,
            width: "100%",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
            zIndex: 9000,
          }}
        >
          {filteredPages.length > 0 ? (
            filteredPages.map((page) => (
              <div
                key={page.path}
                onClick={() => handleSelect(page)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  color: "var(--text)",
                  borderBottom: "1px solid var(--border-light)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-light)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <FaSearch style={{ color: "var(--accent)", fontSize: "12px", flexShrink: 0 }} />
                {page.name}
              </div>
            ))
          ) : (
            <div style={{ padding: "12px 14px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
              No matching pages found
            </div>
          )}
        </div>
      )}

    </div>
  );
}
