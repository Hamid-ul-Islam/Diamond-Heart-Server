const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const discount = require("./utils/discount");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("combined"));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Define product schema and model
const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  brand: { type: String },
  stock: { type: Number },
  rating: { type: Number },
  discountPercentage: { type: Number },
  images: [{ type: String }],
  thumbnail: { type: String },
  category: { type: String },
  isDeliveryFree: { type: Boolean },
});
const Product = mongoose.model("Product", ProductSchema);

const OrderSchema = new mongoose.Schema({
  totalAmount: String,
  line_items: Object,
  name: String,
  email: String,
  city: String,
  phone: String,
  address: String,
  paid: Boolean,
});

const Order = mongoose.model("Order", OrderSchema);

const UserSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  address: String,
  password: {
    type: String,
    required: true,
    unique: true,
  },
});

const User = mongoose.model("User", UserSchema);

// Routes
app.post("/register", async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  const dbUser = await User.findOne(email);
  if (dbUser) {
    res.send("user already exist");
  } else {
    const saved = await User.create({
      name,
      email,
      password,
      phone,
      address,
    });
    res.status(201).json(saved);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const dbUser = await User.findOne(email);
  if (dbUser) {
    if (dbUser.password === password) {
      res.status(201).json(dbUser);
    } else {
      res.status(500).send("Wrong credentials");
    }
  }
});

app.get("/user", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne(email);
  res.status(201).json(user);
});

app.get("/products", async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 100;
    const products = await Product.find().limit(limit);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/products/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/products/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/products/category/:cat", async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.cat });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//create order
app.post("/order", async (req, res) => {
  const { email, name, address, city, phone, cartProducts } = req.body;

  let line_items = [];
  totalAmount = 0;

  for (const product of cartProducts) {
    const { quantity, title, price, discountPercentage } = product;

    totalAmount += discount(price, discountPercentage);

    if (quantity > 0 && price) {
      line_items.push({
        quantity,
        price_data: {
          currency: "BDT",
          product_data: { name: title },
          unit_amount: discount(price, discountPercentage) * 100,
        },
      });
    }
  }

  const orderDoc = await Order.create({
    totalAmount,
    line_items,
    email,
    phone,
    name,
    address,
    city,
    paid: false,
  });

  res.json(orderDoc);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
