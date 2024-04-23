import express from "express";
import path from "path";

const app = express();
const __dirname = path.resolve();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/", express.static(path.join(__dirname, "public")));

app.listen(3000);

export default app;