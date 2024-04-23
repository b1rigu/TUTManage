import express from "express";
import { getClasses } from "./scraper.js";
import path from "path";

const app = express();
const __dirname = path.resolve();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/", express.static(path.join(__dirname, "public")));

app.post("/get-classes", async (req, res) => {
    const body = req.body;
    const allClasses = await getClasses(body.username, body.password, body.onetimepass);
    res.status(200).json(allClasses);
});

app.listen(3000);

export default app;
