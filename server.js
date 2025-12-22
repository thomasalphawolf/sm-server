const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Track cues per department
let cues = {
    Automation: 0,
    LX: 0
};

// Track current action per department
let currentAction = {
    Automation: "STANDBY",
    LX: "STANDBY"
};

// Action endpoint
app.post('/action', (req, res) => {
    const { department, action } = req.body;

    // Reset All doesn't need a department
    if (action === "RESET_ALL") {
        for (const dept in cues) {
            cues[dept] = 0;
            currentAction[dept] = "STANDBY";
        }
        return res.send({ status: "ok", message: "All cues reset" });
    }

    if (!department || !(department in cues)) {
        return res.send({ status: "error", message: "Invalid department" });
    }

    switch(action) {
        case "GO":
            currentAction[department] = "GO";
            cues[department]++; // Advance next cue immediately
            break;

        case "STANDBY":
            currentAction[department] = "STANDBY";
            // Current cue already advanced on GO, no change here
            break;

        default:
            return res.send({ status: "error", message: "Unknown action" });
    }

    res.send({
        status: "ok",
        department,
        currentCue: cues[department] - 1, // Show the cue you just went
        nextCue: cues[department],        // Next cue
        action: currentAction[department]
    });
});

// Poll endpoint
app.get('/poll', (req, res) => {
    const department = req.query.department;
    if (!department || !(department in cues)) {
        return res.send({ status: "error", message: "Invalid department" });
    }

    res.send({
        status: "ok",
        department,
        currentCue: cues[department] - 1,
        nextCue: cues[department],
        action: currentAction[department]
    });
});

app.listen(port, () => console.log(`SM server running on port ${port}`));
