import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const RequisitionHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { username, password, reqNum } = location.state || {};

  /*
  const baseURL = "https://epicorsi/kinetic/api/v2/odata";
  const company = "EPIC03";
  const apiKey = "s2IQ6kMDvdlP42poSZTG9VJ1Z6EbMhEd4PbmFUi4nVZVK";
  */
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
    if (!username || !password || !reqNum) {
      navigate("/");
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

  const Field = ({ label, value, onChange }) => (
  <div style={fieldWrapper}>
    <label style={labelStyle}>{label}</label>
    <input style={inputStyle} value={value} onChange={onChange} />
  </div>
);



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
    <div style={{ padding: "16px", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "12px" }}>Requisition #{reqNum}</h2>

      {loading && <div>Loading...</div>}

      {!loading && (
        <>
          {/* ---------- HEADER PANEL ---------- */}
            <div style={headerPanel}>
            {/* Requisition */}
            <div style={headerColumn}>
                <h4 style={sectionTitle}>Requisition</h4>

                <Field label="Requisition Number" value={reqNum} onChange={() => {}} />
                <Field label="Global Req" value="0" onChange={() => {}} />

                <Field
                label="Request Date"
                value={header.requestDate}
                onChange={(e) => handleChange("requestDate", e.target.value)}
                />

                <Field
                label="Requestor"
                value={header.requestor}
                onChange={() => {}}
                />

                <div style={{ marginTop: "8px" }}>
                <label style={checkboxLabel}>
                    <input
                    type="checkbox"
                    checked={header.notifyReceipt}
                    onChange={(e) =>
                        handleChange("notifyReceipt", e.target.checked)
                    }
                    />
                    Notify Upon Receipt
                </label>
                </div>
            </div>

            {/* Ship To */}
            <div style={headerColumn}>
                <h4 style={sectionTitle}>Ship To</h4>

                <Field
                label="Name"
                value={header.shipToName}
                onChange={(e) => handleChange("shipToName", e.target.value)}
                />

                <Field
                label="Address 1"
                value={header.shipToAddress1}
                onChange={(e) => handleChange("shipToAddress1", e.target.value)}
                />

                <Field
                label="Address 2"
                value={header.shipToAddress2}
                onChange={(e) => handleChange("shipToAddress2", e.target.value)}
                />

                <Field
                label="Address 3"
                value={header.shipToAddress3}
                onChange={(e) => handleChange("shipToAddress3", e.target.value)}
                />

                <div style={row}>
                <Field
                    label="City"
                    value={header.shipToCity}
                    onChange={(e) => handleChange("shipToCity", e.target.value)}
                />
                <Field
                    label="State"
                    value={header.shipToState}
                    onChange={(e) => handleChange("shipToState", e.target.value)}
                />
                </div>

                <div style={row}>
                <Field
                    label="Postal Code"
                    value={header.shipToZIP}
                    onChange={(e) => handleChange("shipToZIP", e.target.value)}
                />
                <Field
                    label="Country"
                    value={header.shipToCountry}
                    onChange={(e) => handleChange("shipToCountry", e.target.value)}
                />
                </div>
            </div>

            {/* Status / Action */}
            <div style={headerColumn}>
                <h4 style={sectionTitle}>Current Action / Status / Dispatcher</h4>

                <Field label="Action" value="Approve Price" onChange={() => {}} />
                <Field label="Status" value="Pending" onChange={() => {}} />
                <Field label="Name" value={header.requestor} onChange={() => {}} />
                <Field label="Created By" value="" onChange={() => {}} />
                <Field label="Created On" value="" onChange={() => {}} />
            </div>
            </div>

            {/* ---------- COMMENTS ---------- */}
            <div style={{ marginTop: "12px" }}>
            <label style={labelStyle}>Comments</label>
            <textarea
                rows={4}
                style={textareaStyle}
                value={header.comments}
                onChange={(e) => handleChange("comments", e.target.value)}
            />
            </div>


          <hr style={{ margin: "28px 0" }} />

          <h3>Requisition Lines</h3>

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
            <button onClick={saveHeader}>
            Save
            </button>
            <button onClick={() => navigate(-1)}>Back</button>
          </div>
        </>
      )}
    </div>
  );
};

/* ---------- Styles ---------- */

const stackContainer = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const labelStyle = {
  fontSize: "13px",
  fontWeight: 600,
  marginBottom: "4px",
  display: "block",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid #d0d5dd",
};

const textareaStyle = {
  width: "100%",
  padding: "8px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid #d0d5dd",
  resize: "vertical",
};

const buttonRow = {
  display: "flex",
  gap: "12px",
  marginTop: "16px",
};

const gridWrapper = {
  backgroundColor: "#fff",
  border: "1px solid #cfd6dd",
  borderRadius: "6px",
  marginTop: "12px",
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
};

const td = {
  borderBottom: "1px solid #e1e5ea",
  padding: "4px 6px",
};

const gridInput = {
  width: "100%",
  padding: "4px",
  fontSize: "13px",
  borderRadius: "4px",
  border: "1px solid #d0d5dd",
};
const headerPanel = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "16px",
  backgroundColor: "#dfeaed",
  padding: "16px",
  borderRadius: "6px",
};

const headerColumn = {
  display: "flex",
  flexDirection: "column",
};


const sectionTitle = {
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "6px",
};

const row = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "8px",
};

const checkboxLabel = {
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const fieldWrapper = {
  display: "flex",
  flexDirection: "column",
  marginBottom: "12px", // ✅ matches screenshot spacing
};


export default RequisitionHeader;
