import { useEffect, useState } from "react";

const notionDatabaseId = process.env.NOTION_DATABASE_ID;
const notionApiKey = process.env.NOTION_API_KEY;

const NotionYearTracker = () => {
  const [days, setDays] = useState([]);

  useEffect(() => {
    // Change page background color to #191919
    document.body.style.backgroundColor = "#191919";

    // Disable page scrollbars
    document.body.style.overflow = "hidden";

    const fetchData = async () => {
      const year = 2025; // Hardcoding 2025 for now
      const isLeapYear =
        (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      const totalDays = isLeapYear ? 366 : 365;

      const existingDates = []; // Array to store existing date records in Notion

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
            body: JSON.stringify({
              // Fetch all records to check for existing dates
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = await response.json();
        let records = data.results;

        // Check existing records and push the dates to the `existingDates` array
        records.forEach((record) => {
          if (record.properties.Date && record.properties.Date.date) {
            existingDates.push(record.properties.Date.date.start);
          }
        });

        // Generate all dates from 2025-01-01 to 2025-12-31
        const datesToCreate = [];
        for (let i = 1; i <= totalDays; i++) {
          const date = new Date(year, 0, i); // January 1st to December 31st, 2025
          const dateString = date.toISOString().split('T')[0]; // Format date as YYYY-MM-DD

          // If the date is not already in the database, add it
          if (!existingDates.includes(dateString)) {
            datesToCreate.push({
              parent: { database_id: notionDatabaseId },
              properties: {
                Name: {
                  title: [
                    {
                      text: {
                        content: "", // Empty Name
                      },
                    },
                  ],
                },
                Date: {
                  date: {
                    start: dateString, // Set the Date column
                  },
                },
                Check: {
                  checkbox: false, // Default to unchecked
                },
              },
            });
          }
        }

        // If we need to create records, batch insert them
        if (datesToCreate.length > 0) {
          // Notion API allows creating a batch of records (e.g., max 100 per batch)
          for (let i = 0; i < datesToCreate.length; i += 100) {
            const batch = datesToCreate.slice(i, i + 100);

            await fetch(`https://api.notion.com/v1/pages`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${notionApiKey}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(batch),
            });
          }
        }

        // Now that records are created, set the days
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

    return () => {
      document.body.style.overflow = "auto"; // Re-enable scrollbars when the component is unmounted
      document.body.style.backgroundColor = ""; // Reset background color when unmounted
    };
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
          marginBottom: 4,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${season.days}, 4px)`,
            gap: 4, // 4px gap between squares
            overflowX: "hidden", // Ensure no horizontal scroll
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
                  height: 4, // Ensure the squares are the same size
                  backgroundColor: isChecked ? "goldenrod" : "#191919", // Set empty squares to #191919
                  border: `1px solid ${isChecked ? "goldenrod" : "#373c3f"}`,
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
        top: 10,
        left: 10,
        fontFamily: "Arial, sans-serif",
        fontSize: 9,
        textAlign: "center",
        backgroundColor: "#005050",
        padding: 8,
        borderRadius: 10,
        width: 770, // Increased width
        height: 90, // Increased height
        overflow: "hidden", // To prevent overflow scrollbars
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        border: "1px solid #005050",
      }}
    >
      <h1
        style={{
          fontWeight: "bold",
          color: "#191919", // Set text color to #191919
          marginBottom: 5,
          fontSize: 20,
        }}
      >
        Year {new Date().getFullYear()} Day Tracker
      </h1>
      {renderGrid()}
    </div>
  );
};

export default NotionYearTracker;
