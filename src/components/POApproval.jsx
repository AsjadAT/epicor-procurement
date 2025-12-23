import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";

const POApproval = () => {
  const navigate = useNavigate();
  const username = sessionStorage.getItem("username");
  const password = sessionStorage.getItem("password");

  const [allApprovals, setAllApprovals] = useState([]);
  const [filteredApprovals, setFilteredApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userNames, setUserNames] = useState({});
  const [selectedResponses, setSelectedResponses] = useState({});
  const [currentUserData, setCurrentUserData] = useState(null);
  const [filterType, setFilterType] = useState("pending");

  const baseURL = "https://192.168.1.142/kinetic2025demo/api/v2/odata";
  const company = "EPIC06";
  const apiKey = "wqgWS6cVVd4WnydMRoTNUkLbiBRFY93LJmhp2UzeLmvsC";

  useEffect(() => {
    if (!username || !password) {
      navigate("/", { replace: true });
      return;
    }
    fetchCurrentUserData();
  }, []);

  useEffect(() => {
    if (allApprovals.length > 0) {
      applyFilter();
    }
  }, [filterType, allApprovals]);

  const fetchCurrentUserData = async () => {
    try {
      const auth = btoa(`${username}:${password}`);
      const response = await fetch(
        `${baseURL}/${company}/Ice.BO.UserFileSvc/UserFiles('${username}')?api-key=${apiKey}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.warn(`Failed to fetch current user data: ${response.status}`);
        fetchPOApprovals();
        return;
      }

      const userData = await response.json();
      setCurrentUserData(userData);
      console.log("Current user data:", userData);
      
      fetchPOApprovals();
    } catch (err) {
      console.error("Error fetching current user data:", err);
      fetchPOApprovals();
    }
  };

  const fetchUserName = async (userId) => {
    if (!userId) return userId;
    
    if (userNames[userId]) {
      return userNames[userId];
    }

    try {
      const auth = btoa(`${username}:${password}`);
      const response = await fetch(
        `${baseURL}/${company}/Ice.BO.UserFileSvc/UserFiles('${userId}')?api-key=${apiKey}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.warn(`Failed to fetch user ${userId}: ${response.status}`);
        return userId;
      }

      const userData = await response.json();
      const fullName = userData.Name || `${userData.FirstName || ''} ${userData.LastName || ''}`.trim() || userId;
      
      setUserNames(prev => ({
        ...prev,
        [userId]: fullName
      }));
      
      return fullName;
    } catch (err) {
      console.error(`Error fetching user ${userId}:`, err);
      return userId;
    }
  };

  const fetchAllUserNames = async (approvalList) => {
    const uniqueUserIds = new Set();
    
    approvalList.forEach(approval => {
      if (approval.MsgTo) uniqueUserIds.add(approval.MsgTo);
      if (approval.MsgFrom) uniqueUserIds.add(approval.MsgFrom);
      if (approval.DcdUserID) uniqueUserIds.add(approval.DcdUserID);
    });
    
    const userPromises = Array.from(uniqueUserIds).map(userId => 
      fetchUserName(userId)
    );
    
    await Promise.all(userPromises);
  };

  const isSecurityManager = () => {
    return currentUserData?.SecurityMgr === true;
  };

  const fetchPOApprovals = async () => {
    try {
      setLoading(true);
      setError("");

      const auth = btoa(`${username}:${password}`);

      // Using GetAllRows endpoint with required parameters
      const response = await fetch(
        `${baseURL}/${company}/Erp.BO.POApvMsgSvc/GetRows?api-key=${apiKey}`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            "whereClausePOApvMsg": "",
            "pageSize": 0, // 0 means get all rows
            "absolutePage": 0
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Full API response:", data);
      
      // Extract POApvMsg array from returnObj
      const fetchedApprovals = data.returnObj?.POApvMsg || [];
      
      console.log("PO approvals fetched via GetAllRows:", fetchedApprovals);
      console.log("Number of approvals fetched:", fetchedApprovals.length);
      
      // Process approvals - the response already includes VendorName
      const processedApprovals = fetchedApprovals.map(approval => ({
        ...approval,
        VendorID: approval.VendorNum || "N/A" // Add VendorID if needed
      }));
      
      console.log("Processed approvals:", processedApprovals);
      
      // Store all approvals
      setAllApprovals(processedApprovals);
      
      // Initialize responses for pending approvals only
      const pendingApprovals = processedApprovals.filter(approval => 
        !approval.ApproverResponse || approval.ApproverResponse === ""
      );
      
      const initialResponses = {};
      pendingApprovals.forEach(approval => {
        initialResponses[approval.PONum] = "";
      });
      setSelectedResponses(initialResponses);
      
      // Fetch user names for all approvals
      await fetchAllUserNames(processedApprovals);
      
    } catch (err) {
      console.error("Error fetching approvals:", err);
      setError(`Failed to load purchase order approvals: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [];
    
    switch (filterType) {
      case "pending":
        filtered = allApprovals.filter(approval => 
          !approval.ApproverResponse || approval.ApproverResponse === ""
        );
        break;
      case "processed":
        filtered = allApprovals.filter(approval => 
          approval.ApproverResponse && approval.ApproverResponse !== ""
        );
        break;
      case "all":
        filtered = [...allApprovals];
        break;
      default:
        filtered = allApprovals;
    }
    
    // Sort: pending first, then by PO number
    filtered.sort((a, b) => {
      const aIsPending = !a.ApproverResponse || a.ApproverResponse === "";
      const bIsPending = !b.ApproverResponse || b.ApproverResponse === "";
      
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      
      // For pending: sort by PO number ascending
      // For processed: sort by PO number descending (most recent first)
      if (aIsPending && bIsPending) {
        return a.PONum - b.PONum;
      } else {
        return b.PONum - a.PONum;
      }
    });
    
    setFilteredApprovals(filtered);
  };

  const formatDateTime = (dateString, timeValue) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString();
    
    if (timeValue) {
      const hours = Math.floor(timeValue / 3600);
      const minutes = Math.floor((timeValue % 3600) / 60);
      
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      return `${formattedDate} ${timeStr}`;
    }
    
    return formattedDate;
  };

  const handleResponseChange = (poNum, response) => {
    setSelectedResponses(prev => ({
      ...prev,
      [poNum]: response
    }));
  };

  const canUserApprove = (approval) => {
    if (approval.ApproverResponse && approval.ApproverResponse !== "") {
      return false;
    }
    return approval.MsgTo === username || isSecurityManager();
  };

  const submitApproval = async (poNum, approvalData) => {
    const response = selectedResponses[poNum];
    
    if (!response) {
      alert("Please select Accept or Reject before submitting.");
      return;
    }

    if (!canUserApprove(approvalData)) {
      alert(`You cannot approve PO ${poNum}.`);
      return;
    }

    try {
      setSubmitting(true);
      const auth = btoa(`${username}:${password}`);

      // Create update payload
      const updatePayload = {
        "ds": {
          "POApvMsg": [
            {
              "Company": approvalData.Company || company,
              "PONum": approvalData.PONum,
              "MsgType": approvalData.MsgType || "",
              "MsgDate": approvalData.MsgDate || new Date().toISOString(),
              "MsgTime": approvalData.MsgTime || 0,
              "MsgTo": approvalData.MsgTo || "",
              "MsgFrom": approvalData.MsgFrom || "",
              "MsgText": approvalData.MsgText || "",
              "ApproverResponse": response.toUpperCase() === "ACCEPT" ? "APPROVED" : "REJECTED",
              "DcdUserID": username,
              "SysRevID": approvalData.SysRevID || 0,
              "SysRowID": approvalData.SysRowID || "",
              "VendorNum": approvalData.VendorNum || 0,
              "VendorName": approvalData.VendorName || "",
              "BuyerName": approvalData.BuyerName || "",
              "BuyerLimit": approvalData.BuyerLimit || 0,
              "POAmt": approvalData.POAmt || 0,
              "ApvAmt": approvalData.ApvAmt || 0,
              "MsgTimeString": approvalData.MsgTimeString || "",
              "ApproverName": approvalData.ApproverName || "",
              "BitFlag": approvalData.BitFlag || 0,
              "MsgFromName": approvalData.MsgFromName || "",
              "MsgToName": approvalData.MsgToName || "",
              "RowMod": "U"
            }
          ],
          "ExtensionTables": []
        }
      };

      console.log("Submitting approval with payload:", updatePayload);

      const updateUrl = `${baseURL}/${company}/Erp.BO.POApvMsgSvc/Update?api-key=${apiKey}`;

      const updateResponse = await fetch(updateUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(updatePayload)
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Update failed:", errorText);
        throw new Error(`Failed to submit approval: ${updateResponse.status}`);
      }

      const result = await updateResponse.json();
      console.log("Update response:", result);

      const overrideNote = isSecurityManager() && approvalData.MsgTo !== username 
        ? ` (Override by Security Manager)` 
        : '';
      
      alert(`PO ${poNum} has been ${response.toLowerCase() === "accept" ? "approved" : "rejected"}${overrideNote}.`);
      
      // Refresh the list
      fetchPOApprovals();
    } catch (err) {
      console.error("Approval submission failed:", err);
      alert(`Failed to submit approval: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getDisplayName = (userId) => {
    if (!userId) return "N/A";
    return userNames[userId] || userId;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const getStatusBadge = (approval) => {
    if (!approval.ApproverResponse || approval.ApproverResponse === "") {
      return {
        text: "Pending",
        style: {
          backgroundColor: "#ffedd5",
          color: "#9a3412",
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "10px",
          fontWeight: "600",
          display: "inline-block",
          marginTop: "4px"
        }
      };
    } else if (approval.ApproverResponse === "APPROVED") {
      return {
        text: "Approved",
        style: {
          backgroundColor: "#dcfce7",
          color: "#166534",
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "10px",
          fontWeight: "600",
          display: "inline-block",
          marginTop: "4px"
        }
      };
    } else if (approval.ApproverResponse === "REJECTED") {
      return {
        text: "Rejected",
        style: {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "10px",
          fontWeight: "600",
          display: "inline-block",
          marginTop: "4px"
        }
      };
    }
    return null;
  };

  // Get status text for display
  const getStatusText = (approval) => {
    if (!approval.ApproverResponse || approval.ApproverResponse === "") {
      return "Pending";
    }
    return approval.ApproverResponse;
  };

  return (
    <div style={container}>
      <h2 style={title}>Purchase Order Approvals</h2>

      <div style={toolbar}>
        <button style={iconBtn} title="Refresh" onClick={fetchPOApprovals}>
          <RefreshIcon fontSize="small" />
        </button>
        
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "12px" }}>
          <span style={{ fontSize: "13px", color: "#2f3a45", fontWeight: "500" }}>Show:</span>
          <select
            style={filterSelectStyle}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="pending">Pending Approvals</option>
            <option value="processed">Processed Approvals</option>
            <option value="all">All Approvals</option>
          </select>
          
          <div style={{ 
            fontSize: "11px", 
            color: "#666", 
            marginLeft: "8px",
            backgroundColor: "#f0f4f8",
            padding: "4px 8px",
            borderRadius: "4px"
          }}>
            Showing {filteredApprovals.length} of {allApprovals.length} total
          </div>
        </div>
        
        <div style={{ flex: 1 }}></div>
        
        <div style={{ fontSize: "13px", color: "#666", display: "flex", alignItems: "center", gap: "8px" }}>
          <div>
            Logged in as: <strong>{username}</strong>
          </div>
          {currentUserData?.SecurityMgr && (
            <div style={{
              backgroundColor: "#e6f4ff",
              color: "#0066cc",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "600",
              border: "1px solid #b3d9ff"
            }}>
              Security Manager
            </div>
          )}
        </div>
      </div>

      {loading && <div style={info}>Loading approvals...</div>}
      {error && <div style={errorStyle}>{error}</div>}

      {!loading && filteredApprovals.length > 0 && (
        <div style={gridWrapper}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Status</th>
                <th style={th}>PO #</th>
                <th style={th}>Date</th>
                <th style={th}>Time</th>
                <th style={th}>Supplier</th>
                <th style={th}>From</th>
                <th style={th}>To</th>
                <th style={th}>Buyer Limit</th>
                <th style={th}>PO Amount</th>
                <th style={th}>Approved Amount</th>
                <th style={th}>Response</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApprovals.map((approval) => {
                const userCanApprove = canUserApprove(approval);
                const isSecurityOverride = isSecurityManager() && approval.MsgTo !== username;
                const isPending = !approval.ApproverResponse || approval.ApproverResponse === "";
                const statusBadge = getStatusBadge(approval);
                
                return (
                  <tr key={approval.SysRowID} style={tr}>
                    <td style={td}>
                      {statusBadge && <div style={statusBadge.style}>{statusBadge.text}</div>}
                    </td>
                    
                    <td style={{...td, fontWeight: "600"}}>
                      {approval.PONum}
                      {isSecurityOverride && isPending && (
                        <div style={{
                          fontSize: "10px",
                          color: "#0066cc",
                          marginTop: "2px"
                        }}>
                          (Override)
                        </div>
                      )}
                    </td>

                    <td style={td}>
                      {formatDateTime(approval.MsgDate).split(' ')[0]}
                    </td>
                    
                    <td style={td}>
                      {approval.MsgTimeString || 
                        (approval.MsgTime ? 
                          `${Math.floor(approval.MsgTime / 3600).toString().padStart(2, '0')}:${Math.floor((approval.MsgTime % 3600) / 60).toString().padStart(2, '0')}` 
                          : "N/A")}
                    </td>
                    
                    <td style={td}>
                      {approval.VendorName || "N/A"}
                    </td>
                    
                    <td style={td}>
                      {approval.MsgFromName || getDisplayName(approval.MsgFrom)}
                    </td>
                    
                    <td style={td}>
                      <div>
                        {approval.MsgToName || getDisplayName(approval.MsgTo)}
                        {isSecurityOverride && isPending && (
                          <div style={{
                            fontSize: "10px",
                            color: "#d97706",
                            marginTop: "2px"
                          }}>
                            Assigned to
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td style={td} align="right">
                      ${formatCurrency(approval.BuyerLimit)}
                    </td>
                    
                    <td style={td} align="right">
                      <span style={{fontWeight: "600"}}>
                        ${formatCurrency(approval.POAmt)}
                      </span>
                    </td>
                    
                    <td style={td} align="right">
                      <span style={{
                        fontWeight: "600",
                        color: approval.ApvAmt === approval.POAmt ? "#166534" : 
                               approval.ApvAmt < approval.POAmt ? "#d97706" : "#991b1b"
                      }}>
                        ${formatCurrency(approval.ApvAmt)}
                      </span>
                      {isPending ? (
                        approval.ApvAmt !== approval.POAmt && (
                          <div style={{
                            fontSize: "10px",
                            color: approval.ApvAmt < approval.POAmt ? "#d97706" : "#991b1b"
                          }}>
                            {approval.ApvAmt < approval.POAmt ? "Partial Approval" : "Exceeds PO"}
                          </div>
                        )
                      ) : (
                        <div style={{
                          fontSize: "10px",
                          color: "#666",
                          fontStyle: "italic"
                        }}>
                          Final
                        </div>
                      )}
                    </td>
                    
                    <td style={td}>
                      {isPending ? (
                        userCanApprove ? (
                          <select
                            style={selectStyle}
                            value={selectedResponses[approval.PONum] || ""}
                            onChange={(e) => handleResponseChange(approval.PONum, e.target.value)}
                            disabled={submitting}
                          >
                            <option value="">Select...</option>
                            <option value="ACCEPT">Accept</option>
                            <option value="REJECT">Reject</option>
                          </select>
                        ) : (
                          <span style={{ color: "#666", fontStyle: "italic" }}>
                            Not your approval
                          </span>
                        )
                      ) : (
                        <div style={{ fontSize: "12px" }}>
                          <div style={{ 
                            fontWeight: "600", 
                            color: approval.ApproverResponse === "APPROVED" ? "#166534" : "#991b1b" 
                          }}>
                            {getStatusText(approval)}
                          </div>
                          {approval.DcdUserID && approval.DcdUserID !== "epicor" && (
                            <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
                              By: {getDisplayName(approval.DcdUserID)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    
                    <td style={td}>
                      {isPending ? (
                        userCanApprove ? (
                          <button
                            style={selectedResponses[approval.PONum] && !submitting ? actionButton : actionButtonDisabled}
                            onClick={() => submitApproval(approval.PONum, approval)}
                            disabled={!selectedResponses[approval.PONum] || submitting}
                          >
                            {submitting ? "Processing..." : "Submit"}
                            {isSecurityOverride && (
                              <span style={{
                                fontSize: "10px",
                                display: "block",
                                marginTop: "2px",
                                opacity: 0.8
                              }}>
                                (Override)
                              </span>
                            )}
                          </button>
                        ) : (
                          <span style={{ color: "#999", fontSize: "12px" }}>
                            Waiting for {approval.MsgToName || getDisplayName(approval.MsgTo)}
                          </span>
                        )
                      ) : (
                        <span style={{ color: "#666", fontSize: "12px", fontStyle: "italic" }}>
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredApprovals.length === 0 && (
        <div style={info}>
          {filterType === "pending" && "No pending purchase order approvals found."}
          {filterType === "processed" && "No processed purchase order approvals found."}
          {filterType === "all" && "No purchase order approvals found."}
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
            <button 
              onClick={fetchPOApprovals}
              style={{ padding: "4px 8px", background: "#eef2f5", border: "1px solid #cfd6dd", borderRadius: "4px", cursor: "pointer" }}
            >
              Click to refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const container = {
  padding: "16px",
  backgroundColor: "#f5f7f9",
  minHeight: "100vh",
};

const title = {
  marginBottom: "12px",
  fontWeight: "600",
};

const gridWrapper = {
  backgroundColor: "#fff",
  border: "1px solid #cfd6dd",
  overflowX: "auto",
  marginTop: "12px",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
  minWidth: "1400px",
};

const th = {
  backgroundColor: "#eef2f5",
  borderBottom: "1px solid #cfd6dd",
  padding: "8px",
  textAlign: "left",
  fontWeight: "600",
  whiteSpace: "nowrap",
};

const td = {
  borderBottom: "1px solid #e1e5ea",
  padding: "8px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

const tr = {
  borderBottom: "1px solid #e1e5ea",
};

const info = {
  padding: "12px",
  backgroundColor: "#fff",
  border: "1px solid #e1e5ea",
  borderRadius: "4px",
  marginTop: "12px",
};

const errorStyle = {
  color: "#d32f2f",
  padding: "12px",
  backgroundColor: "#ffebee",
  border: "1px solid #ffcdd2",
  borderRadius: "4px",
  marginTop: "12px",
};

const toolbar = {
  display: "flex",
  gap: "6px",
  padding: "6px",
  backgroundColor: "#eef2f5",
  border: "1px solid #cfd6dd",
  borderRadius: "4px",
  marginBottom: "12px",
  alignItems: "center",
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
  borderRadius: "4px",
};

const filterSelectStyle = {
  padding: "4px 8px",
  fontSize: "13px",
  borderRadius: "4px",
  border: "1px solid #cbd5e0",
  backgroundColor: "white",
  cursor: "pointer",
  minWidth: "160px",
};

const selectStyle = {
  padding: "4px 8px",
  fontSize: "13px",
  borderRadius: "4px",
  border: "1px solid #cbd5e0",
  backgroundColor: "white",
  minWidth: "100px",
  cursor: "pointer",
};

const actionButton = {
  padding: "6px 12px",
  fontSize: "12px",
  backgroundColor: "#2c5282",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "600",
  minWidth: "80px",
};

const actionButtonDisabled = {
  ...actionButton,
  backgroundColor: "#a0aec0",
  cursor: "not-allowed",
};

export default POApproval;