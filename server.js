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

    if (!department || !(department in cues)) {
        return res.send({ status: "error", message: "Invalid department" });
    }

    switch(action) {
        case "GO":
            currentAction[department] = "GO";
            break;
        case "STANDBY":
            currentAction[department] = "STANDBY";
            cues[department]++; // advance to next cue
            break;
        case "RESET_ALL":
            // Reset all cues and actions
            for (const dept in cues) {
                cues[dept] = 0;
                currentAction[dept] = "STANDBY";
            }
            break;
        default:
            return res.send({ status: "error", message: "Unknown action" });
    }

    res.send({
        status: "ok",
        department,
        currentCue: cues[department],
        nextCue: cues[department] + 1,
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
        currentCue: cues[department],
        nextCue: cues[department] + 1,
        action: currentAction[department]
    });
});

app.listen(port, () => console.log(`SM server running on port ${port}`));
