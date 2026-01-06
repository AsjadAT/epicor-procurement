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

      // 🔴 IMPORTANT: Epicor returns data in returnObj
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
                    {po.ApprovalStatus === "A" ? "Approved" : "Open"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && pos.length === 0 && (
        <div style={info}>No purchase orders found.</div>
      )}
    </div>
  );
};

/* ---------------- STYLES (Same as Requisitions) ---------------- */

const container = {
  padding: "16px",
  backgroundColor: "#f5f7f9",
  height: "100vh",
};

const title = {
  marginBottom: "12px",
  fontWeight: "600",
};

const gridWrapper = {
  backgroundColor: "#fff",
  border: "1px solid #cfd6dd",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const th = {
  backgroundColor: "#eef2f5",
  borderBottom: "1px solid #cfd6dd",
  padding: "6px 8px",
  textAlign: "left",
  fontWeight: "600",
  whiteSpace: "nowrap",
};

const td = {
  borderBottom: "1px solid #e1e5ea",
  padding: "6px 8px",
  whiteSpace: "nowrap",
};

const tr = {
  cursor: "pointer",
};

const info = {
  padding: "12px",
};

const errorStyle = {
  color: "red",
  padding: "12px",
};

const toolbar = {
  display: "flex",
  gap: "6px",
  padding: "6px",
  backgroundColor: "#eef2f5",
  border: "1px solid #cfd6dd",
  borderBottom: "none",
};

const iconBtn = {
  width: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#ffffff",
  border: "1px solid #cfd6dd",
  cursor: "pointer",
  color: "#2f3a45",
};

export default PurchaseOrders;
