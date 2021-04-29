const keys = require("./keys");

// Express App Setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool, Client } = require("pg");
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient
  .connect()
  .then((client) => {
    return client
      .query("CREATE TABLE IF NOT EXISTS values (number integer)")
      .then((res) => client.release());
  })
  .then(() => console.log("Table created"))
  .catch((err) => console.log({ err }));

// pgClient.query(
//   "DROP TABLE IF EXISTS values;" + " CREATE TABLE values (number integer)",
//   [],
//   (err, res) => {
//     if (err) {
//       throw err;
//     }
//     console.log("TABLE created");
//     pgClient.end();
//   }
// );

// pgClient.on("connect", (client) => {
//   client
//     .query("CREATE TABLE IF NOT EXISTS values (number INT)")
//     .catch((err) => console.error(err));
// });

// pgClient.connect((err) => {
//   if (err) {
//     throw err;
//   }

//   pgClient.query(
//     "DROP TABLE IF EXISTS values;" + " CREATE TABLE values (number integer)",
//     (error) => {
//       if (error) {
//         throw error;
//       }
//       console.log("Table created");
//     }
//   );
// });

// Redis Client Setup
const redis = require("redis");
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get("/", (req, res) => {
  res.send("Hi");
});

app.get("/values/all", async (req, res) => {
  try {
    const values = await pgClient.query("SELECT * from values");
    console.log({ values: values.rows });
    res.send(values.rows);
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: error.stack || "Something went wrong" });
  }
});

app.get("/values/current", async (req, res) => {
  redisClient.hgetall("values", (err, values) => {
    res.send(values);
  });
});

app.post("/values", async (req, res) => {
  const index = Number(req.body.index);
  console.log({ index });

  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  redisClient.hset("values", index, "Nothing yet!");
  redisPublisher.publish("insert", index);
  await pgClient.query(`INSERT INTO values(number) VALUES($1)`, [index]);

  res.send({ working: true, host: keys.pgHost });
});

app.listen(5000, (err) => {
  console.log("Listening on port 5000");
});
