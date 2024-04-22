import express from "express";
import { getClasses } from "./scraper.js";
import wifi from "node-wifi";
import path from "path";

wifi.init({
    iface: null, // network interface, choose a random wifi interface if set to null
});

const app = express();
const __dirname = path.resolve();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/", express.static(path.join(__dirname, "public")));

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

app.post("/get-classes", async (req, res) => {
    const body = JSON.parse(req.body);
    const allClasses = await getClasses(body.username, body.password, body.onetimepass);
    res.status(200).json(allClasses);
});

app.listen(3000);

export default app;
