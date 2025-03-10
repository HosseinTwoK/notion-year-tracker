import { useEffect, useState } from "react";

const notionDatabaseId = process.env.NOTION_DATABASE_ID;
const notionApiKey = process.env.NOTION_API_KEY;

const NotionYearTracker = () => {
  const [days, setDays] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const year = new Date().getFullYear();
      const isLeapYear =
        (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      const totalDays = isLeapYear ? 366 : 365;

      try {
        let response = await fetch(
          `https://api.notion.com/v1/databases/${notionDatabaseId}/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${notionApiKey}`,
              "Notion-Version": "2022-06-28",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = await response.json();
        let records = data.results;

        if (records.length !== totalDays) {
          console.log("Mismatch in records, initializing database...");
        }

        const formattedDays = records.map((record) => ({
          date: record.properties.Date.date.start,
          checked: record.properties.Check.checkbox,
        }));
        setDays(formattedDays);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const renderGrid = () => {
    const seasons = [
      { name: "Winter", days: 89 },
      { name: "Spring", days: 92 },
      { name: "Summer", days: 93 },
      { name: "Autumn", days: 92 },
    ];
    if (days.length === 366) seasons[0].days = 90;

    let index = 0;
    return seasons.map((season) => (
      <div
        key={season.name}
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 2,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${season.days}, 4px)`,
            gap: 2,
          }}
        >
          {Array.from({ length: season.days }, (_, day) => {
            const isChecked = days[index] ? days[index].checked : false;
            index++;
            return (
              <div
                key={day}
                style={{
                  width: 4,
                  height: 4,
                  backgroundColor: isChecked ? "goldenrod" : "white",
                  border: `1px solid ${isChecked ? "goldenrod" : "#005050"}`,
                }}
              ></div>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        fontFamily: "Arial, sans-serif",
        fontSize: 10,
        textAlign: "center",
        backgroundColor: "#005050",
        padding: 10,
        borderRadius: 10,
        maxWidth: 200,
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
      }}
    >
      <h1 style={{ fontWeight: "bold", color: "white", marginBottom: 5, fontSize: 10 }}>
        Year {new Date().getFullYear()} Day Tracker
      </h1>
      {renderGrid()}
    </div>
  );
};

export default NotionYearTracker;
