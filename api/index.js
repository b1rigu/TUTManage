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

async function checkAuthentication(req, userRef, user, email, password) {
    const token = req.headers["authorization"];
    if (token) {
        const verificationResult = jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                return null;
            }
            return decoded;
        });
        if (verificationResult && (await verifyPassword(password, verificationResult.password))) {
            return {
                isAuthenticated: true,
                data: null,
            };
        }
    }

    const userLocal = user ? user : await userRef.get();
    if (userLocal.exists && (await verifyPassword(password, userLocal.data().password))) {
        const token = jwt.sign(
            { email: email, password: await hashPassword(password) },
            secretKey,
            {
                expiresIn: "1h",
            }
        );
        return {
            isAuthenticated: true,
            data: token,
        };
    }

    return {
        isAuthenticated: false,
        data: "Invalid email or password",
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
        const { email, password } = req.body;
        const data = req.body.data;
        const userRef = db.collection("userData").doc(email);
        const authenticated = await checkAuthentication(req, userRef, null, email, password);
        if (authenticated.isAuthenticated) {
            const response = await userRef.update({
                data: data,
            });
            const token = authenticated.data;
            if (token) {
                res.status(200).send(token);
            } else {
                res.status(200).send("");
            }
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
        const { email, password } = req.body;
        const userRef = db.collection("userData").doc(email);
        const user = await userRef.get();
        const authenticated = await checkAuthentication(req, userRef, user, email, password);
        if (authenticated.isAuthenticated) {
            const token = authenticated.data;
            if (token) {
                res.status(200).json({
                    token: token,
                    data: user.data().data,
                });
            } else {
                res.status(200).json({
                    token: null,
                    data: user.data().data,
                });
            }
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
