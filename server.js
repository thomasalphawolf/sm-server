const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// =====================
// STATE
// =====================
const state = {
  LX: {
    currentCue: 0,
    nextCue: 1,
    action: "NONE"
  },
  AUTOMATION: {
    currentCue: 0,
    nextCue: 1,
    action: "NONE"
  }
};

let selectedDept = "LX";

// =====================
// HELPERS
// =====================
function clearAction(dept) {
  state[dept].action = "NONE";
}

// =====================
// ROUTES
// =====================

// Select department (Stream Deck)
app.post("/selectDept", (req, res) => {
  const { department } = req.body;
  if (!state[department]) {
    return res.status(400).json({ error: "Invalid department" });
  }
  selectedDept = department;
  res.json({ status: "ok", selectedDept });
});

// GO / STANDBY / RESET
app.post("/action", (req, res) => {
  const { action } = req.body;
  const dept = selectedDept;

  if (!state[dept]) {
    return res.status(400).json({ error: "Invalid department" });
  }

  if (action === "GO") {
    state[dept].action = "GO";
    state[dept].currentCue = state[dept].nextCue;
    state[dept].nextCue++;
  }

  if (action === "STANDBY") {
    state[dept].action = "STANDBY";
  }

  if (action === "RESET") {
    state[dept].currentCue = 0;
    state[dept].nextCue = 1;
    state[dept].action = "STANDBY";
  }

  res.json({ status: "ok" });
});

// Wake + reset all
app.post("/startShow", (req, res) => {
  for (const dept in state) {
    state[dept].currentCue = 0;
    state[dept].nextCue = 1;
    state[dept].action = "STANDBY";
  }
  res.json({ status: "show started" });
});

// Poll per department
app.get("/poll/:dept", (req, res) => {
  const dept = req.params.dept.toUpperCase();
  if (!state[dept]) {
    return res.status(400).json({ error: "Invalid department" });
  }

  const payload = { ...state[dept] };
  clearAction(dept);
  res.json(payload);
});

// =====================
app.listen(PORT, () => {
  console.log(`SM Server running on port ${PORT}`);
});
