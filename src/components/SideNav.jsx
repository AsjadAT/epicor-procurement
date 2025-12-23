import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@mdi/react";
import {
  mdiMenu,
  mdiHomeOutline,
  mdiCogOutline,
  mdiPower,
  mdiViewGridOutline
} from "@mdi/js";

const SideNav = ({ activePanel, setActivePanel }) => {
  const navigate = useNavigate();

  const openPanel = (panel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  return (
    <div
      style={{
        ...styles.wrapper,
        width: activePanel ? 64 + 180 : 64,   // ✅ KEY FIX
      }}
>

      {/* DARK STRIP */}
      <div style={styles.darkStrip}>
  {/* HOME – NAV ONLY */}
  <div
    style={styles.navItem}
    onClick={() => {
      setActivePanel(null);
      navigate("/requisitions");
    }}
  >
    <div style={styles.iconBox}>
      <Icon path={mdiHomeOutline} size={1} />
    </div>
  </div>

  {/* GRID ICON – OPENS PANEL */}
  <div
    style={styles.navItem}
    onClick={() => openPanel("procurement")}
  >
    <div style={styles.iconBox}>
      <Icon path={mdiViewGridOutline} size={1} />
    </div>
  </div>

  <div style={{ flexGrow: 1 }} />

  {/* LOGOUT */}
  <div
    style={styles.navItem}
    onClick={() => {
      setActivePanel(null);
      navigate("/");
    }}
  >
    <div style={styles.iconBox}>
      <Icon path={mdiPower} size={1} />
    </div>
  </div>
</div>


      {/* WHITE CONTEXT PANEL */}
      <div
  style={{
    ...styles.lightPanel,
    width: activePanel ? 180 : 0,
    borderRight: activePanel ? "1px solid #d0d5dd" : "none", // ✅ FIX
  }}
>

        {activePanel === "procurement" && (
          <div style={styles.panelContent}>
            <div
              style={styles.panelItem}
              onClick={() => navigate("/po-approval")}
            >
              PO Approval
            </div>

            <div
              style={styles.panelItem}
              onClick={() => navigate("/po-entry")}
            >
              PO Entry
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default SideNav;


const styles = {
  wrapper: {
  position: "fixed",
  top: 0,
  left: 0,
  height: "100vh",
  display: "flex",
  zIndex: 1000,
  width: "auto", 
},


  darkStrip: {
    width: 64,
    background: "linear-gradient(180deg,#0b4d5d,#083c49)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
  },

  lightPanel: {
    backgroundColor: "#ffffff",
    borderRight: "1px solid #d0d5dd",
    transition: "width 0.25s ease",
    overflow: "hidden",
  },

  toggle: {
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
  },

  navItem: {
    height: 48,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },

  iconBox: {
    width: 64,
    display: "flex",
    justifyContent: "center",
  },

  label: {
    fontSize: 14,
    color: "#2f3a45",
    whiteSpace: "nowrap",
  },
  panelContent: {
  padding: "12px",
  fontSize: "14px",
},

panelItem: {
  padding: "8px",
  cursor: "pointer",
  borderRadius: "4px",
},

panelItemHover: {
  backgroundColor: "#eef2f5",
},

};
