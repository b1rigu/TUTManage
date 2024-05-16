import express from "express";
import { getClasses } from "./scraper.js";
import path from "path";
import admin from "firebase-admin";
import argon2 from "argon2";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";

dotenv.config();
const app = express();
const __dirname = path.resolve();
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const secretKey = process.env.JWT_SECRET_KEY;
const emailPattern =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/", express.static(path.join(__dirname, "public")));

app.post("/get-classes", async (req, res) => {
    const { username, password, onetimepass } = req.body;
    const allClasses = await getClasses(username, password, onetimepass);
    return res.status(200).json(allClasses);
});

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

function generateJWTToken(email, expiration) {
    return jwt.sign({ email: email }, secretKey, {
        expiresIn: expiration,
    });
}

function checkAuthentication(req, res, next) {
    const token = req.headers["authorization"];

    if (token == null) return res.status(401);

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.get("/verify-reset-password/:token", async (req, res) => {
    try {
        const { token } = req.params;

        if (token == null) return res.status(401).send("No Token Found");

        const resetTokenRef = db.collection("resetTokens").doc(token);
        const resetTokenJson = await resetTokenRef.get();
        if (!resetTokenJson.exists) return res.status(401).send("No Token Found");
        const resetTokenJsonData = resetTokenJson.data();

        jwt.verify(token, secretKey, async (err, user) => {
            if (err) return res.status(403).send("Invalid token");
            const userRef = db.collection("userData").doc(resetTokenJsonData.email);
            await userRef
                .update({
                    password: resetTokenJsonData.toPassword,
                })
                .catch((error) => {
                    if (error.code === 5) {
                        throw "User not found";
                    } else {
                        throw error.code;
                    }
                });
            resetTokenRef.delete();

            const querySnapshot = await db
                .collection("refreshTokens")
                .where("email", "==", resetTokenJsonData.email)
                .get();

            querySnapshot.forEach((doc) => {
                doc.ref.delete();
            });

            return res
                .status(200)
                .send(
                    "Your password has been reset. You can now login with your new password. You can close this window!"
                );
        });
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post("/send-reset-password", async (req, res) => {
    try {
        const { email, toPassword } = req.body;

        const hashedPassword = await hashPassword(toPassword);
        if (!hashedPassword) {
            throw "Error hashing password";
        }
        const userRef = db.collection("userData").doc(email);
        const user = await userRef.get();

        if (user.exists) {
            const resetToken = generateJWTToken(email, "1d");
            const resetTokenJson = {
                resetToken: resetToken,
                email: email,
                toPassword: hashedPassword,
            };
            await db.collection("resetTokens").doc(resetToken).set(resetTokenJson);
            const resetLink = `${process.env.WEBHOST_ADDRESS}/verify-reset-password/${resetToken}`;
            const msg = {
                to: email,
                from: {
                    name: "TUTManage",
                    email: process.env.SENDGRID_FROM_EMAIL,
                },
                templateId: process.env.SENDGRID_TEMPLATE_ID,
                dynamicTemplateData: {
                    username: email,
                    resetLink: resetLink,
                },
            };
            await sgMail.send(msg).catch((error) => {
                throw process.env.SENDGRID_API_KEY;
            });
        }

        return res.sendStatus(200);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post("/refresh-token", async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken;
        if (refreshToken == null) return res.sendStatus(401);
        const refreshTokenRef = db.collection("refreshTokens").doc(refreshToken);
        const refreshTokenJson = await refreshTokenRef.get();
        if (!refreshTokenJson.exists || !refreshTokenJson.data().isActive)
            return res.sendStatus(403);
        jwt.verify(refreshToken, secretKey, (err, user) => {
            if (err) return res.sendStatus(403);
            const accessToken = generateJWTToken(user.email, "15m");
            return res.status(200).json({ accessToken });
        });
    } catch (error) {
        res.status(400).send(error);
    }
});

app.delete("/logout", async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken;
        if (refreshToken == null) return res.sendStatus(401);
        const refreshTokenRef = db.collection("refreshTokens").doc(refreshToken);
        await refreshTokenRef.delete();
        res.sendStatus(200);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const userRef = db.collection("userData").doc(email);
        const user = await userRef.get();

        if (!user.exists || !(await verifyPassword(password, user.data().password))) {
            throw "Invalid email or password";
        }

        const accessToken = generateJWTToken(email, "15m");
        const refreshToken = generateJWTToken(email, "1y");
        const refreshTokenJson = {
            refreshToken: refreshToken,
            email: email,
            isActive: true,
        };
        await db.collection("refreshTokens").doc(refreshToken).set(refreshTokenJson);
        return res.status(200).json({ accessToken, refreshToken });
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
            return res.status(200).send(response);
        }
        throw "User already exists";
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post("/update-userdata", checkAuthentication, async (req, res) => {
    try {
        const { data } = req.body;
        const userRef = db.collection("userData").doc(req.user.email);
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
        return res.status(200).send(response);
    } catch (error) {
        return res.status(400).send(error);
    }
});

app.get("/get-userdata", checkAuthentication, async (req, res) => {
    try {
        const userRef = db.collection("userData").doc(req.user.email);
        const user = await userRef.get();
        if (!user.exists) throw "User not found";
        return res.status(200).json({ data: user.data().data });
    } catch (error) {
        return res.status(400).send(error);
    }
});

app.listen(3000);

export default app;
