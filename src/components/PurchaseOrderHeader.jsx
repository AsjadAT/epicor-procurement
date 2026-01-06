import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const PurchaseOrderHeader = () => {
  const navigate = useNavigate();
  const { poNum } = useParams();

  const username = sessionStorage.getItem("username");
  const password = sessionStorage.getItem("password");

  const baseURL = "https://epicorsi/kinetic2025demo/api/v2/odata";
  const company = "EPIC06";
  const apiKey = "wqgWS6cVVd4WnydMRoTNUkLbiBRFY93LJmhp2UzeLmvsC";

  const [loading, setLoading] = useState(true);
  const [linesLoading, setLinesLoading] = useState(true);
  const [error, setError] = useState("");

  const [header, setHeader] = useState({
    orderDate: "",
    buyer: "",
    vendor: "",
    shipVia: "",
    terms: "",
    comments: "",
    shipToName: "",
    shipToAddress1: "",
    shipToAddress2: "",
    shipToCity: "",
    shipToState: "",
    shipToZIP: "",
    shipToCountry: "",
    fob: "",
    currency: "",
    orderAmt: 0,
    taxAmt: 0,
    totalAmt: 0,
  });

  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (!username || !password) {
      navigate("/", { replace: true });
      return;
    }
    fetchHeader();
    fetchLines();
  }, [poNum]);

  const fetchHeader = async () => {
    try {
      setLoading(true);
      setError("");
      const auth = btoa(`${username}:${password}`);
      
      // Using GetByID endpoint for header
      const url = `${baseURL}/${company}/Erp.BO.POSvc/GetByID?poNum=${poNum}&api-key=${apiKey}`;
      
      console.log("Fetching header from:", url);
      
      const res = await fetch(url, {
        headers: { 
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
      });

      console.log("Header response status:", res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("Header data received:", data);
      
      // Check if we got a PO object in the response
      if (data && data.returnObj) {
        const po = data.returnObj;
        setHeader({
          orderDate: po.OrderDate?.split("T")[0] || "",
          buyer: po.BuyerIDName || po.BuyerID || "",
          vendor: po.VendorName || "",
          shipVia: po.ShipViaCode || "",
          terms: po.TermsCode || "",
          comments: po.CommentText || "",
          shipToName: po.ShipName || "",
          shipToAddress1: po.ShipAddress1 || "",
          shipToAddress2: po.ShipAddress2 || "",
          shipToCity: po.ShipCity || "",
          shipToState: po.ShipState || "",
          shipToZIP: po.ShipZIP || "",
          shipToCountry: po.ShipCountry || "",
          fob: po.FOB || "",
          currency: po.CurrencyCode || "",
          orderAmt: po.OrderAmt || 0,
          taxAmt: po.TaxAmt || 0,
          totalAmt: po.TotalAmt || 0,
        });
      } else {
        throw new Error("No PO data returned from API");
      }
    } catch (err) {
      console.error("Error fetching header:", err);
      setError(`Failed to load PO header: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchLines = async () => {
    try {
      setLinesLoading(true);
      const auth = btoa(`${username}:${password}`);
      
      // Using the details endpoint
      const url = `${baseURL}/${company}/Erp.BO.POSvc/POes('${company}',${poNum})/PODetails?api-key=${apiKey}`;
      
      console.log("Fetching lines from:", url);
      
      const res = await fetch(url, {
        headers: { 
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
      });

      console.log("Lines response status:", res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("Lines data received:", data);
      
      setLines(data.value || []);
    } catch (err) {
      console.error("Error fetching lines:", err);
      setError(prev => `${prev}\nFailed to load PO lines: ${err.message}`);
    } finally {
      setLinesLoading(false);
    }
  };

  return (
    <div style={container}>
      <h2 style={{ marginBottom: "16px", color: "#2d3748" }}>Purchase Order #{poNum}</h2>

      {error && (
        <div style={errorStyle}>
          <strong>Error:</strong> {error}
          <button 
            onClick={() => {
              setError("");
              fetchHeader();
              fetchLines();
            }}
            style={retryButton}
          >
            Retry
          </button>
        </div>
      )}

      {loading && <div style={loadingStyle}>Loading header...</div>}

      {!loading && (
        <>
          {/* ---------- HEADER PANEL ---------- */}
          <div style={headerPanel}>
            {/* Purchase Order Column */}
            <div style={headerColumn}>
              <h4 style={sectionTitle}>Purchase Order</h4>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>PO Number</label>
                <input 
                  style={inputStyle} 
                  value={poNum} 
                  readOnly 
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Order Date</label>
                <input
                  style={inputStyle}
                  value={header.orderDate}
                  readOnly
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Buyer</label>
                <input
                  style={inputStyle}
                  value={header.buyer}
                  readOnly
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Currency</label>
                <input
                  style={inputStyle}
                  value={header.currency}
                  readOnly
                />
              </div>
            </div>

            {/* Vendor Column */}
            <div style={headerColumn}>
              <h4 style={sectionTitle}>Vendor</h4>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Vendor</label>
                <input
                  style={inputStyle}
                  value={header.vendor}
                  readOnly
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Ship Via</label>
                <input
                  style={inputStyle}
                  value={header.shipVia}
                  readOnly
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Terms</label>
                <input
                  style={inputStyle}
                  value={header.terms}
                  readOnly
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>FOB</label>
                <input
                  style={inputStyle}
                  value={header.fob}
                  readOnly
                />
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
                  readOnly
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Address 1</label>
                <input
                  style={inputStyle}
                  value={header.shipToAddress1}
                  readOnly
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Address 2</label>
                <input
                  style={inputStyle}
                  value={header.shipToAddress2}
                  readOnly
                />
              </div>
              
              <div style={row}>
                <div style={fieldWrapper}>
                  <label style={labelStyle}>City</label>
                  <input
                    style={inputStyle}
                    value={header.shipToCity}
                    readOnly
                  />
                </div>
                <div style={fieldWrapper}>
                  <label style={labelStyle}>State</label>
                  <input
                    style={inputStyle}
                    value={header.shipToState}
                    readOnly
                  />
                </div>
              </div>
              
              <div style={row}>
                <div style={fieldWrapper}>
                  <label style={labelStyle}>Postal Code</label>
                  <input
                    style={inputStyle}
                    value={header.shipToZIP}
                    readOnly
                  />
                </div>
                <div style={fieldWrapper}>
                  <label style={labelStyle}>Country</label>
                  <input
                    style={inputStyle}
                    value={header.shipToCountry}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Totals Column */}
            <div style={headerColumn}>
              <h4 style={sectionTitle}>Totals</h4>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Order Amount</label>
                <input 
                  style={inputStyle} 
                  value={header.orderAmt.toFixed(2)} 
                  readOnly 
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Tax Amount</label>
                <input 
                  style={inputStyle} 
                  value={header.taxAmt.toFixed(2)} 
                  readOnly 
                />
              </div>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Total Amount</label>
                <input 
                  style={inputStyle} 
                  value={header.totalAmt.toFixed(2)} 
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
              readOnly
              placeholder="No comments"
            />
          </div>

          <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />

          <h3 style={{ marginBottom: "12px", color: "#2d3748" }}>Purchase Order Lines</h3>

          {linesLoading && <div style={loadingStyle}>Loading lines...</div>}

          {!linesLoading && lines.length > 0 && (
            <div style={gridWrapper}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Line</th>
                    <th style={th}>Part Number</th>
                    <th style={th}>Description</th>
                    <th style={th}>Order Qty</th>
                    <th style={th}>UOM</th>
                    <th style={th}>Unit Cost</th>
                    <th style={th}>Line Total</th>
                    <th style={th}>Due Date</th>
                    <th style={th}>Confirmed</th>
                    <th style={th}>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const lineTotal = (line.OrderQty || 0) * (line.UnitCost || 0);
                    return (
                      <tr key={line.POLine}>
                        <td style={td}>{line.POLine}</td>
                        <td style={td}>{line.PartNum}</td>
                        <td style={td}>{line.LineDesc || "-"}</td>
                        <td style={td} align="right">{line.OrderQty?.toLocaleString()}</td>
                        <td style={td}>{line.IUM}</td>
                        <td style={td} align="right">{line.UnitCost?.toFixed(3)}</td>
                        <td style={td} align="right">${lineTotal.toFixed(2)}</td>
                        <td style={td}>{line.DueDate?.split("T")[0] || ""}</td>
                        <td style={td} align="center">
                          <input
                            type="checkbox"
                            checked={line.Confirmed || false}
                            readOnly
                          />
                        </td>
                        <td style={td} align="center">
                          <input
                            type="checkbox"
                            checked={line.OpenLine || false}
                            readOnly
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!linesLoading && lines.length === 0 && (
            <div style={noDataStyle}>No lines found for this purchase order.</div>
          )}

          <div style={buttonRow}>
            <button style={backButton} onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ---------- Styles (Matching RequisitionHeader) ---------- */

const container = {
  padding: "16px",
  backgroundColor: "#f5f7fa",
  boxSizing: "border-box",
  width: "100%",
  minWidth: "1200px",
};

const headerPanel = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
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
  minWidth: "1200px",
};

const th = {
  backgroundColor: "#eef2f5",
  borderBottom: "1px solid #cfd6dd",
  padding: "8px",
  textAlign: "left",
  fontWeight: "600",
  fontFamily: "inherit",
};

const td = {
  borderBottom: "1px solid #e1e5ea",
  padding: "8px",
  fontFamily: "inherit",
};

const loadingStyle = {
  padding: "20px",
  textAlign: "center",
  color: "#4a5568",
  fontSize: "14px",
};

const errorStyle = {
  backgroundColor: "#fed7d7",
  border: "1px solid #fc8181",
  color: "#c53030",
  padding: "12px",
  borderRadius: "4px",
  marginBottom: "16px",
  fontSize: "14px",
};

const retryButton = {
  marginLeft: "12px",
  padding: "4px 8px",
  backgroundColor: "#2c5282",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
};

const noDataStyle = {
  padding: "20px",
  textAlign: "center",
  color: "#718096",
  fontSize: "14px",
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "6px",
};

export default PurchaseOrderHeader;