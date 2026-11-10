
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const bcrypt = require("bcryptjs");
const db = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: process.env.SESSION_SECRET || "mimibooks-demo-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 1000 * 60 * 60 * 2
    }
}));

// Global EJS variables
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.studentName = "Misbah Shaikh";
    res.locals.prn = "12414009";

    const cart = req.session.cart || {};
    res.locals.cartCount = Object.values(cart)
        .reduce((total, item) => total + item.quantity, 0);

    next();
});

// HOME
app.get("/", async (req, res) => {
    try {
        const [books] = await db.query(
            "SELECT * FROM books ORDER BY id DESC LIMIT 4"
        );
        res.render("index", { books });
    } catch (error) {
        console.error(error);
        res.status(500).send("Unable to load home page.");
    }
});

// REGISTER PAGE
app.get("/register", (req, res) => {
    res.render("register", { error: null });
});

// REGISTER USER
app.post("/register", async (req, res) => {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !password || password !== confirmPassword) {
        return res.status(400).render("register", {
            error: "Please complete all fields and ensure passwords match."
        });
    }

    if (password.length < 8) {
        return res.status(400).render("register", {
            error: "Password must contain at least 8 characters."
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await db.query(
            "INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
            [name.trim(), email.trim().toLowerCase(), phone || null, hashedPassword]
        );

        req.session.user = {
            id: result.insertId,
            name: name.trim(),
            email: email.trim().toLowerCase()
        };

        res.redirect("/");
    } catch (error) {
        console.error(error);

        res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).render("register", {
            error: error.code === "ER_DUP_ENTRY"
                ? "This email is already registered."
                : "Registration failed. Please try again."
        });
    }
});

// LOGIN PAGE
app.get("/login", (req, res) => {
    res.render("login", { error: null });
});

// LOGIN USER
app.post("/login", async (req, res) => {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    try {
        const [users] = await db.query(
            "SELECT id, name, email, password FROM users WHERE email = ?",
            [email]
        );

        if (!users.length || !(await bcrypt.compare(password, users[0].password))) {
            return res.status(401).render("login", {
                error: "Invalid email or password."
            });
        }

        req.session.user = {
            id: users[0].id,
            name: users[0].name,
            email: users[0].email
        };

        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).render("login", {
            error: "Login failed. Please try again."
        });
    }
});

// BOOK CATALOGUE
app.get("/books", async (req, res) => {
    try {
        const search = (req.query.search || "").trim();
        let sql = "SELECT * FROM books";
        let params = [];

        if (search) {
            sql += " WHERE title LIKE ? OR author LIKE ? OR category LIKE ?";
            const term = `%${search}%`;
            params = [term, term, term];
        }

        sql += " ORDER BY title";

        const [books] = await db.query(sql, params);
        res.render("books", { books, search });
    } catch (error) {
        console.error(error);
        res.status(500).send("Unable to load books.");
    }
});

// ADD TO CART
app.post("/cart/add", async (req, res) => {
    try {
        const bookId = Number(req.body.bookId);

        const [books] = await db.query(
            "SELECT id, title, author, price, image FROM books WHERE id = ?",
            [bookId]
        );

        if (!books.length) return res.status(404).send("Book not found.");

        if (!req.session.cart) req.session.cart = {};

        const book = books[0];
        const id = String(book.id);

        if (req.session.cart[id]) {
            req.session.cart[id].quantity++;
        } else {
            req.session.cart[id] = { ...book, quantity: 1 };
        }

        res.redirect("/cart");
    } catch (error) {
        console.error(error);
        res.status(500).send("Unable to add book.");
    }
});

// CART
app.get("/cart", (req, res) => {
    const cart = Object.values(req.session.cart || {});
    const total = cart.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity, 0
    );

    res.render("cart", { cart, total });
});

// UPDATE CART
app.post("/cart/update", (req, res) => {
    const id = String(req.body.bookId);
    const quantity = Number(req.body.quantity);

    if (req.session.cart && req.session.cart[id]) {
        if (quantity <= 0) {
            delete req.session.cart[id];
        } else {
            req.session.cart[id].quantity = Math.min(quantity, 20);
        }
    }

    res.redirect("/cart");
});

// REMOVE FROM CART
app.post("/cart/remove", (req, res) => {
    const id = String(req.body.bookId);

    if (req.session.cart) delete req.session.cart[id];

    res.redirect("/cart");
});

