import React, { useEffect, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SaveIcon from "@mui/icons-material/Save";
import { useNavigate } from "react-router-dom";

const PurchaseOrders = () => {
  const navigate = useNavigate();

  const username = sessionStorage.getItem("username");
  const password = sessionStorage.getItem("password");

  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPO, setSelectedPO] = useState(null);

  const baseURL = "https://epicorsi/kinetic2025demo/api/v2/odata";
  const company = "EPIC06";
  const apiKey = "wqgWS6cVVd4WnydMRoTNUkLbiBRFY93LJmhp2UzeLmvsC";

  useEffect(() => {
    if (!username || !password) {
      navigate("/", { replace: true });
      return;
    }
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    try {
      setLoading(true);
      setError("");

      const auth = btoa(`${username}:${password}`);

      const response = await fetch(
        `${baseURL}/${company}/Erp.BO.POSvc/GetList?whereClause=&pageSize=0&absolutePage=0&api-key=${apiKey}`,
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
      setPOs(data.returnObj?.POHeaderList || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load Purchase Orders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <h2 style={title}>Purchase Orders</h2>

      {/* Toolbar */}
      <div style={toolbar}>
        <button style={iconBtn} title="New">
          <AddCircleOutlineIcon />
        </button>

        <button style={iconBtn} title="Save">
          <SaveIcon fontSize="small" />
        </button>

        <button style={iconBtn} title="Refresh" onClick={fetchPOs}>
          <RefreshIcon fontSize="small" />
        </button>
      </div>

      {loading && <div style={info}>Loading...</div>}
      {error && <div style={errorStyle}>{error}</div>}

      {!loading && pos.length > 0 && (
        <div style={gridWrapper}>
          <div style={tableContainer}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>PO Number</th>
                  <th style={th}>Order Date</th>
                  <th style={th}>Vendor</th>
                  <th style={th}>Buyer</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pos.map((po) => (
                  <tr
                    key={po.SysRowID}
                    style={{
                      ...tr,
                      backgroundColor:
                        selectedPO === po.PONum ? "#e6f0fa" : "transparent",
                    }}
                    onClick={() => setSelectedPO(po.PONum)}
                  >
                    {/* CLICKABLE PO NUM */}
                    <td
                      style={{
                        ...td,
                        color: "#1a5fb4",
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/po-entry/${po.PONum}`);
                      }}
                    >
                      {po.PONum}
                    </td>

                    <td style={td}>
                      {po.OrderDate ? po.OrderDate.split("T")[0] : ""}
                    </td>
                    <td style={td}>{po.VendorName}</td>
                    <td style={td}>{po.BuyerIDName}</td>
                    <td style={td}>
                      <span style={statusBadge(po.ApprovalStatus)}>
                        {po.ApprovalStatus === "A" ? "Approved" : "Open"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && pos.length === 0 && (
        <div style={info}>No purchase orders found.</div>
      )}
    </div>
  );
};

/* ---------------- STYLES ---------------- */

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
};

const tableContainer = {
  overflowX: "auto",
  width: "100%",
  WebkitOverflowScrolling: "touch",
  msOverflowStyle: "-ms-autohiding-scrollbar",
  '@media (max-width: 768px)': {
    paddingBottom: "4px",
  }
};

const table = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: "0",
  fontSize: "14px",
  minWidth: "650px", // Minimum width to show all columns
  tableLayout: "auto",
  '@media (max-width: 768px)': {
    fontSize: "13px",
    minWidth: "700px", // Ensure enough width for all columns
  }
};

const th = {
  backgroundColor: "#eef2f5",
  borderBottom: "2px solid #cfd6dd",
  padding: "12px 10px",
  textAlign: "left",
  fontWeight: "600",
  whiteSpace: "nowrap",
  minWidth: "100px", // Fixed minimum widths
  maxWidth: "150px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  position: "sticky",
  top: "0",
  zIndex: "10",
  '@media (max-width: 768px)': {
    padding: "10px 8px",
    minWidth: "90px",
    maxWidth: "120px",
    fontSize: "12px",
  }
};

const td = {
  borderBottom: "1px solid #e1e5ea",
  padding: "10px 8px",
  whiteSpace: "nowrap",
  minWidth: "100px", // Fixed minimum widths matching headers
  maxWidth: "150px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  '@media (max-width: 768px)': {
    padding: "8px 6px",
    minWidth: "90px",
    maxWidth: "120px",
    fontSize: "12px",
  }
};

// Specific column widths
const thCol1 = {
  ...th,
  minWidth: "100px",
  maxWidth: "120px",
  position: "sticky",
  left: "0",
  zIndex: "20",
  backgroundColor: "#eef2f5",
  '@media (max-width: 768px)': {
    minWidth: "80px",
    maxWidth: "100px",
  }
};

const tdCol1 = {
  ...td,
  minWidth: "100px",
  maxWidth: "120px",
  position: "sticky",
  left: "0",
  zIndex: "15",
  backgroundColor: "inherit",
  borderRight: "1px solid #e1e5ea",
  boxShadow: "2px 0 3px -1px rgba(0,0,0,0.1)",
  '@media (max-width: 768px)': {
    minWidth: "80px",
    maxWidth: "100px",
  }
};

const thCol5 = {
  ...th,
  minWidth: "80px",
  maxWidth: "100px",
  '@media (max-width: 768px)': {
    minWidth: "70px",
    maxWidth: "90px",
  }
};

const tdCol5 = {
  ...td,
  minWidth: "80px",
  maxWidth: "100px",
  '@media (max-width: 768px)': {
    minWidth: "70px",
    maxWidth: "90px",
  }
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

const statusBadge = (status) => ({
  backgroundColor: status === "A" ? "#dcfce7" : "#ffedd5",
  color: status === "A" ? "#166534" : "#9a3412",
  padding: "3px 8px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "600",
  display: "inline-block",
  minWidth: "60px",
  textAlign: "center",
  '@media (max-width: 768px)': {
    fontSize: "11px",
    padding: "2px 6px",
    minWidth: "55px",
  }
});

export default PurchaseOrders;