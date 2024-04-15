import express from "express";
import { getClasses } from "./scraper.js";

const app = express();

app.use("/", express.static("dist/"));

app.use("/get-classes", async (req, res) => {
    const { username, password, onetimepass } = req.query;
    const allClasses = await getClasses(username, password, onetimepass);
    res.status(200).json(allClasses);
});

app.listen(3000);
