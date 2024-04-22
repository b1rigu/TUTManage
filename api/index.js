import express from "express";
import { getClasses } from "./scraper.js";
import wifi from "node-wifi";

wifi.init({
    iface: null, // network interface, choose a random wifi interface if set to null
});

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/check-onetime-requirement", async (req, res) => {
    try {
        const wifiToCheck = "tutwifi";
        const wifiinfo = await wifi.getCurrentConnections().catch((error) => {
            throw new Error("Failed");
        });
        if (wifiinfo && wifiinfo[0]) {
            res.status(200).json({ isRequired: wifiinfo[0].ssid != wifiToCheck });
        } else {
            res.status(200).json({ isRequired: true });
        }
    } catch (error) {
        res.send(error);
    }
});

app.get("/get-classes", async (req, res) => {
    const { username, password, onetimepass } = req.query;
    const allClasses = await getClasses(username, password, onetimepass);
    res.status(200).json(allClasses);
});

app.use(express.static("dist/"));

app.listen(3000);

module.exports = app;