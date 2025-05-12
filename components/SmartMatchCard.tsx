import React from "react";
import { ProgressBar, Button } from "react-bootstrap";
import AnalyticsDoughnut from "./analyticsDoughnut";

// Match weights
export const FIELD_WEIGHTS = {
  itemName: 20,
  category: 10,
  location: 20,
  date: 10,
  description: 40,
};

interface MatchBreakdown {
  itemName: number;
  category: number;
  location: number;
  date: number;
  description: number;
}

interface SmartMatchCardProps {
  match: {
    id: string;
    score: number;
    breakdown: MatchBreakdown;
    isPlaceholder?: boolean;
  };
  rank: number;
  onInquire?: (reportId: string) => void;
}
const SmartMatchCard: React.FC<SmartMatchCardProps> = ({ match, rank, onInquire }) => {

    
const isPlaceholder = match.isPlaceholder; 
  const breakdownFields = [
    { label: "Item Name", value: match.breakdown.itemName, max: FIELD_WEIGHTS.itemName },
    { label: "Category", value: match.breakdown.category, max: FIELD_WEIGHTS.category },
    { label: "Location", value: match.breakdown.location, max: FIELD_WEIGHTS.location },
    { label: "Date", value: match.breakdown.date, max: FIELD_WEIGHTS.date },
    { label: "Description", value: match.breakdown.description, max: FIELD_WEIGHTS.description },
  ];

  return (
    <div
      style={{
        display: "flex",
        borderRadius: "16px",
        backgroundColor: "#f9fbff",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.06)",
        padding: "34px",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: "800px",
        width:'100%',
        margin: "auto",
        marginBottom: "32px",
        flexDirection:'column'
      }}
    >
    <div className="ms-3 d-flex flex-column justify-content-start" style={{width:'100%'}}>  
        <h5 className="fw-bold" style={{ marginBottom: "10px" }}>Match Breakdown</h5>
        <p className="mb-5 ms-1" style={{fontSize:'14px'}}><span className="fw-bold">Report Id:</span> {isPlaceholder ? "—" : match.id}</p>
    </div>  
      {/* Left - Doughnut Chart */}
    <div className="breakdown d-flex flex-row" style={{width:'100%'}}>  
        <div className="lbreakdown" style={{ width: '50%', flex: "0 0 180px", textAlign: "center" }}>
            <AnalyticsDoughnut percentage={isPlaceholder ? 0 : Math.round(match.score)} />
        </div>

        {/* Right - Match Breakdown */}
        <div className="rbreakdown" style={{ flex: 1, paddingLeft: "32px" }}>
        

            {breakdownFields.map((field, index) => {
            const normalized = (field.value / field.max) * 100;

            return (
                <div key={index} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "100px", fontSize: "14px", fontWeight: 500 }}>
                    {field.label}
                    </span>
                
                    <div style={{ flex: 1, maxWidth: "200px", direction: "rtl" }}>
                        <ProgressBar
                            now={isPlaceholder ? 0 : Math.min(normalized, 100)}
                            variant="info"
                            style={{
                            height: "8px",
                            borderRadius: "10px",
                            border: "none",
                            direction: "ltr" // Ensures the internal styling works correctly
                            }}
                        />
                    </div>
                    <span className="percent" style={{ width: "90px", fontSize: "13px", textAlign: "right" }}>
                    {isPlaceholder ? "—" : `${normalized.toFixed(2)}%`}
                    </span>
                </div>
                </div>
            );
            })}

            {/* Inquire Button */}
            <div style={{ textAlign: "right", marginTop: "24px" }}>
            <Button
                variant="success"
                onClick={() => onInquire?.(match.id)} 
                disabled={isPlaceholder}
                style={{ padding: "8px 20px", borderRadius: "8px", fontWeight: 500 }}
            >
                Inquire
            </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SmartMatchCard;
