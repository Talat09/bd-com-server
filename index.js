const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
//middle ware
app.use(cors());
app.use(express.json());
//verify jwt
function verifyJwt(req, res, next) {
  console.log("token inside verify jwt", req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.sscngrv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    const usersCollection = client.db("bdcom").collection("users");
    const productsCollection = client.db("bdcom").collection("products");
    app.post("/users", async (req, res) => {
      const users = req.body;
      const query = {
        name: users.name,
        email: users.email,
        password: users.password,
        phone: users.phone,
        employid: users.employid,
        address: users.address,
        status: users.status,
      };
      const result = await usersCollection.insertOne(query);
      res.send(result);
    });
    app.get("/users/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      console.log(email);
      const query = { email: email };
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const result = await usersCollection.findOne(query);
      res.send(result);
    });
    //all products
    app.post("/allproducts", async (req, res) => {
      const product = req.body;

      const query = {
        name: product.name,
        subcategory: product.subcategory,
        model: product.model,
        productId: product.productId,
        photo: product.photo,
        description: product.description,
        quantity: product.quantity,
        price: product.price,
      };
      const result = await productsCollection.insertOne(query);
      res.send(result);
    });
    //get all products
    app.get("/allproducts", verifyJwt, async (req, res) => {
      const query = {};
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });
    //JWT
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      console.log(user);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "24h",
        });
        res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("bdcom server is running");
});
app.listen(port, () => {
  console.log("bd com server is running port: ", port);
});
