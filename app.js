// app.js
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT",
  "Access-Control-Allow-Headers": "*",
};

const CONTENT_TYPE_TEXT_HEADER = {
  "Content-Type": "text/plain; charset=utf-8",
};

const LOGIN = "99803203-b584-4d0c-a62e-0e9704ea6563";

function corsMiddleware(req, res, next) {
  res.set(CORS_HEADERS);

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
}

export default function (express, bodyParser, mongodb) {
  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(corsMiddleware);

  app.get("/login/", (_req, res) => {
    res.set(CONTENT_TYPE_TEXT_HEADER).send(LOGIN);
  });

  app.post('/insert/', async (req, res) => {
    const login = req.body.login;
    const password = req.body.password;
    const URL = req.body.URL;

    if (!login || !password || !URL || !mongo) return res.status(400).send('Bad Request');
    let client;
    try {
      client = await new mongo.MongoClient(URL, { useNewUrlParser: true, useUnifiedTopology: true }).connect();
      const db = client.db();
      const users = db.collection('users');
      await users.insertOne({ login, password });
      res.status(201).send('OK');
    } catch (err) {
      res.status(500).send('Server Error' + err.message);
    } finally {
      if (client) await client.close();
    }
  });

  app.all(/.*/, (_req, res) => {
    res.set(CONTENT_TYPE_TEXT_HEADER).send(LOGIN);
  });

  return app;
}