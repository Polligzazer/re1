import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import ReportForms from "./reportcomp/ReportForms";
import Pending from "./reportcomp/Pending";
import Claimed from "./reportcomp/Claimed";
import ClaimForm from "../components/claimFormRequest";
import AppealForm from "../components/appealFormRequest";

type TabType = "reportForms" | "pendingClaims" | "claimed" | "claimForm" | "appealForm";

const Report = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const [activeTab, setActiveTab] = useState<TabType>("reportForms");
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 992);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    console.log("Query params:", params.toString());
    const tabParam = params.get("tab");

    const showClaimForm = params.get("claimForm");
    const showAppealForm = params.get("appealForm");
    console.log("showAppealForm value:", showAppealForm);
    console.log("showClaimForm value:", showClaimForm);

    if (showClaimForm === "true") {
      setActiveTab("claimForm");
    } else if (showAppealForm === "true") {
      setActiveTab("appealForm");
    } else if (tabParam === "pending") {
      setActiveTab("pendingClaims");
    }
  }, [location.search]);

  const renderContent = () => {
    switch (activeTab) {
      case "reportForms":
        return <ReportForms />;
      case "pendingClaims":
        return <Pending />;
      case "claimed":
        return <Claimed />;
      case "claimForm":
        return <ClaimForm />;
      case "appealForm":
        return <AppealForm />;
      default:
        return <ReportForms />;
    }
  };

  const getTabLabel = (tab: TabType): string => {
    const tabLabels: Record<TabType, string> = {
      reportForms: "Report Forms",
      pendingClaims: "Pending",
      claimed: "Claimed",
      claimForm: "Claim Form",
      appealForm: "Appeal Form"
    };
    return tabLabels[tab] || "Report Forms";
  };

  return (
    <div className="container overflow-y-visible">
      <div className="slide-trans d-flex justify-content-center align-items-center mt-5" style={{
        width:'100%'
      }}>
        <div className="d-flex flex-column" style={{
          width:'50%'
        }}>
        <h3 className="text-start">Report</h3>
        <p className="text-start">Report and Claim your Lost Belongings</p>
        </div>
        
        {isMobile ? (
        <Dropdown className="d-flex align-items-center">
          <Dropdown.Toggle className="btn btn-light bg-transparent border-0">{getTabLabel(activeTab)}</Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => setActiveTab("reportForms")}>
              Report Forms
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setActiveTab("pendingClaims")}>
              Pending
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setActiveTab("claimed")}>
              Claimed
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      ) : (
        <>
        <div className="text-end" style={{
          width:'40%'
        }}>
          <button
            className="btn"
            style={{
              borderBottom: activeTab === "reportForms" ? "1px solid #e8a627" : "none",
              borderRadius:'0px',
              border:'none'
            }}
            onClick={() => setActiveTab("reportForms")}
          >
            Report Forms
          </button>

          <button
            className="btn"
            style={{
              borderBottom: activeTab === "pendingClaims" ? "1px solid #e8a627" : "none",
              borderRadius:'0px',
              border:'none'
            }}
            
            onClick={() => setActiveTab("pendingClaims")}
          >
            Pending
          </button>

          <button
            className="btn"
            style={{
              borderBottom: activeTab === "claimed" ? "1px solid #e8a627" : "none",
              borderRadius:'0px',
              border:'none'
            }}
            onClick={() => setActiveTab("claimed")}
          >
            Claimed
          </button>
        </div>
        </>
      )}

      </div>

      {/* Render Content Below */}
      <div className="overflow-y-visble">{renderContent()}</div>
    </div>
  );
};

export default Report;
