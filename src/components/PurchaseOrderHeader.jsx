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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!username || !password) {
      navigate("/", { replace: true });
      return;
    }
    if (poNum) {
      fetchHeader();
      fetchLines();
    }
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
      <div style={isMobile ? mobileHeaderRow : headerRow}>
        <h2 style={isMobile ? mobileTitle : title}>
          Purchase Order #{poNum}
        </h2>
        
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
      </div>

      {loading && <div style={loadingStyle}>Loading header...</div>}

      {!loading && (
        <>
          {/* ---------- HEADER PANEL ---------- */}
          <div style={isMobile ? mobileHeaderPanel : headerPanel}>
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
              
              <div style={isMobile ? mobileRow : row}>
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
              
              <div style={isMobile ? mobileRow : row}>
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
          <div style={commentsSection}>
            <label style={labelStyle}>Comments</label>
            <textarea
              rows={4}
              style={textareaStyle}
              value={header.comments}
              readOnly
              placeholder="No comments"
            />
          </div>

          <hr style={divider} />

          <h3 style={sectionTitle}>Purchase Order Lines</h3>

          {linesLoading && <div style={loadingStyle}>Loading lines...</div>}

          {!linesLoading && lines.length > 0 && (
            <div style={gridWrapper}>
              <div style={tableContainer}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>Line</th>
                      <th style={th}>Part</th>
                      <th style={th}>Description</th>
                      <th style={th}>Qty</th>
                      <th style={th}>UOM</th>
                      <th style={th}>Unit Cost</th>
                      <th style={th}>Total</th>
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
                              style={checkboxInput}
                            />
                          </td>
                          <td style={td} align="center">
                            <input
                              type="checkbox"
                              checked={line.OpenLine || false}
                              readOnly
                              style={checkboxInput}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!linesLoading && lines.length === 0 && (
            <div style={noDataStyle}>No lines found for this purchase order.</div>
          )}

          <div style={isMobile ? mobileButtonRow : buttonRow}>
            <button style={backButton} onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ---------- Responsive Styles ---------- */

const container = {
  padding: "16px",
  backgroundColor: "#f5f7fa",
  boxSizing: "border-box",
  width: "100%",
  minHeight: "100vh",
  '@media (max-width: 768px)': {
    padding: "12px",
  }
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
  flexWrap: "wrap",
  gap: "16px",
};

const mobileHeaderRow = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  marginBottom: "20px",
  gap: "12px",
};

const title = {
  margin: 0,
  color: "#2d3748",
  fontSize: "24px",
  fontWeight: "600",
};

const mobileTitle = {
  margin: 0,
  color: "#2d3748",
  fontSize: "20px",
  fontWeight: "600",
  textAlign: "center",
};

const headerPanel = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "24px",
  backgroundColor: "#dfeaed",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "20px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  '@media (max-width: 1200px)': {
    gridTemplateColumns: "repeat(2, 1fr)",
  },
  '@media (max-width: 768px)': {
    gridTemplateColumns: "1fr",
    padding: "16px",
    gap: "20px",
  }
};

const mobileHeaderPanel = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  backgroundColor: "#dfeaed",
  padding: "16px",
  borderRadius: "8px",
  marginBottom: "16px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
};

const headerColumn = {
  display: "flex",
  flexDirection: "column",
};

const sectionTitle = {
  fontSize: "15px",
  fontWeight: "700",
  marginBottom: "12px",
  color: "#2c3e50",
  paddingBottom: "6px",
  borderBottom: "2px solid #b8c7cc",
};

const labelStyle = {
  fontSize: "13px",
  fontWeight: "600",
  marginBottom: "6px",
  display: "block",
  color: "#2c3e50",
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid #cbd5e0",
  backgroundColor: "white",
  boxSizing: "border-box",
  height: "36px",
  fontFamily: "inherit",
};

const textareaStyle = {
  width: "100%",
  padding: "12px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid #cbd5e0",
  resize: "vertical",
  backgroundColor: "white",
  minHeight: "100px",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const fieldWrapper = {
  display: "flex",
  flexDirection: "column",
  marginBottom: "16px",
  width: "100%",
};

const row = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
  width: "100%",
  '@media (max-width: 768px)': {
    gridTemplateColumns: "1fr",
    gap: "16px",
  }
};

const mobileRow = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  width: "100%",
};

const commentsSection = {
  marginTop: "20px",
  backgroundColor: "white",
  padding: "16px",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const divider = {
  margin: "28px 0",
  border: "none",
  borderTop: "2px solid #e2e8f0",
};

const buttonRow = {
  display: "flex",
  gap: "16px",
  marginTop: "28px",
  paddingTop: "20px",
  borderTop: "1px solid #e2e8f0",
};

const mobileButtonRow = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "24px",
  paddingTop: "16px",
  borderTop: "1px solid #e2e8f0",
};

const backButton = {
  padding: "12px 24px",
  backgroundColor: "#718096", 
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "15px",
  fontFamily: "inherit",
  transition: "background-color 0.2s, transform 0.1s",
  ':hover': {
    backgroundColor: "#4a5568",
  },
  ':active': {
    transform: "translateY(1px)",
  },
  '@media (max-width: 768px)': {
    width: "100%",
    padding: "14px",
  }
};

const gridWrapper = {
  backgroundColor: "#fff",
  border: "1px solid #cfd6dd",
  borderRadius: "8px",
  marginTop: "16px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const tableContainer = {
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
  minWidth: "1200px",
  '@media (max-width: 768px)': {
    fontSize: "13px",
    minWidth: "1000px",
  }
};

const th = {
  backgroundColor: "#eef2f5",
  borderBottom: "2px solid #cfd6dd",
  padding: "12px 10px",
  textAlign: "left",
  fontWeight: "600",
  fontFamily: "inherit",
  color: "#2d3748",
  whiteSpace: "nowrap",
};

const td = {
  borderBottom: "1px solid #e1e5ea",
  padding: "10px",
  fontFamily: "inherit",
  verticalAlign: "middle",
  '@media (max-width: 768px)': {
    padding: "8px 6px",
  }
};

const loadingStyle = {
  textAlign: "center",
  padding: "40px",
  color: "#718096",
  fontSize: "16px",
};

const errorStyle = {
  backgroundColor: "#fed7d7",
  border: "1px solid #fc8181",
  color: "#c53030",
  padding: "12px",
  borderRadius: "6px",
  fontSize: "14px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  '@media (max-width: 768px)': {
    padding: "10px",
  }
};

const retryButton = {
  padding: "8px 16px",
  backgroundColor: "#2c5282",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  fontFamily: "inherit",
  alignSelf: "flex-start",
  transition: "background-color 0.2s",
  ':hover': {
    backgroundColor: "#2b6cb0",
  },
  '@media (max-width: 768px)': {
    width: "100%",
  }
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

const checkboxInput = {
  margin: 0,
  cursor: "default",
  width: "16px",
  height: "16px",
};

export default PurchaseOrderHeader;