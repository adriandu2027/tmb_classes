import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import "./ClassFinder.css";
import ClassModal from "./ClassModal";

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
  StartTime: string;
  EndTime: string;
}

const customStyles = {
  control: (provided: any) => ({
    ...provided,
    margin: "10px 0",
    width: "600px", // Fixed width for the dropdown
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    color: "black",
    backgroundColor: state.isSelected ? "#007bff" : "white",
    ":hover": {
      backgroundColor: state.isSelected ? "#007bff" : "#f2f2f2",
    },
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "black",
  }),
  menu: (provided: any) => ({
    ...provided,
    zIndex: 9999,
    width: "600px", // Fixed width for the dropdown options
  }),
};

const ClassFinder: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [cards, setCards] = useState<ClassCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ClassCard | null>(null);
  const [selectedOption, setSelectedOption] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    []
  );

  useEffect(() => {
    // fetch the building names from the backend
    fetch("/building_names")
      .then((response) => response.json())
      .then((data) => {
        const buildingOptions = data.map((name: string) => ({
          value: name,
          label: name,
        }));
        setOptions(buildingOptions);
      })
      .catch((error) =>
        console.error("Error fetching building names: ", error)
      );
  }, []);

  useEffect(() => {
    if (selectedOption) {
      const encodedBuilding = encodeURIComponent(selectedOption.value);
      fetch(`/class_now?building=${encodedBuilding}`)
        .then((response) => response.json())
        .then((data: ClassCard[]) => {
          console.log(data);
          /* TypeScript will match the interface field names to the names in the JSON response*/
          setCards(data);
        })
        .catch((error) => console.error("Error fetching data:", error));
    }
  }, [selectedOption]);

  const handleSelectChange = (
    selectedOption: { value: string; label: string } | null
  ) => {
    setSelectedOption(selectedOption);
  };

  return (
    <div className="ClassFinder">
      <header className="ClassFinder-header">
        <div className="ClassFinder-top-right-button">
          <Link to="/">
            <button>Back to Main Page</button>
          </Link>
        </div>
        <h1>Class Finder</h1>
        <div className="select-container">
          <Select
            value={selectedOption}
            onChange={handleSelectChange}
            options={options}
            styles={customStyles}
            placeholder="Select an option"
          />
        </div>
        <div className="ClassFinder-card-container">
          {cards.map((card) => (
            <div key={card.CRN} className="ClassFinder-card" onClick={() => setSelectedCard(card)} style={{ cursor: "pointer" }}>
              <h1>{card.Name}</h1>
              <div className="ClassFinder-card-meta">
                <span className="ClassFinder-card-meta-time">{card.StartTime} – {card.EndTime}</span>
                <span className="ClassFinder-card-badge">Room {card.RoomNumber}</span>
                <span className="ClassFinder-card-badge">{card.Type}</span>
              </div>
              <div className="ClassFinder-card-sub">
                <span>{card.Subject}{card.CourseID} · {card.SectionCode}</span>
                <span>{card.Instructors}</span>
              </div>
            </div>
          ))}
        </div>
        <h2>{cards.length === 0 ? "No classes currently" : ""}</h2>
        <ClassModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      </header>
    </div>
  );
};

export default ClassFinder;
