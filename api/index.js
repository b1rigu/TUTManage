import express from "express";
import { getClasses } from "./scraper.js";
import path from "path";
import admin from "firebase-admin";
import argon2 from "argon2";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import crypto from "crypto";

dotenv.config();
const app = express();
const __dirname = path.resolve();
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const secretKey = generateJwtSecretKey();
const emailPattern =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

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

function generateJwtSecretKey(length = 64) {
    return crypto.randomBytes(length).toString("hex");
}

async function checkAuthentication(req) {
    const token = req.headers["authorization"];
    if (token) {
        const isVerified = jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                return false;
            }
            return true;
        });
        if (isVerified) {
            return {
                isAuthenticated: true,
                data: null,
            };
        } else {
            return {
                isAuthenticated: false,
                data: "Token expired or invalid",
            };
        }
    }

    return {
        isAuthenticated: false,
        data: "No token provided",
    };
}

async function verifyPassword(plainPassword, hashedPassword) {
    try {
        const match = await argon2.verify(hashedPassword, plainPassword);
        return match; // True if passwords match, False otherwise
    } catch (err) {
        console.error(err);
        return false;
    }
}

async function hashPassword(plainPassword) {
    try {
        const hash = await argon2.hash(plainPassword);
        return hash;
    } catch (err) {
        console.error(err);
        return null;
    }
}

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const userRef = db.collection("userData").doc(email);
        const user = await userRef.get();
        if (user.exists && (await verifyPassword(password, user.data().password))) {
            const token = jwt.sign({ email: email }, secretKey, {
                expiresIn: "1d",
            });
            res.status(200).json({ token });
            return;
        }
        throw "Invalid email or password";
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post("/create-account", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!emailPattern.test(email)) {
            throw "Enter a valid email address";
        }

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
        const { data, email } = req.body;
        const userRef = db.collection("userData").doc(email);
        const authenticated = await checkAuthentication(req);
        if (authenticated.isAuthenticated) {
            const response = await userRef
                .update({
                    data: data,
                })
                .catch((error) => {
                    if (error.code === 5) {
                        throw "User not found";
                    } else {
                        throw error.code;
                    }
                });
            res.status(200).send(response);
            return;
        } else {
            throw authenticated.data;
        }
    } catch (error) {
        res.status(403).send(error);
    }
});

app.post("/get-userdata", async (req, res) => {
    try {
        const { email } = req.body;
        const authenticated = await checkAuthentication(req);
        if (authenticated.isAuthenticated) {
            const userRef = db.collection("userData").doc(email);
            const user = await userRef.get();
            if (!user.exists) throw "User not found";
            res.status(200).json({ data: user.data().data });
            return;
        } else {
            throw authenticated.data;
        }
    } catch (error) {
        res.status(403).send(error);
    }
});

app.listen(3000);

export default app;
