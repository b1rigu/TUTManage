import express from "express";
import { getClasses } from "./scraper.js";
import path from "path";
import admin from "firebase-admin";
import argon2 from "argon2";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const __dirname = path.resolve();
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/", express.static(path.join(__dirname, "public")));

app.post("/get-classes", async (req, res) => {
    const body = req.body;
    const allClasses = await getClasses(body.username, body.password, body.onetimepass);
    res.status(200).json(allClasses);
});

async function verifyPassword(plainPassword, hashedPassword) {
    try {
        const match = await argon2.verify(hashedPassword, plainPassword);
        return match; // True if passwords match, False otherwise
    } catch (err) {
        console.error(err);
        return false; // Or handle the error appropriately
    }
}

async function hashPassword(plainPassword) {
    try {
        const hash = await argon2.hash(plainPassword);
        return hash;
    } catch (err) {
        console.error(err);
        return null; // Or handle the error appropriately
    }
}

app.post("/create-account", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const hashedPassword = await hashPassword(password);
        if (!hashedPassword) {
            throw "Error hashing password";
        }
        const userRef = db.collection("userData").doc(email);
        if (!(await userRef.get()).exists) {
            const userJson = {
                email: email,
                password: hashedPassword,
                data: "",
            };
            const response = await db.collection("userData").doc(email).set(userJson);
            res.status(200).send(response);
            return;
        }
        throw "User already exists";
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post("/update-userdata", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const hashedPassword = await hashPassword(password);
        if (!hashedPassword) {
            throw "Error hashing password";
        }
        const data = req.body.data;
        const userRef = db.collection("userData").doc(email);
        const user = await userRef.get();
        if (user.exists && (await verifyPassword(password, user.data().password))) {
            const response = await userRef.update({
                data: data,
            });
            res.status(200).send(response);
            return;
        }
        throw "Username or password wrong";
    } catch (error) {
        res.status(403).send(error);
    }
});

app.post("/get-userdata", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const hashedPassword = await hashPassword(password);
        if (!hashedPassword) {
            throw "Error hashing password";
        }
        const userRef = db.collection("userData").doc(email);
        const user = await userRef.get();
        if (user.exists && (await verifyPassword(password, user.data().password))) {
            res.status(200).json(user.data().data);
            return;
        }
        throw "Username or password wrong";
    } catch (error) {
        res.status(403).send(error);
    }
});

app.listen(3000);

export default app;
