import React, { useState, useEffect } from "react";
import Select from "react-select";
import "./App.css";

interface Card {
  id: number;
  title: string;
  content: string;
}

const generateDummyData = (num: number): Card[] => {
  const cards: Card[] = [];
  for (let i = 1; i <= num; i++) {
    cards.push({
      id: i,
      title: `Card ${i}`,
      content: `This is the content of card ${i}.`,
    });
  }
  return cards;
};

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

const App: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedOption, setSelectedOption] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    []
  );

  useEffect(() => {
    // fetchthe building names from the backend
    fetch("/building_names") // fetch call reutrsn a promise of a response object
      .then((response) => response.json()) // .then() receives the response object (using the function that we passed in)
      .then((data) => {
        // .then() chained to handle the resolved value that we got from response.json()
        const buildingOptions = data.map((name: string) => ({
          value: name,
          label: name,
        })); // apply function to each entry in data array to optain buildingOptions array
        setOptions(buildingOptions);
      })
      .catch((error) =>
        console.error("Error fetching building names: ", error)
      );
  }, []); // no dependencies

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSelectChange = (
    selectedOption: { value: string; label: string } | null
  ) => {
    setSelectedOption(selectedOption);
  };

  const generateCards = () => {
    const num = parseInt(input);
    if (!isNaN(num) && num > 0) {
      setCards(generateDummyData(num));
    } else {
      alert("Please enter a valid number greater than 0.");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Empty Room Searcher</h1>
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Enter a number"
          />
          <button onClick={generateCards}>Find Empty Rooms</button>
        </div>
        <div className="select-container">
          <Select
            value={selectedOption}
            onChange={handleSelectChange}
            options={options}
            styles={customStyles}
            placeholder="Select an option"
          />
        </div>
        <div className="card-container">
          {cards.map((card) => (
            <div key={card.id} className="card">
              <h2>{card.title}</h2>
              <p>{card.content}</p>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
};

export default App;
