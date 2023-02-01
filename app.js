const express = require("express");
const { open } = require("sqlite");

const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1: Register User.

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectedQuery = `
    select * from user
        where username = '${username}';`;
  const dbUser = await db.get(selectedQuery);

  if (dbUser === undefined) {
    // ----------** Scenario 3 **----------
    // Successful registration of the registrant
    const createUserQuery = `
        INSERT INTO user(username, name, password, gender, location)
        values(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        )`;
    // ----------** Scenario 2 **----------
    // If the registrant provides a password with less than 5 characters
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    // ----------** Scenario 1 **----------
    //If the username already exists.
    response.status(400);
    response.send("User already exists");
  }
});
