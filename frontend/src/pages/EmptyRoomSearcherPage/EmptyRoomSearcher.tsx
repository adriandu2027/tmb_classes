import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import "./EmptyRoomSearcher.css";

interface RoomCard {
  room_number: string;
  next_use_time: string;
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

const EmptyRoomSearcher: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [cards, setCards] = useState<RoomCard[]>([]);
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
      fetch(`/open_now?building=${encodedBuilding}`)
        .then((response) => response.json())
        .then((data) => {
          /* Object.entries(data) converts each JSON entry to a key value pair as a tuple */
          const roomCards = Object.entries(data).map(([room, next_time]) => ({
            room_number: room,
            next_use_time: next_time as string,
          }));
          setCards(roomCards);
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
    <div className="EmptyRoomSearcher">
      <header className="EmptyRoomSearcher-header">
        <div className="EmptyRoomSearcher-top-right-button">
          <Link to="/">
            <button>Back to Main Page</button>
          </Link>
        </div>
        <h1>Empty Room Searcher</h1>
        <div className="select-container">
          <Select
            value={selectedOption}
            onChange={handleSelectChange}
            options={options}
            styles={customStyles}
            placeholder="Select an option"
          />
        </div>
        <div className="EmptyRoomSearcher-card-container">
          {cards.map((card) => (
            <div key={card.room_number} className="EmptyRoomSearcher-card">
              <h1>Room {card.room_number}</h1>
              <h2>
                {card.next_use_time === "23:59"
                  ? "Open for the rest of the day"
                  : `Next class at: ${card.next_use_time}`}
              </h2>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
};

export default EmptyRoomSearcher;
