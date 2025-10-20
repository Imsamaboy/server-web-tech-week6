// index.js
import express from "express";
import bodyParser from "body-parser";
import mongodb from "mongodb";

import appSrc from "./app.js";

const app = appSrc(express, bodyParser, mongodb);

app.listen(process.env.PORT || 3000);
