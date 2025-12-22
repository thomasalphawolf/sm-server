const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

/* -------------------------
   STATE
------------------------- */

let cues = {
    LX: 0,
    Automation: 0
}

let currentAction = {
    LX: "STANDBY",
    Automation: "STANDBY"
}

/* -------------------------
   START SHOW (WAKE SERVER)
------------------------- */
app.post('/startShow', (req, res) => {
    for (const dept in cues) {
        cues[dept] = 0
        currentAction[dept] = "STANDBY"
    }

    console.log("SHOW STARTED / SERVER AWAKE")

    res.send({
        status: "ok",
        message: "Show started, server awake"
    })
})

/* -------------------------
   ACTIONS (GO / STANDBY / RESET)
------------------------- */
app.post('/action', (req, res) => {
    const { department, action } = req.body

    if (action === "RESET_ALL") {
        for (const dept in cues) {
            cues[dept] = 0
            currentAction[dept] = "STANDBY"
        }

        return res.send({ status: "ok", message: "All cues reset" })
    }

    if (!department || !(department in cues)) {
        return res.send({ status: "error", message: "Invalid department" })
    }

    if (action === "GO") {
        currentAction[department] = "GO"
        cues[department]++ // advance next cue immediately
    }

    if (action === "STANDBY") {
        currentAction[department] = "STANDBY"
    }

    res.send({
        status: "ok",
        department,
        currentCue: cues[department] - 1,
        nextCue: cues[department],
        action: currentAction[department]
    })
})

/* -------------------------
   POLL
------------------------- */
app.get('/poll', (req, res) => {
    const department = req.query.department

    if (!department || !(department in cues)) {
        return res.send({ status: "error", message: "Invalid department" })
    }

    res.send({
        status: "ok",
        department,
        currentCue: cues[department] - 1,
        nextCue: cues[department],
        action: currentAction[department]
    })
})

app.listen(port, () => {
    console.log(`SM server running on port ${port}`)
})
