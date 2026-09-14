const express = require("express");

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/books", (req, res) => {
    res.render("books");
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
