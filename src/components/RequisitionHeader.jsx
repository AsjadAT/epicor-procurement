import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

const RequisitionHeader = () => {
  const navigate = useNavigate();
  const { reqNum } = useParams();
  const username = sessionStorage.getItem("username");
  const password = sessionStorage.getItem("password");
  
  //const baseURL = "https://epicorsi/kinetic2025demo/api/v2/odata";
  const baseURL = "https://192.168.1.142/kinetic2025demo/api/v2/odata";
  const company = "EPIC06";
  const apiKey = "wqgWS6cVVd4WnydMRoTNUkLbiBRFY93LJmhp2UzeLmvsC";

  const today = new Date().toISOString().split("T")[0];

  const [reqSearch, setReqSearch] = useState(reqNum);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
    if (reqNum) {
      fetchHeader();
      fetchDetails();
    }
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

  const handleSearch = () => {
    if (reqSearch && reqSearch.trim() !== "") {
      navigate(`/requisition/${reqSearch.trim()}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && reqSearch && reqSearch.trim() !== "") {
      navigate(`/requisition/${reqSearch.trim()}`);
    }
  };

  return (
    <div style={container}>
      {/* Header with responsive title and search */}
      <div style={isMobile ? mobileHeaderRow : headerRow}>
        <h2 style={isMobile ? mobileTitle : title}>
          {reqNum ? `Requisition #${reqNum}` : 'Search Requisition'}
        </h2>
        
        <div style={searchBox}>
          <input
            style={searchInput}
            value={reqSearch}
            onChange={(e) => setReqSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search requisition..."
          />
          <button 
            style={searchButton}
            onClick={handleSearch}
            disabled={!reqSearch || reqSearch.trim() === ""}
            title="Search"
          >
            <svg style={searchIcon} viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </div>
      </div>

      {loading && <div style={loadingStyle}>Loading requisition...</div>}

      {!loading && reqNum && (
        <>
          {/* Responsive Header Panel */}
          <div style={isMobile ? mobileHeaderPanel : headerPanel}>
            {/* Requisition Column */}
            <div style={headerColumn}>
              <h4 style={sectionTitle}>Requisition</h4>
              
              <div style={fieldWrapper}>
                <label style={labelStyle}>Requisition Number</label>
                <div style={reqNumDisplay}>
                  {reqNum}
                </div>
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
                  readOnly
                />
              </div>
              
              <div style={checkboxContainer}>
                <label style={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={header.notifyReceipt}
                    onChange={(e) => handleChange("notifyReceipt", e.target.checked)}
                    style={checkboxInput}
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
              
              <div style={isMobile ? mobileRow : row}>
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
              
              <div style={isMobile ? mobileRow : row}>
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

          {/* Comments Section */}
          <div style={commentsSection}>
            <label style={labelStyle}>Comments</label>
            <textarea
              rows={4}
              style={textareaStyle}
              value={header.comments}
              onChange={(e) => handleChange("comments", e.target.value)}
              placeholder="Enter comments here..."
            />
          </div>

          <hr style={divider} />

          <h3 style={sectionTitle}>Requisition Lines</h3>

          {detailsLoading && <div style={loadingStyle}>Loading requisition lines...</div>}

          {!detailsLoading && details.length > 0 && (
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
                            style={checkboxInput}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={isMobile ? mobileButtonRow : buttonRow}>
            <button style={saveButton} onClick={saveHeader}>
              Save
            </button>
            <button style={backButton} onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </>
      )}

      {/* Show search prompt when no requisition is loaded */}
      {!loading && !reqNum && (
        <div style={searchPrompt}>
          <p>Enter a requisition number above to view details</p>
        </div>
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

const searchBox = {
  display: "flex",
  alignItems: "center",
  maxWidth: "400px",
  width: "100%",
  '@media (max-width: 768px)': {
    maxWidth: "100%",
  }
};

const searchInput = {
  flex: 1,
  padding: "10px 12px",
  fontSize: "14px",
  borderRadius: "6px 0 0 6px",
  border: "1px solid #cbd5e0",
  borderRight: "none",
  backgroundColor: "white",
  boxSizing: "border-box",
  height: "40px",
  fontFamily: "inherit",
  minWidth: "0",
  transition: "border-color 0.2s",
  ':focus': {
    outline: "none",
    borderColor: "#4299e1",
  }
};

const searchButton = {
  padding: "0",
  backgroundColor: "#2c5282",
  color: "white",
  border: "1px solid #2c5282",
  borderLeft: "none",
  borderRadius: "0 6px 6px 0",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "40px",
  width: "44px",
  minWidth: "44px",
  transition: "background-color 0.2s",
  ':hover:not(:disabled)': {
    backgroundColor: "#2b6cb0",
  },
  ':disabled': {
    backgroundColor: "#a0aec0",
    cursor: "not-allowed",
  }
};

const searchIcon = {
  width: "18px",
  height: "18px",
  fill: "white",
};

const headerPanel = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "24px",
  backgroundColor: "#dfeaed",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "20px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  '@media (max-width: 1024px)': {
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
  transition: "border-color 0.2s",
  ':focus': {
    outline: "none",
    borderColor: "#4299e1",
    boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)",
  }
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
  transition: "border-color 0.2s",
  ':focus': {
    outline: "none",
    borderColor: "#4299e1",
    boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)",
  }
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

const checkboxContainer = {
  marginTop: "8px",
};

const checkboxLabel = {
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
  userSelect: "none",
  width: "100%",
  color: "#4a5568",
};

const checkboxInput = {
  margin: 0,
  cursor: "pointer",
  width: "16px",
  height: "16px",
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

const saveButton = {
  padding: "12px 24px",
  backgroundColor: "#2c5282",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "15px",
  fontFamily: "inherit",
  transition: "background-color 0.2s, transform 0.1s",
  ':hover': {
    backgroundColor: "#2b6cb0",
  },
  ':active': {
    transform: "translateY(1px)",
  },
  '@media (max-width: 768px)': {
    width: "100%",
    padding: "14px",
  }
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
  minWidth: "800px",
  '@media (max-width: 768px)': {
    fontSize: "13px",
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

const gridInput = {
  width: "100%",
  padding: "6px 8px",
  fontSize: "14px",
  borderRadius: "4px",
  border: "1px solid #d0d5dd",
  boxSizing: "border-box",
  fontFamily: "inherit",
  height: "32px",
  transition: "border-color 0.2s",
  ':focus': {
    outline: "none",
    borderColor: "#4299e1",
  },
  '@media (max-width: 768px)': {
    fontSize: "13px",
    padding: "4px 6px",
  }
};

const reqNumDisplay = {
  width: "100%",
  padding: "8px 10px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid #cbd5e0",
  backgroundColor: "#f7fafc",
  boxSizing: "border-box",
  height: "36px",
  display: "flex",
  alignItems: "center",
  fontFamily: "inherit",
  fontWeight: "600",
  color: "#2d3748",
};

const loadingStyle = {
  textAlign: "center",
  padding: "40px",
  color: "#718096",
  fontSize: "16px",
};

const searchPrompt = {
  textAlign: "center",
  padding: "60px 20px",
  color: "#718096",
  backgroundColor: "white",
  borderRadius: "8px",
  border: "2px dashed #cbd5e0",
  marginTop: "20px",
  fontSize: "16px",
};

export default RequisitionHeader;