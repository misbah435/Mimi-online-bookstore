const express = require("express");

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
    res.send("Welcome to Mimi Online Bookstore!");
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
