\# MimiBooks – Online Bookstore



A responsive online bookstore built using \*\*Node.js, Express.js, EJS, and MySQL\*\*. MimiBooks allows users to explore books, create accounts, manage a shopping cart, place orders, and select demo payment methods.



\## Project Overview



MimiBooks is a web-based bookstore developed as a full-stack web development project. It provides a simple and user-friendly shopping experience with a pink-themed interface.



\## Features



\- \*\*User Registration:\*\* Create a new account.

\- \*\*User Login:\*\* Secure password hashing using bcrypt.

\- \*\*Book Catalogue:\*\* Browse available books with details and prices.

\- \*\*Book Search:\*\* Search books by title, author, or category.

\- \*\*Shopping Cart:\*\* Add, update, and remove books.

\- \*\*Checkout:\*\* Enter customer and delivery information.

\- \*\*Payment Options:\*\* UPI, Card, and Cash on Delivery demo options.

\- \*\*Order Management:\*\* Save orders and order items in MySQL.

\- \*\*Order Confirmation:\*\* Display order ID, total, payment method, and status.

\- \*\*Session Management:\*\* Maintain login and cart information.



\## Technologies Used



| Technology | Purpose |

|---|---|

| HTML5 | Page structure |

| CSS3 | Styling and responsive design |

| EJS | Dynamic web pages |

| JavaScript | Application logic |

| Node.js | Server-side runtime |

| Express.js | Backend framework |

| MySQL | Database |

| bcryptjs | Password hashing |

| express-session | Session management |



\## Project Structure



```text

Mimi-online-bookstore/

│

├── config/

│   └── db.js

│

├── public/

│   └── css/

│       └── style.css

│

├── views/

│   ├── partials/

│   │   ├── header.ejs

│   │   └── footer.ejs

│   ├── index.ejs

│   ├── books.ejs

│   ├── login.ejs

│   ├── register.ejs

│   ├── cart.ejs

│   ├── checkout.ejs

│   ├── payment.ejs

│   └── success.ejs

│

├── .env

├── .gitignore

├── package.json

└── server.js

```



\## Installation and Setup



\### 1. Clone the repository



```bash

git clone https://github.com/misbah435/Mimi-online-bookstore.git

```



\### 2. Navigate to the project folder



```bash

cd Mimi-online-bookstore

```



\### 3. Install dependencies



```bash

npm install

```



\### 4. Create the MySQL database



Open MySQL and execute:



```sql

CREATE DATABASE online\_bookstore;

```



\### 5. Configure environment variables



Create a `.env` file in the project root and configure the database credentials and session secret according to `config/db.js`.



Do not upload your `.env` file or database passwords to GitHub.



\### 6. Start the application



```bash

npm run dev

```



If your project does not have a `dev` script, use the start command defined in `package.json`.



\### 7. Open in your browser



```text

http://localhost:3000

```



\## Database



The application uses MySQL with the following main tables:



\- `users` – Stores registered user information.

\- `books` – Stores book details.

\- `orders` – Stores customer orders and payment information.

\- `order\_items` – Stores the books associated with each order.



The application creates the order tables automatically when the server starts. The books table should be created before running the application.



\## Payment Disclaimer



This project uses demonstration payment options. No actual UPI or card transactions are processed. Payment statuses are recorded for demonstration purposes only.



\## Developer



\*\*Misbah Shaikh\*\*



\- PRN: 12414009

\- GitHub: \[@misbah435](https://github.com/misbah435)



\## License



This project is developed for educational and learning purposes.



