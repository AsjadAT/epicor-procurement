import React, { useState } from "react";
import { Outlet } from "react-router-dom"; // ← ADD THIS
import SideNav from "./SideNav";

const AppLayout = () => { // ← REMOVE props
  const [activePanel, setActivePanel] = useState(null);
  const sidebarWidth = activePanel ? 64 + 180 : 64;

  return (
    <>
      <SideNav
        activePanel={activePanel}
        setActivePanel={setActivePanel}
      />

      <div
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 0.25s ease",
          minHeight: "100vh",
          backgroundColor: "#f5f7fa",
          overflowX: "auto",
          width: `calc(100vw - ${sidebarWidth}px)`,
          boxSizing: "border-box",
        }}
      >
        <Outlet /> {/* ← THIS RENDERS THE CHILD ROUTES */}
      </div>
    </>
  );
};

export default AppLayout;