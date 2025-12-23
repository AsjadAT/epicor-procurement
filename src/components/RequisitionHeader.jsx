import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

const RequisitionHeader = () => {
  const navigate = useNavigate();
  const { reqNum } = useParams();
  const username = sessionStorage.getItem("username");
  const password = sessionStorage.getItem("password");
  
  const baseURL = "https://192.168.1.142/kinetic2025demo/api/v2/odata";
  const company = "EPIC06";
  const apiKey = "wqgWS6cVVd4WnydMRoTNUkLbiBRFY93LJmhp2UzeLmvsC";

  const today = new Date().toISOString().split("T")[0];

  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [header, setHeader] = useState({
    requestDate: today,
    requestor: "",
    notifyReceipt: false,
    shipToName: "",
    shipToAddress1: "",
    shipToAddress2: "",
    shipToAddress3: "",
    shipToCity: "",
    shipToState: "",
    shipToZIP: "",
    shipToCountry: "",
    comments: "",
  });

  const [details, setDetails] = useState([]);

  useEffect(() => {
    if (!username || !password) {
      navigate("/", { replace: true });
      return;
    }
    fetchHeader();
    fetchDetails();
  }, [reqNum]);

  const fetchHeader = async () => {
    try {
      setLoading(true);
      const auth = btoa(`${username}:${password}`);

      const url = `${baseURL}/${company}/Erp.BO.ReqSvc/Reqs('${company}',${reqNum})?api-key=${apiKey}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error(response.status);

      const req = await response.json();

      setHeader({
        requestDate: req.RequestDate?.split("T")[0] || today,
        requestor: req.RequestorIDName || req.RequestorID || "",
        notifyReceipt: req.NotifyUponReceipt || false,
        shipToName: req.ShipName || "",
        shipToAddress1: req.ShipAddress1 || "",
        shipToAddress2: req.ShipAddress2 || "",
        shipToAddress3: req.ShipAddress3 || "",
        shipToCity: req.ShipCity || "",
        shipToState: req.ShipState || "",
        shipToZIP: req.ShipZIP || "",
        shipToCountry: req.ShipCountry || "",
        comments: req.CommentText || req.Note || "",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load requisition header");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async () => {
    try {
      setDetailsLoading(true);
      const auth = btoa(`${username}:${password}`);

      const url = `${baseURL}/${company}/Erp.BO.ReqSvc/Reqs('${company}',${reqNum})/ReqDetails?api-key=${apiKey}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error(response.status);

      const data = await response.json();
      setDetails(data.value || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load requisition details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setHeader((prev) => ({ ...prev, [field]: value }));
  };

  const updateDetail = (index, field, value) => {
    setDetails((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
        RowMod: copy[index].RowMod === "A" ? "A" : "U",
      };
      return copy;
    });
  };

  const saveHeader = async () => {
    try {
      setLoading(true);
      const auth = btoa(`${username}:${password}`);

      const url = `${baseURL}/${company}/Erp.BO.ReqSvc/Reqs('${company}',${reqNum})?api-key=${apiKey}`;

      const payload = {
        ShipName: header.shipToName,
        ShipAddress1: header.shipToAddress1,
        ShipAddress2: header.shipToAddress2,
        ShipAddress3: header.shipToAddress3,
        ShipCity: header.shipToCity,
        ShipState: header.shipToState,
        ShipZIP: header.shipToZIP,
        ShipCountry: header.shipToCountry,
        CommentText: header.comments,
        NotifyUponReceipt: header.notifyReceipt
      };

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      alert("Requisition header updated successfully");
    } catch (err) {
      console.error("Header update failed:", err);
      alert("Failed to update requisition header");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <h2 style={{ marginBottom: "16px", color: "#2d3748" }}>Requisition #{reqNum}</h2>

      {loading && <div>Loading...</div>}

      {!loading && (
        <>
          {/* ---------- HEADER PANEL ---------- */}
          <div style={headerPanel}>
            {/* Requisition Column */}
            <div style={headerColumn}>
              <h4 style={sectionTitle}>Requisition</h4>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Requisition Number</label>
                <input 
                  style={inputStyle} 
                  value={reqNum} 
                  readOnly 
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Global Req</label>
                <input 
                  style={inputStyle} 
                  value="0" 
                  readOnly 
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Request Date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={header.requestDate}
                  onChange={(e) => handleChange("requestDate", e.target.value)}
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Requestor</label>
                <input
                  style={inputStyle}
                  value={header.requestor}
                  onChange={() => {}}
                  readOnly
                />
              </div>
              
              <div style={{ marginTop: "4px" }}>
                <label style={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={header.notifyReceipt}
                    onChange={(e) => handleChange("notifyReceipt", e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  Notify Upon Receipt
                </label>
              </div>
            </div>

            {/* Ship To Column */}
            <div style={headerColumn}>
              <h4 style={sectionTitle}>Ship To</h4>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Name</label>
                <input
                  style={inputStyle}
                  value={header.shipToName}
                  onChange={(e) => handleChange("shipToName", e.target.value)}
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Address 1</label>
                <input
                  style={inputStyle}
                  value={header.shipToAddress1}
                  onChange={(e) => handleChange("shipToAddress1", e.target.value)}
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Address 2</label>
                <input
                  style={inputStyle}
                  value={header.shipToAddress2}
                  onChange={(e) => handleChange("shipToAddress2", e.target.value)}
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Address 3</label>
                <input
                  style={inputStyle}
                  value={header.shipToAddress3}
                  onChange={(e) => handleChange("shipToAddress3", e.target.value)}
                />
              </div>
              
              <div style={row}>
                <div style={fieldWrapper}>
                  <label style={labelStyle}>City</label>
                  <input
                    style={inputStyle}
                    value={header.shipToCity}
                    onChange={(e) => handleChange("shipToCity", e.target.value)}
                  />
                </div>
                <div style={fieldWrapper}>
                  <label style={labelStyle}>State</label>
                  <input
                    style={inputStyle}
                    value={header.shipToState}
                    onChange={(e) => handleChange("shipToState", e.target.value)}
                  />
                </div>
              </div>
              
              <div style={row}>
                <div style={fieldWrapper}>
                  <label style={labelStyle}>Postal Code</label>
                  <input
                    style={inputStyle}
                    value={header.shipToZIP}
                    onChange={(e) => handleChange("shipToZIP", e.target.value)}
                  />
                </div>
                <div style={fieldWrapper}>
                  <label style={labelStyle}>Country</label>
                  <input
                    style={inputStyle}
                    value={header.shipToCountry}
                    onChange={(e) => handleChange("shipToCountry", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Status / Action Column */}
            <div style={headerColumn}>
              <h4 style={sectionTitle}>Current Action / Status / Dispatcher</h4>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Action</label>
                <input 
                  style={inputStyle} 
                  value="Create Purchase Order" 
                  readOnly 
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Status</label>
                <input 
                  style={inputStyle} 
                  value="Ordered" 
                  readOnly 
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Name</label>
                <input 
                  style={inputStyle} 
                  value={header.requestor} 
                  readOnly 
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Created By</label>
                <input 
                  style={inputStyle} 
                  value="" 
                  readOnly 
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Created On</label>
                <input 
                  style={inputStyle} 
                  value="" 
                  readOnly 
                />
              </div>
            </div>
          </div>

          {/* ---------- COMMENTS ---------- */}
          <div style={{ marginTop: "16px" }}>
            <label style={labelStyle}>Comments</label>
            <textarea
              rows={4}
              style={textareaStyle}
              value={header.comments}
              onChange={(e) => handleChange("comments", e.target.value)}
              placeholder="Enter comments here..."
            />
          </div>

          <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />

          <h3 style={{ marginBottom: "12px", color: "#2d3748" }}>Requisition Lines</h3>

          {detailsLoading && <div>Loading requisition lines...</div>}

          {!detailsLoading && details.length > 0 && (
            <div style={gridWrapper}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Line</th>
                    <th style={th}>Part</th>
                    <th style={th}>Description</th>
                    <th style={th}>Qty</th>
                    <th style={th}>UOM</th>
                    <th style={th}>Need By</th>
                    <th style={th}>Unit Cost</th>
                    <th style={th}>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, idx) => (
                    <tr key={d.ReqLine}>
                      <td style={td}>{d.ReqLine}</td>
                      <td style={td}>
                        <input
                          style={gridInput}
                          value={d.PartNum || ""}
                          onChange={(e) =>
                            updateDetail(idx, "PartNum", e.target.value)
                          }
                        />
                      </td>
                      <td style={td}>
                        <input
                          style={gridInput}
                          value={d.LineDesc || ""}
                          onChange={(e) =>
                            updateDetail(idx, "LineDesc", e.target.value)
                          }
                        />
                      </td>
                      <td style={td}>
                        <input
                          type="number"
                          style={gridInput}
                          value={d.OrderQty || 0}
                          onChange={(e) =>
                            updateDetail(
                              idx,
                              "OrderQty",
                              Number(e.target.value)
                            )
                          }
                        />
                      </td>
                      <td style={td}>{d.IUM}</td>
                      <td style={td}>
                        <input
                          type="date"
                          style={gridInput}
                          value={d.DueDate?.split("T")[0] || ""}
                          onChange={(e) =>
                            updateDetail(idx, "DueDate", e.target.value)
                          }
                        />
                      </td>
                      <td style={td} align="right">
                        {d.UnitCost?.toFixed(2)}
                      </td>
                      <td style={td} align="center">
                        <input
                          type="checkbox"
                          checked={d.OpenLine}
                          onChange={(e) =>
                            updateDetail(idx, "OpenLine", e.target.checked)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={buttonRow}>
            <button style={saveButton} onClick={saveHeader}>
              Save
            </button>
            <button style={backButton} onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ---------- Updated Styles ---------- */

const container = {
  padding: "16px",
  backgroundColor: "#f5f7fa",
  boxSizing: "border-box",
  width: "100%",
  minWidth: "800px",
};

const headerPanel = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "24px",
  backgroundColor: "#dfeaed",
  padding: "16px",
  borderRadius: "6px",
  marginBottom: "16px",
};

const headerColumn = {
  display: "flex",
  flexDirection: "column",
};

const sectionTitle = {
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "8px",
  color: "#2c3e50",
};

const labelStyle = {
  fontSize: "13px",
  fontWeight: 600,
  marginBottom: "4px",
  display: "block",
  color: "#2c3e50",
};

const inputStyle = {
  width: "100%",
  padding: "6px 8px",
  fontSize: "13px",
  borderRadius: "4px",
  border: "1px solid #cbd5e0",
  backgroundColor: "white",
  boxSizing: "border-box",
  height: "32px",
  fontFamily: "inherit",
};

const textareaStyle = {
  width: "100%",
  padding: "8px",
  fontSize: "13px",
  borderRadius: "4px",
  border: "1px solid #cbd5e0",
  resize: "vertical",
  backgroundColor: "white",
  minHeight: "80px",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const fieldWrapper = {
  display: "flex",
  flexDirection: "column",
  marginBottom: "12px",
  width: "100%",
};

const row = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  width: "100%",
};

const checkboxLabel = {
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  userSelect: "none",
  marginTop: "8px",
  width: "100%",
};

const buttonRow = {
  display: "flex",
  gap: "12px",
  marginTop: "24px",
  paddingTop: "16px",
  borderTop: "1px solid #e2e8f0",
};

const saveButton = {
  padding: "8px 16px",
  backgroundColor: "#2c5282",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  fontFamily: "inherit",
};

const backButton = {
  padding: "8px 16px",
  backgroundColor: "#2c5282", 
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  fontFamily: "inherit",
};

const gridWrapper = {
  backgroundColor: "#fff",
  border: "1px solid #cfd6dd",
  borderRadius: "6px",
  marginTop: "12px",
  overflowX: "auto",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
  minWidth: "800px",
};

const th = {
  backgroundColor: "#eef2f5",
  borderBottom: "1px solid #cfd6dd",
  padding: "6px 8px",
  textAlign: "left",
  fontWeight: "600",
  fontFamily: "inherit",
};

const td = {
  borderBottom: "1px solid #e1e5ea",
  padding: "4px 6px",
  fontFamily: "inherit",
};

const gridInput = {
  width: "100%",
  padding: "4px",
  fontSize: "13px",
  borderRadius: "4px",
  border: "1px solid #d0d5dd",
  boxSizing: "border-box",
  fontFamily: "inherit",
  height: "28px",
};

export default RequisitionHeader;