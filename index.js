const express = require('express')
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const admin = require("firebase-admin");

const cors = require('cors');
require('dotenv').config();
const fileUpload = require('express-fileupload');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sjr78.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db("asSunnahPathagar");
        const booksCollection = database.collection("books");
        const usersCollection = database.collection("users");
        const requestedBookCollection = database.collection("requestedBook");

        // POST API to add books
        app.post('/books', async (req, res) => {
            const name = req.body.name;
            const category = req.body.category;
            const author = req.body.author;
            const translator = req.body.translator;
            const publisher = req.body.publisher;
            const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const book = {
                name,
                category,
                author,
                translator,
                publisher,
                image: imageBuffer
            }
            const result = await booksCollection.insertOne(book);
            res.json(result);
        });


        // GET API (Get all books)
        app.get('/books', async (req, res) => {
            const cursor = booksCollection.find({});
            const books = await cursor.toArray();
            res.send(books.reverse());
        });


        // POST API to add users
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        // PUT API to make admin
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        // GET API (Get books for single user with query)
        app.get('/books', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = booksCollection.find(query);
            const books = await cursor.toArray();
            res.send(books);
        });

        //Get api to get book with id
        app.get('/books/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await booksCollection.findOne(query);
            res.json(result);
        });

        //Get API for admin check...
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        // POST API to add requestedBook
        app.post('/requestedBook', async (req, res) => {
            const requestedBook = req.body;
            const result = await requestedBookCollection.insertOne(requestedBook);
            res.json(result);
        });

        // GET API (Get requestedBook for single user with query)
        app.get('/requestedBook', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = requestedBookCollection.find(query);
            const requestedBook = await cursor.toArray();
            res.send(requestedBook);
        });

    }
    finally {
        //   await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello From As Sunnah Pathagar Server!')
})

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})