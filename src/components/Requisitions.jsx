import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Requisitions = () => {
  const navigate = useNavigate();
  const username = sessionStorage.getItem("username");
  const password = sessionStorage.getItem("password");

  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);

  const baseURL = "https://epicorsi/kinetic2025demo/api/v2/odata";
  const company = "EPIC06";
  const apiKey = "wqgWS6cVVd4WnydMRoTNUkLbiBRFY93LJmhp2UzeLmvsC";

  useEffect(() => {
    if (!username || !password) {
      navigate("/", { replace: true });
      return;
    }
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      setError("");

      const auth = btoa(`${username}:${password}`);

      const response = await fetch(
        `${baseURL}/${company}/Erp.BO.ReqSvc/Reqs?api-key=${apiKey}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setReqs(data.value || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load requisitions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <h2 style={title}>Requisitions</h2>

      <div style={toolbar}>
        <button style={iconBtn} title="New">
          <AddCircleOutlineIcon />
        </button>

        <button style={iconBtn} title="Save">
          <SaveIcon fontSize="small" />
        </button>

        <button style={iconBtn} title="Refresh" onClick={fetchRequisitions}>
          <RefreshIcon fontSize="small" />
        </button>
      </div>

      {loading && <div style={info}>Loading...</div>}
      {error && <div style={errorStyle}>{error}</div>}

      {!loading && reqs.length > 0 && (
        <div style={gridWrapper}>
          <div style={tableContainer}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Requisition Number</th>
                  <th style={th}>Request Date</th>
                  <th style={th}>Action Description</th>
                  <th style={th}>Status</th>
                  <th style={th}>Requestor Name</th>
                </tr>
              </thead>
              <tbody>
                {reqs.map((r) => (
                  <tr
                    key={r.ReqNum}
                    style={{
                      ...tr,
                      backgroundColor:
                        selectedReq === r.ReqNum ? "#e6f0fa" : "transparent",
                    }}
                    onClick={() => setSelectedReq(r.ReqNum)}
                  >
                    {/* 🔹 CLICKABLE REQ NUMBER */}
                    <td
                      style={{
                        ...td,
                        color: "#1a5fb4",
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); 
                        navigate(`/requisition/${r.ReqNum}`);
                      }}
                    >
                      {r.ReqNum}
                    </td>

                    <td style={td}>
                      {r.RequestDate ? r.RequestDate.split("T")[0] : ""}
                    </td>
                    <td style={td}>{r.ReqActionIDReqActionDesc || ""}</td>
                    <td style={td}>{r.StatusDesc}</td>
                    <td style={td}>{r.RequestorIDName || r.RequestorID}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && reqs.length === 0 && (
        <div style={info}>No requisitions found.</div>
      )}
    </div>
  );
};

/* ---------------- STYLES (Mobile Friendly) ---------------- */

const container = {
  padding: "16px",
  backgroundColor: "#f5f7f9",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflow: "hidden",
  boxSizing: "border-box",
  '@media (max-width: 768px)': {
    padding: "12px",
    width: "100%",
  }
};

const title = {
  marginBottom: "12px",
  fontWeight: "600",
  fontSize: "24px",
  '@media (max-width: 768px)': {
    fontSize: "20px",
    textAlign: "center",
  }
};

const gridWrapper = {
  backgroundColor: "#fff",
  border: "1px solid #cfd6dd",
  borderRadius: "6px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  width: "100%",
  '@media (max-width: 768px)': {
    borderRadius: "8px",
  }
};

const tableContainer = {
  overflowX: "auto",
  width: "100%",
  WebkitOverflowScrolling: "touch",
  '-ms-overflow-style': '-ms-autohiding-scrollbar',
  '@media (max-width: 768px)': {
    paddingBottom: "4px", // Prevents scrollbar overlap
  }
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
  minWidth: "700px", // Ensures table has minimum width for all columns
  tableLayout: "fixed", // Prevents column width changes during scroll
  '@media (max-width: 768px)': {
    fontSize: "13px",
    minWidth: "800px", // Increased to ensure all columns are visible
  }
};

const th = {
  backgroundColor: "#eef2f5",
  borderBottom: "2px solid #cfd6dd",
  padding: "12px 10px",
  textAlign: "left",
  fontWeight: "600",
  whiteSpace: "nowrap",
  minWidth: "120px", // Fixed minimum width for each header
  maxWidth: "200px", // Maximum width to prevent too wide columns
  overflow: "hidden",
  textOverflow: "ellipsis",
  position: "relative",
  '@media (max-width: 768px)': {
    padding: "10px 8px",
    minWidth: "100px",
    fontSize: "12px",
    position: "sticky",
    top: "0",
    zIndex: "10",
  }
};

const td = {
  borderBottom: "1px solid #e1e5ea",
  padding: "10px 8px",
  whiteSpace: "nowrap",
  minWidth: "120px", // Fixed minimum width matching headers
  maxWidth: "200px", // Maximum width to prevent too wide columns
  overflow: "hidden",
  textOverflow: "ellipsis",
  '@media (max-width: 768px)': {
    padding: "8px 6px",
    minWidth: "100px",
    fontSize: "12px",
  }
};

// Specific column widths for better mobile display
const thColumn1 = {
  ...th,
  minWidth: "100px",
  maxWidth: "120px",
};

const thColumn2 = {
  ...th,
  minWidth: "100px",
  maxWidth: "120px",
};

const thColumn3 = {
  ...th,
  minWidth: "150px",
  maxWidth: "180px",
};

const thColumn4 = {
  ...th,
  minWidth: "100px",
  maxWidth: "120px",
};

const thColumn5 = {
  ...th,
  minWidth: "120px",
  maxWidth: "150px",
};

const tdColumn1 = {
  ...td,
  minWidth: "100px",
  maxWidth: "120px",
  fontWeight: "600",
};

const tdColumn2 = {
  ...td,
  minWidth: "100px",
  maxWidth: "120px",
};

const tdColumn3 = {
  ...td,
  minWidth: "150px",
  maxWidth: "180px",
};

const tdColumn4 = {
  ...td,
  minWidth: "100px",
  maxWidth: "120px",
};

const tdColumn5 = {
  ...td,
  minWidth: "120px",
  maxWidth: "150px",
};

const tr = {
  cursor: "pointer",
  transition: "background-color 0.2s",
  ':hover': {
    backgroundColor: "#f7fafc",
  }
};

const info = {
  padding: "20px",
  textAlign: "center",
  color: "#666",
  fontSize: "16px",
  backgroundColor: "#fff",
  border: "1px solid #e1e5ea",
  borderRadius: "6px",
  marginTop: "12px",
  '@media (max-width: 768px)': {
    padding: "16px",
    fontSize: "14px",
  }
};

const errorStyle = {
  color: "#d32f2f",
  padding: "12px",
  backgroundColor: "#ffebee",
  border: "1px solid #ffcdd2",
  borderRadius: "6px",
  marginTop: "12px",
  fontSize: "14px",
  '@media (max-width: 768px)': {
    padding: "10px",
    fontSize: "13px",
  }
};

const toolbar = {
  display: "flex",
  gap: "8px",
  padding: "12px",
  backgroundColor: "#eef2f5",
  border: "1px solid #cfd6dd",
  borderRadius: "6px",
  marginBottom: "12px",
  alignItems: "center",
  '@media (max-width: 768px)': {
    padding: "10px",
    gap: "6px",
    justifyContent: "center",
    flexWrap: "wrap",
  }
};

const iconBtn = {
  width: "36px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#ffffff",
  border: "1px solid #cfd6dd",
  cursor: "pointer",
  color: "#2f3a45",
  borderRadius: "4px",
  transition: "background-color 0.2s",
  ':hover': {
    backgroundColor: "#f0f4f8",
  },
  '@media (max-width: 768px)': {
    width: "40px",
    height: "40px",
  }
};

export default Requisitions;