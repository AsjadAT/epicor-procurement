import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Requisitions = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { username, password } = location.state || {};

  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);

  const baseURL = "https://epicorsi/kinetic/api/v2/odata";
  const company = "EPIC03";
  const apiKey = "s2IQ6kMDvdlP42poSZTG9VJ1Z6EbMhEd4PbmFUi4nVZVK";

  useEffect(() => {
    if (!username || !password) {
      navigate("/");
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
                      e.stopPropagation(); // prevent row select conflict
                      navigate(`/requisition/${r.ReqNum}`, {
                        state: {
                          username,
                          password,
                          reqNum: r.ReqNum,
                        },
                      });
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
      )}

      {!loading && reqs.length === 0 && (
        <div style={info}>No requisitions found.</div>
      )}
    </div>
  );
};

/* ---------------- STYLES (Epicor-like) ---------------- */

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
  marginBottom: "0px",
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
  color: "#2f3a45",     // ✅ THIS FIXES IT
};


export default Requisitions;
