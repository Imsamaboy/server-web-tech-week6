import express from 'express';
import bodyParser from 'body-parser';
import { createReadStream } from 'fs';
import crypto from 'crypto';
import http from 'http';
import https from 'https';
import pug from 'pug';
import mongo from 'mongodb';
import puppeteer from 'puppeteer-core';

import appSrc from './app.js';

const app = appSrc(express, bodyParser, createReadStream, crypto, http, mongo, https, pug, puppeteer);

app.listen(process.env.PORT || 3000);