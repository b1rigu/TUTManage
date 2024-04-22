import express from "express";
import {
    getClassesStepOne,
    getClassesStepTwo,
    getClassesStepThree,
    getClassesStepFour,
    getClassesStepFive,
} from "./scraper.js";
import path from "path";

const app = express();
const __dirname = path.resolve();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/", express.static(path.join(__dirname, "public")));

app.post("/get-classes-stepone", async (req, res) => {
    const response = await getClassesStepOne();
    res.status(200).json(response);
});

app.post("/get-classes-steptwo", async (req, res) => {
    const body = req.body;
    const response = await getClassesStepTwo(body.username, body.password, body.browserEndpoint);
    res.status(200).json(response);
});

app.post("/get-classes-stepthree", async (req, res) => {
    const body = req.body;
    const response = await getClassesStepThree(body.onetimepass, body.browserEndpoint);
    res.status(200).json(response);
});

app.post("/get-classes-stepfour", async (req, res) => {
    const body = req.body;
    const response = await getClassesStepFour(body.browserEndpoint);
    res.status(200).json(response);
});

app.post("/get-classes-stepfive", async (req, res) => {
    const body = req.body;
    const allClasses = await getClassesStepFive(body.browserEndpoint);
    res.status(200).json(allClasses);
});

app.listen(3000);

export default app;