// CHECKOUT PAGE - FIXED
app.get("/checkout", (req, res) => {
    const cart = Object.values(req.session.cart || {});

    if (!cart.length) return res.redirect("/cart");

    const total = cart.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity, 0
    );

    res.render("checkout", {
        cart,
        total,
        error: null,
        details: req.session.checkout || {}
    });
});

// SAVE CHECKOUT DETAILS - FIXED FIELD NAMES
app.post("/checkout", (req, res) => {
    const cart = Object.values(req.session.cart || {});

    if (!cart.length) return res.redirect("/cart");

    const customer_name = (req.body.customerName || req.body.customer_name || "").trim();
    const email = (req.body.email || "").trim();
    const phone = (req.body.phone || "").trim();
    const address = (req.body.address || "").trim();

    const details = { customerName: customer_name, email, phone, address };

    if (!customer_name || !email || !phone || !address) {
        const total = cart.reduce(
            (sum, item) => sum + Number(item.price) * item.quantity, 0
        );

        return res.status(400).render("checkout", {
            cart,
            total,
            error: "Please fill in all delivery details.",
            details
        });
    }

    req.session.checkout = {
        customer_name,
        email,
        phone,
        address,
        customerName: customer_name
    };

    res.redirect("/payment");
});

// PAYMENT PAGE
app.get("/payment", (req, res) => {
    if (!req.session.checkout ||
        !Object.keys(req.session.cart || {}).length) {
        return res.redirect("/cart");
    }

    const cart = Object.values(req.session.cart);
    const total = cart.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity, 0
    );

    res.render("payment", { total });
});

// PROCESS DEMO PAYMENT
app.post("/payment", async (req, res) => {
    const cart = Object.values(req.session.cart || {});
    const checkout = req.session.checkout;
    const paymentMethod = req.body.payment_method;

    if (!checkout || !cart.length) return res.redirect("/cart");

    if (!["UPI", "Card", "Cash on Delivery"].includes(paymentMethod)) {
        return res.status(400).send("Invalid payment method.");
    }

    const total = cart.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity, 0
    );

    const paymentStatus = paymentMethod === "Cash on Delivery"
        ? "Pending - COD"
        : "Paid - Demo";

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [order] = await connection.query(
            `INSERT INTO orders
            (user_id, customer_name, email, phone, address, total,
             payment_method, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.session.user ? req.session.user.id : null,
                checkout.customer_name,
                checkout.email,
                checkout.phone,
                checkout.address,
                total,
                paymentMethod,
                paymentStatus
            ]
        );

        for (const item of cart) {
            await connection.query(
                `INSERT INTO order_items
                (order_id, book_id, book_title, quantity, price)
                VALUES (?, ?, ?, ?, ?)`,
                [order.insertId, item.id, item.title, item.quantity, item.price]
            );
        }

        await connection.commit();

        req.session.cart = {};
        req.session.checkout = null;

        res.render("success", {
            orderId: order.insertId,
            total,
            paymentMethod,
            paymentStatus
        });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).send("Unable to save order. Please try again.");
    } finally {
        if (connection) connection.release();
    }
});

// LOGOUT
app.post("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

// DATABASE TABLES AND STARTUP
async function startServer() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                customer_name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                address TEXT NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(30) NOT NULL,
                payment_status VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                book_id INT NOT NULL,
                book_title VARCHAR(200) NOT NULL,
                quantity INT NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        `);

        const [rows] = await db.query("SELECT COUNT(*) AS total FROM books");

        if (rows[0].total === 0) {
            await db.query(`
                INSERT INTO books
                (title, author, category, price, description)
                VALUES
                ('The Alchemist', 'Paulo Coelho', 'Fiction', 399,
                'A journey of self-discovery and following your dreams.'),
                ('Atomic Habits', 'James Clear', 'Self-help', 499,
                'A practical guide to building good habits and breaking bad ones.'),
                ('The Psychology of Money', 'Morgan Housel', 'Finance', 349,
                'Timeless lessons about wealth, greed and happiness.'),
                ('Ikigai', 'Hector Garcia and Francesc Miralles', 'Lifestyle', 299,
                'Discover the Japanese secret to a long and happy life.'),
                ('Wings of Fire', 'A. P. J. Abdul Kalam', 'Biography', 275,
                'The inspiring autobiography of Dr. A. P. J. Abdul Kalam.'),
                ('Deep Work', 'Cal Newport', 'Productivity', 450,
                'Rules for focused success in a distracted world.')
            `);
            console.log("Sample books added.");
        }

        app.listen(PORT, () => {
            console.log(`Mimi Online Bookstore running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Unable to start application:", error.message);
        process.exit(1);
    }
}

startServer();
