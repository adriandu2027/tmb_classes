import React from "react";
import "./ClassModal.css";

interface ClassCard {
  Subject: string;
  CourseID: string;
  Name: string;
  CRN: string;
  SectionCode: string;
  Type: string;
  RoomNumber: string;
  Building: string;
  Instructors: string;
  Start: string;
  End: string;
  Days: string;
}

interface Props {
  card: ClassCard | null;
  onClose: () => void;
}

const DAY_MAP: Record<string, string> = {
  M: "Monday",
  T: "Tuesday",
  W: "Wednesday",
  R: "Thursday",
  F: "Friday",
  S: "Saturday",
  U: "Sunday",
};

function expandDays(days: string): string {
  return days
    .split("")
    .map((d) => DAY_MAP[d] ?? d)
    .join(" / ");
}

function formatInstructors(raw: string): string {
  // Raw value looks like "['Last, F']" or "['Last, F', 'Other, G']"
  return raw
    .replace(/^\[|\]$/g, "")
    .replace(/'/g, "")
    .split(", ")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ")
    .replace(/,\s*$/, "");
}

const ClassModal: React.FC<Props> = ({ card, onClose }) => {
  if (!card) return null;

  const courseExplorerUrl = `https://courses.illinois.edu/schedule/2025/spring/${card.Subject}/${card.CourseID}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h1 className="modal-title">{card.Name}</h1>
        <p className="modal-code">
          {card.Subject}{card.CourseID} &nbsp;·&nbsp; Section {card.SectionCode} &nbsp;·&nbsp; CRN {card.CRN}
        </p>

        <div className="modal-grid">
          <div className="modal-field">
            <span className="modal-label">Days</span>
            <span>{expandDays(card.Days)}</span>
          </div>
          <div className="modal-field">
            <span className="modal-label">Time</span>
            <span>{card.Start} – {card.End}</span>
          </div>
          <div className="modal-field">
            <span className="modal-label">Location</span>
            <span>{card.Building} {card.RoomNumber}</span>
          </div>
          <div className="modal-field">
            <span className="modal-label">Type</span>
            <span>{card.Type}</span>
          </div>
          <div className="modal-field modal-field-full">
            <span className="modal-label">Instructors</span>
            <span>{formatInstructors(String(card.Instructors))}</span>
          </div>
        </div>

        <a
          className="modal-link"
          href={courseExplorerUrl}
          target="_blank"
          rel="noreferrer"
        >
          View on Course Explorer ↗
        </a>
      </div>
    </div>
  );
};

export default ClassModal;
