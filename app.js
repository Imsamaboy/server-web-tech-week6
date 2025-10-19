// app.js
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT",
  "Access-Control-Allow-Headers": "*",
};

const CONTENT_TYPE_TEXT_HEADER = {
  "Content-Type": "text/plain; charset=utf-8",
};

const LOGIN = "itmo412637";

function corsMiddleware(req, res, next) {
  res.set(CORS_HEADERS);

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
}

function readFile(filePath, createReadStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = createReadStream(filePath);

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("error", (error) => reject(error));
  });
}

function getSha1Hash(text, crypto) {
  return crypto.createHash("sha1").update(text).digest("hex");
}

function readHttpResponse(response) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    response.on("data", (chunk) => chunks.push(chunk));
    response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    response.on("error", (error) => reject(error));
  });
}

export default function (express, bodyParser, createReadStream, crypto, http) {
  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(corsMiddleware);

  app.get("/login/", (_req, res) => {
    res.set(CONTENT_TYPE_TEXT_HEADER).send(LOGIN);
  });

  app.get("/code/", async (_req, res) => {
    const filePath = import.meta.url.substring(7);
    const fileContent = await readFile(filePath, createReadStream);

    res.set(CONTENT_TYPE_TEXT_HEADER).send(fileContent);
  });

  app.get("/sha1/:input/", (req, res) => {
    const hash = getSha1Hash(req.params.input, crypto);

    res.set(CONTENT_TYPE_TEXT_HEADER).send(hash);
  });

  app.get("/req/", (req, res) => {
    http.get(req.query.addr, async (response) => {
      const data = await readHttpResponse(response);

      res.set(CONTENT_TYPE_TEXT_HEADER).send(data);
    });
  });

  app.post("/req/", (req, res) => {
    http.get(req.body.addr, async (response) => {
      const data = await readHttpResponse(response);

      res.set(CONTENT_TYPE_TEXT_HEADER).send(data);
    });
  });

  app.all(/.*/, (_req, res) => {
    res.set(CONTENT_TYPE_TEXT_HEADER).send(LOGIN);
  });

  return app;
}