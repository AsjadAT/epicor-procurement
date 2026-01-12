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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expandedRow, setExpandedRow] = useState(null);

  //const baseURL = "https://192.168.1.142/kinetic2025demo/api/v2/odata";
  const baseURL = "https://epicorsi/kinetic2025demo/api/v2/odata";
  const company = "EPIC06";
  const apiKey = "wqgWS6cVVd4WnydMRoTNUkLbiBRFY93LJmhp2UzeLmvsC";

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
      setExpandedRow(null);
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
          padding: "4px 10px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "600",
          display: "inline-block",
          width: "fit-content"
        }
      };
    } else if (approval.ApproverResponse === "APPROVED") {
      return {
        text: "Approved",
        style: {
          backgroundColor: "#dcfce7",
          color: "#166534",
          padding: "4px 10px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "600",
          display: "inline-block",
          width: "fit-content"
        }
      };
    } else if (approval.ApproverResponse === "REJECTED") {
      return {
        text: "Rejected",
        style: {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          padding: "4px 10px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "600",
          display: "inline-block",
          width: "fit-content"
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

  const toggleRowExpansion = (poNum) => {
    if (expandedRow === poNum) {
      setExpandedRow(null);
    } else {
      setExpandedRow(poNum);
    }
  };

  const MobileApprovalCard = ({ approval }) => {
    const userCanApprove = canUserApprove(approval);
    const isSecurityOverride = isSecurityManager() && approval.MsgTo !== username;
    const isPending = !approval.ApproverResponse || approval.ApproverResponse === "";
    const statusBadge = getStatusBadge(approval);
    const isExpanded = expandedRow === approval.PONum;

    return (
      <div style={mobileCard}>
        <div style={mobileCardHeader} onClick={() => toggleRowExpansion(approval.PONum)}>
          <div style={mobileCardTitle}>
            <div style={{ fontWeight: "600", fontSize: "16px" }}>
              PO #{approval.PONum}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {statusBadge && <div style={statusBadge.style}>{statusBadge.text}</div>}
              <div style={mobileExpandIcon}>
                {isExpanded ? "▲" : "▼"}
              </div>
            </div>
          </div>
          <div style={mobileCardSubtitle}>
            {approval.VendorName || "N/A"}
            {isSecurityOverride && isPending && (
              <div style={mobileOverrideBadge}>
                (Override)
              </div>
            )}
          </div>
          <div style={mobileCardInfo}>
            <div>${formatCurrency(approval.POAmt)}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {formatDateTime(approval.MsgDate).split(' ')[0]}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div style={mobileCardContent}>
            <div style={mobileInfoGrid}>
              <div style={mobileInfoItem}>
                <label style={mobileLabel}>Date/Time</label>
                <div style={mobileValue}>
                  {formatDateTime(approval.MsgDate)} {approval.MsgTimeString || ""}
                </div>
              </div>
              
              <div style={mobileInfoItem}>
                <label style={mobileLabel}>Supplier</label>
                <div style={mobileValue}>{approval.VendorName || "N/A"}</div>
              </div>
              
              <div style={mobileInfoItem}>
                <label style={mobileLabel}>From</label>
                <div style={mobileValue}>
                  {approval.MsgFromName || getDisplayName(approval.MsgFrom)}
                </div>
              </div>
              
              <div style={mobileInfoItem}>
                <label style={mobileLabel}>To</label>
                <div style={mobileValue}>
                  {approval.MsgToName || getDisplayName(approval.MsgTo)}
                  {isSecurityOverride && isPending && (
                    <div style={{ fontSize: "11px", color: "#d97706", marginTop: "2px" }}>
                      (Assigned to this user)
                    </div>
                  )}
                </div>
              </div>
              
              <div style={mobileInfoItem}>
                <label style={mobileLabel}>Buyer Limit</label>
                <div style={mobileValue}>${formatCurrency(approval.BuyerLimit)}</div>
              </div>
              
              <div style={mobileInfoItem}>
                <label style={mobileLabel}>PO Amount</label>
                <div style={{...mobileValue, fontWeight: "600"}}>
                  ${formatCurrency(approval.POAmt)}
                </div>
              </div>
              
              <div style={mobileInfoItem}>
                <label style={mobileLabel}>Approved Amount</label>
                <div style={{
                  ...mobileValue,
                  fontWeight: "600",
                  color: approval.ApvAmt === approval.POAmt ? "#166534" : 
                        approval.ApvAmt < approval.POAmt ? "#d97706" : "#991b1b"
                }}>
                  ${formatCurrency(approval.ApvAmt)}
                  {isPending && approval.ApvAmt !== approval.POAmt && (
                    <div style={{ fontSize: "11px", color: approval.ApvAmt < approval.POAmt ? "#d97706" : "#991b1b" }}>
                      {approval.ApvAmt < approval.POAmt ? "Partial Approval" : "Exceeds PO"}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={mobileInfoItem}>
                <label style={mobileLabel}>Response</label>
                <div style={mobileValue}>
                  {isPending ? (
                    userCanApprove ? (
                      <select
                        style={mobileSelect}
                        value={selectedResponses[approval.PONum] || ""}
                        onChange={(e) => handleResponseChange(approval.PONum, e.target.value)}
                        disabled={submitting}
                      >
                        <option value="">Select...</option>
                        <option value="ACCEPT">Accept</option>
                        <option value="REJECT">Reject</option>
                      </select>
                    ) : (
                      <div style={{ color: "#666", fontStyle: "italic" }}>
                        Waiting for {approval.MsgToName || getDisplayName(approval.MsgTo)}
                      </div>
                    )
                  ) : (
                    <div>
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
                </div>
              </div>
            </div>

            {isPending && userCanApprove && (
              <div style={mobileActionContainer}>
                <button
                  style={selectedResponses[approval.PONum] && !submitting ? mobileActionButton : mobileActionButtonDisabled}
                  onClick={() => submitApproval(approval.PONum, approval)}
                  disabled={!selectedResponses[approval.PONum] || submitting}
                >
                  {submitting ? "Processing..." : "Submit Approval"}
                  {isSecurityOverride && (
                    <span style={{ fontSize: "11px", display: "block", opacity: 0.8 }}>
                      (Security Manager Override)
                    </span>
                  )}
                </button>
              </div>
            )}

            {!isPending && (
              <div style={mobileCompleted}>
                <span style={{ color: "#666", fontStyle: "italic" }}>
                  Approval completed
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={container}>
      <h2 style={isMobile ? mobileTitle : title}>Purchase Order Approvals</h2>

      <div style={isMobile ? mobileToolbar : toolbar}>
        <button style={iconBtn} title="Refresh" onClick={fetchPOApprovals}>
          <RefreshIcon fontSize="small" />
        </button>
        
        <div style={isMobile ? mobileFilterContainer : { display: "flex", gap: "8px", alignItems: "center", marginLeft: "12px" }}>
          <span style={{ fontSize: "13px", color: "#2f3a45", fontWeight: "500" }}>Show:</span>
          <select
            style={isMobile ? mobileFilterSelect : filterSelectStyle}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="processed">Processed</option>
            <option value="all">All</option>
          </select>
          
          <div style={isMobile ? mobileCountBadge : countBadge}>
            {filteredApprovals.length} of {allApprovals.length}
          </div>
        </div>
        
        <div style={{ flex: 1 }}></div>
        
        <div style={isMobile ? mobileUserInfo : userInfo}>
          <div>
            <strong>{username}</strong>
          </div>
          {currentUserData?.SecurityMgr && (
            <div style={securityBadge}>
              Security Manager
            </div>
          )}
        </div>
      </div>

      {loading && <div style={info}>Loading approvals...</div>}
      {error && <div style={errorStyle}>{error}</div>}

      {!loading && filteredApprovals.length > 0 && (
        <>
          {isMobile ? (
            <div style={mobileGrid}>
              {filteredApprovals.map((approval) => (
                <MobileApprovalCard key={approval.SysRowID} approval={approval} />
              ))}
            </div>
          ) : (
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
        </>
      )}

      {!loading && filteredApprovals.length === 0 && (
        <div style={info}>
          {filterType === "pending" && "No pending purchase order approvals found."}
          {filterType === "processed" && "No processed purchase order approvals found."}
          {filterType === "all" && "No purchase order approvals found."}
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
            <button 
              onClick={fetchPOApprovals}
              style={refreshButton}
            >
              Click to refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Desktop Styles ---------- */
const container = {
  padding: "16px",
  backgroundColor: "#f5f7f9",
  minHeight: "100vh",
  '@media (max-width: 768px)': {
    padding: "12px",
  }
};

const title = {
  marginBottom: "12px",
  fontWeight: "600",
  fontSize: "24px",
  color: "#2d3748",
};

const mobileTitle = {
  marginBottom: "12px",
  fontWeight: "600",
  fontSize: "20px",
  color: "#2d3748",
  textAlign: "center",
};

const gridWrapper = {
  backgroundColor: "#fff",
  border: "1px solid #cfd6dd",
  overflowX: "auto",
  marginTop: "12px",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
  minWidth: "1400px",
};

const th = {
  backgroundColor: "#eef2f5",
  borderBottom: "2px solid #cfd6dd",
  padding: "12px 10px",
  textAlign: "left",
  fontWeight: "600",
  whiteSpace: "nowrap",
  color: "#2d3748",
};

const td = {
  borderBottom: "1px solid #e1e5ea",
  padding: "10px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

const tr = {
  borderBottom: "1px solid #e1e5ea",
};

const info = {
  padding: "20px",
  backgroundColor: "#fff",
  border: "1px solid #e1e5ea",
  borderRadius: "8px",
  marginTop: "12px",
  textAlign: "center",
  fontSize: "14px",
  color: "#4a5568",
};

const errorStyle = {
  color: "#d32f2f",
  padding: "12px",
  backgroundColor: "#ffebee",
  border: "1px solid #ffcdd2",
  borderRadius: "8px",
  marginTop: "12px",
  fontSize: "14px",
};

const toolbar = {
  display: "flex",
  gap: "6px",
  padding: "12px",
  backgroundColor: "#eef2f5",
  border: "1px solid #cfd6dd",
  borderRadius: "8px",
  marginBottom: "12px",
  alignItems: "center",
  flexWrap: "wrap",
};

const mobileToolbar = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "12px",
  backgroundColor: "#eef2f5",
  border: "1px solid #cfd6dd",
  borderRadius: "8px",
  marginBottom: "12px",
};

const iconBtn = {
  width: "40px",
  height: "40px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#ffffff",
  border: "1px solid #cfd6dd",
  cursor: "pointer",
  color: "#2f3a45",
  borderRadius: "6px",
  transition: "background-color 0.2s",
  ':hover': {
    backgroundColor: "#f0f4f8",
  }
};

const filterSelectStyle = {
  padding: "8px 12px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid #cbd5e0",
  backgroundColor: "white",
  cursor: "pointer",
  minWidth: "160px",
  height: "40px",
};

const mobileFilterSelect = {
  padding: "10px 12px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid #cbd5e0",
  backgroundColor: "white",
  cursor: "pointer",
  width: "100%",
  height: "44px",
};

const mobileFilterContainer = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  width: "100%",
};

const countBadge = {
  fontSize: "12px",
  color: "#666",
  backgroundColor: "#f0f4f8",
  padding: "6px 10px",
  borderRadius: "6px",
  fontWeight: "500",
};

const mobileCountBadge = {
  fontSize: "12px",
  color: "#666",
  backgroundColor: "#f0f4f8",
  padding: "8px 12px",
  borderRadius: "6px",
  fontWeight: "500",
  textAlign: "center",
  marginTop: "4px",
};

const userInfo = {
  fontSize: "13px",
  color: "#666",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const mobileUserInfo = {
  fontSize: "14px",
  color: "#666",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "8px 0",
  borderTop: "1px solid #cfd6dd",
  marginTop: "8px",
};

const securityBadge = {
  backgroundColor: "#e6f4ff",
  color: "#0066cc",
  padding: "4px 10px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "600",
  border: "1px solid #b3d9ff",
  whiteSpace: "nowrap",
};

const selectStyle = {
  padding: "6px 10px",
  fontSize: "13px",
  borderRadius: "6px",
  border: "1px solid #cbd5e0",
  backgroundColor: "white",
  minWidth: "100px",
  cursor: "pointer",
  height: "34px",
};

const actionButton = {
  padding: "8px 16px",
  fontSize: "13px",
  backgroundColor: "#2c5282",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
  minWidth: "80px",
  transition: "background-color 0.2s",
  ':hover': {
    backgroundColor: "#2b6cb0",
  }
};

const actionButtonDisabled = {
  ...actionButton,
  backgroundColor: "#a0aec0",
  cursor: "not-allowed",
  ':hover': {
    backgroundColor: "#a0aec0",
  }
};

const refreshButton = {
  padding: "8px 16px",
  background: "#eef2f5",
  border: "1px solid #cfd6dd",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "500",
  transition: "background-color 0.2s",
  ':hover': {
    backgroundColor: "#e2e8f0",
  }
};

/* ---------- Mobile Styles ---------- */
const mobileGrid = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "12px",
};

const mobileCard = {
  backgroundColor: "#fff",
  border: "1px solid #e1e5ea",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const mobileCardHeader = {
  padding: "16px",
  cursor: "pointer",
  backgroundColor: "#f8fafc",
  borderBottom: "1px solid #e1e5ea",
};

const mobileCardTitle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "8px",
};

const mobileExpandIcon = {
  fontSize: "14px",
  color: "#666",
};

const mobileCardSubtitle = {
  fontSize: "14px",
  color: "#4a5568",
  marginBottom: "8px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const mobileOverrideBadge = {
  backgroundColor: "#e6f4ff",
  color: "#0066cc",
  padding: "2px 6px",
  borderRadius: "10px",
  fontSize: "10px",
  fontWeight: "600",
};

const mobileCardInfo = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "14px",
  color: "#2d3748",
};

const mobileCardContent = {
  padding: "16px",
  backgroundColor: "#fff",
};

const mobileInfoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "12px",
  marginBottom: "16px",
  '@media (max-width: 480px)': {
    gridTemplateColumns: "1fr",
  }
};

const mobileInfoItem = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const mobileLabel = {
  fontSize: "12px",
  color: "#718096",
  fontWeight: "500",
};

const mobileValue = {
  fontSize: "14px",
  color: "#2d3748",
  fontWeight: "500",
};

const mobileSelect = {
  padding: "8px 10px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid #cbd5e0",
  backgroundColor: "white",
  width: "100%",
  cursor: "pointer",
  marginTop: "4px",
};

const mobileActionContainer = {
  marginTop: "16px",
  paddingTop: "16px",
  borderTop: "1px solid #e1e5ea",
};

const mobileActionButton = {
  padding: "12px 16px",
  fontSize: "14px",
  backgroundColor: "#2c5282",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
  width: "100%",
  transition: "background-color 0.2s",
  ':hover': {
    backgroundColor: "#2b6cb0",
  }
};

const mobileActionButtonDisabled = {
  ...mobileActionButton,
  backgroundColor: "#a0aec0",
  cursor: "not-allowed",
  ':hover': {
    backgroundColor: "#a0aec0",
  }
};

const mobileCompleted = {
  textAlign: "center",
  padding: "12px",
  color: "#666",
  fontSize: "14px",
  fontStyle: "italic",
  borderTop: "1px solid #e1e5ea",
  marginTop: "16px",
};

export default POApproval;