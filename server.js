const express = require("express");
const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;

// Cue state per department
const state = {
  LX: {
    current: 0,
    action: "NONE"
  },
  Automation: {
    current: 0,
    action: "NONE"
  }
};

// Stream Deck → POST actions
app.post("/action", (req, res) => {
  const { department, action } = req.body;

  if (!state[department]) {
    return res.status(400).json({ error: "Invalid department" });
  }

  if (action === "GO") {
    state[department].action = "GO";
    state[department].current += 1;
  }

  if (action === "STANDBY") {
    state[department].action = "STANDBY";
  }

  res.json({ status: "ok" });
});

// Roblox → GET polling
app.get("/poll", (req, res) => {
  const department = req.query.department;

  if (!state[department]) {
    return res.status(400).json({ error: "Invalid department" });
  }

  res.json({
    department,
    currentCue: state[department].current,
    nextCue: state[department].current + 1,
    action: state[department].action
  });

  // Reset action after read
  state[department].action = "NONE";
});

app.listen(port, () => {
  console.log("SM Server running on port", port);
});
