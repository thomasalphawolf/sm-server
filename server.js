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
  const cue = state[dept];

  switch (action.toUpperCase()) {
    case "GO":
      // Fire the current cue, do NOT advance numbers
      cue.action = "GO";
      break;

    case "STANDBY":
      // Advance to next cue on standby
      cue.currentCue = cue.nextCue;
      cue.nextCue++;
      cue.action = "STANDBY";
      break;

    case "RESET":
      cue.currentCue = 0;
      cue.nextCue = 1;
      cue.action = "STANDBY";
      break;

    default:
      return res.status(400).json({ error: "Invalid action" });
  }

  console.log(
    `[ACTION] ${dept} ${action} | Current: ${cue.currentCue} Next: ${cue.nextCue}`
  );

  res.json({
    status: "ok",
    department: dept,
    currentCue: cue.currentCue,
    nextCue: cue.nextCue,
    action: cue.action
  });
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
