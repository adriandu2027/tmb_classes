import React, { useEffect, useState } from "react";

const App: React.FC = () => {
  const [members, setMembers] = useState<string[]>([]);

  useEffect(() => {
    fetch("/members")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => setMembers(data.members))
      .catch((error) =>
        console.error("There was a problem with the fetch operation:", error)
      );
  }, []);

  return (
    <div>
      <h1>Members List</h1>
      <ul>
        {members.map((member, index) => (
          <li key={index}>{member}</li>
        ))}
      </ul>
    </div>
  );
};

export default App;
