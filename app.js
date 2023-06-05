const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
app.use(express.json());

let db = null;
const filePath = path.join(__dirname, "userData.db");

const instiliseDBAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
  }
};

instiliseDBAndServer();

// register

app.post("/register/", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const lengthPassword = password.length;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbuser = await db.get(selectUserQuery);
  if (dbuser === undefined) {
    if (lengthPassword < 5) {
      res.status(400);
      res.send("Password is too short");
    } else {
      const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
      await db.run(createUserQuery);
      res.status(200);
      res.send("User created successfully");
    }
  } else {
    res.status(400);
    res.send("User already exists");
  }
});

// Login API

app.post("/login/", async (req, res) => {
  const { username, password } = req.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      res.status(200);
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

//change Password

app.put("/change-password/", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordMatched === true) {
    if (newPassword.length < 5) {
      res.status(400);
      res.send("Password is too short");
    } else {
      const newWord = await bcrypt.hash(newPassword, 10);
      const updateUserQuery = `UPDATE
      user
    SET
      password='${newWord}',
      
    WHERE
      username = ${username};`;
      res.status(200);
      res.send("Password updated");
    }
  } else {
    res.status(400);
    res.send("Invalid current password");
  }
});

module.exports = app;
