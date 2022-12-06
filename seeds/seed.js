const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/novel')

mongoose.connect('mongodb://localhost:27017/novel-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});



// const generate = () => {
//     const tags = ['Game of thrones', 'Naruto', 'Trolls', 'Record', 'king of the hill'];
//     const gen = []
//     gen.push(tags[Math.floor(Math.random()*tags.length)])
//     return gen;
// }

const seedDB = async() => {
    await Post.deleteMany({});
    // for (let i=0; i<49; i++){
    //     const givenTags = generate();
    //     const postNew = new Post({
    //         title: givenTags[0],
    //         description: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Laudantium natus enim dolorum possimus aspernatur quam cumque earum fuga! Soluta ut, adipisci reiciendis accusamus facilis ab dolorem earum amet harum voluptatibus.",
    //         images: [
    //             {
    //               url: 'https://res.cloudinary.com/dledbfkjz/image/upload/v1670149664/novelapp/z1wmqfmvinezir2dkqpm.pdf',
    //               filename: 'novelapp/z1wmqfmvinezir2dkqpm',
    //               mimetype: 'application/pdf'
    //             },
    //             {
    //               url: 'https://res.cloudinary.com/dledbfkjz/image/upload/v1670149662/novelapp/zi3lqyv8opeqalkmwf3y.png',
    //               filename: 'novelapp/zi3lqyv8opeqalkmwf3y',
    //               mimetype: 'image/png'
    //             }
    //           ]
           
    //     })
    //     await postNew.save();
    // }
}

seedDB().then(() => {mongoose.connection.close()});

