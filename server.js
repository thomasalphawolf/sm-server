const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// =====================
// STATE
// =====================
const state = {
  LX: { currentCue: 0, nextCue: 1, action: "NONE" },
  AUTOMATION: { currentCue: 0, nextCue: 1, action: "NONE" }
};

// =====================
// HELPERS
// =====================

// Clear the last action after polling (prevents repeated GO flashes)
function clearAction(dept) {
  if (state[dept]) state[dept].action = "NONE";
}

// Validate department exists
function isValidDept(dept) {
  return dept && state[dept.toUpperCase()];
}

// =====================
// ROUTES
// =====================

// Optional: select department for UI highlight (not needed for actual action)
app.post("/selectDept", (req, res) => {
  const { department } = req.body;
  if (!isValidDept(department)) {
    return res.status(400).json({ error: "Invalid department" });
  }
  res.json({ status: "ok", selectedDept: department.toUpperCase() });
});

// Perform GO / STANDBY / RESET
app.post("/action", (req, res) => {
  const { department, action } = req.body;
  if (!isValidDept(department)) {
    return res.status(400).json({ error: "Invalid department" });
  }

  const dept = department.toUpperCase();

  switch (action.toUpperCase()) {
    case "STANDBY":
      state[dept].action = "STANDBY";
      state[dept].currentCue = state[dept].nextCue;
      break;

    case "GO":
      state[dept].action = "GO";
      state[dept].nextCue++; 

      break;

    case "RESET":
      state[dept].currentCue = 0;
      state[dept].nextCue = 1;
      state[dept].action = "STANDBY";
      break;

    default:
      return res.status(400).json({ error: "Invalid action" });
  }

  console.log(
    `[ACTION] ${action} -> ${dept} | Current: ${state[dept].currentCue}, Next: ${state[dept].nextCue}`
  );

  res.json({
    status: "ok",
    department: dept,
    currentCue: state[dept].currentCue,
    nextCue: state[dept].nextCue,
    action: state[dept].action
  });
});

// Start show / wake server / reset all cues
app.post("/startShow", (req, res) => {
  for (const dept in state) {
    state[dept].currentCue = 0;
    state[dept].nextCue = 1;
    state[dept].action = "STANDBY";
  }
  console.log("[SHOW] Started / Reset all departments");
  res.json({ status: "show started", state });
});

// Poll current state for a department
app.get("/poll/:dept", (req, res) => {
  const deptParam = req.params.dept;
  if (!isValidDept(deptParam)) {
    return res.status(400).json({ error: "Invalid department" });
  }

  const dept = deptParam.toUpperCase();
  const payload = { ...state[dept] };

  // Clear action after sending to prevent repeated GO flashes
  clearAction(dept);

  res.json(payload);
});

// Health check
app.get("/", (req, res) => {
  res.send({ status: "SM Server Online" });
});

// =====================
app.listen(PORT, () => {
  console.log(`SM Server running on port ${PORT}`);
});
