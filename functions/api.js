import express from "express";
import { getClasses } from "./scraper.js";
import { readFile } from "fs/promises";
import admin from "firebase-admin";

const credentials = JSON.parse(
    await readFile(new URL("../serviceAccountKey.json", import.meta.url))
);

admin.initializeApp({
    credential: admin.credential.cert(credentials),
});

const db = admin.firestore();

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.post("/create-account", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userRef = db.collection("userData").doc(email);
        if (!(await userRef.get()).exists) {
            const userJson = {
                email,
                password,
                data: "",
            };
            const response = await db.collection("userData").doc(email).set(userJson);
            res.send(response);
            return;
        }
        res.send("Email already exists");
    } catch (error) {
        res.send(error);
    }
});

app.post("/update-userdata", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const data = req.body.data;
        const userRef = db.collection("userData").doc(email);
        const user = await userRef.get();
        if (user.exists && user.data().password == password) {
            const response = await userRef.update({
                data: data,
            });
            res.send(response);
            return;
        }
        res.send("Username or password wrong");
    } catch (error) {
        res.send(error);
    }
});

app.get("/get-userdata", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userRef = db.collection("userData").doc(email);
        const user = await userRef.get();
        if (user.exists && user.data().password == password) {
            res.status(200).json(user.data().data);
            return;
        }
        res.send("Username or password wrong");
    } catch (error) {
        res.send(error);
    }
});

app.use(express.static("dist/"));

app.use("/get-classes", async (req, res) => {
    const { username, password, onetimepass } = req.query;
    const allClasses = await getClasses(username, password, onetimepass);
    res.status(200).json(allClasses);
});

app.listen(3000);
