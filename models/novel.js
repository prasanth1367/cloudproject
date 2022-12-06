const mongoose = require('mongoose');
const User =require('./user')
const schema = mongoose.Schema

const ImageSchema = new schema({
  url: String,
  filename: String,
  mimetype: String
});


const NovelSchema = new schema({
    title: {
        type: String,
        required: true
        },
        description: {
        type: String,
        required: true
    },
    images: [ImageSchema],
    author: {
      type: schema.Types.ObjectId,
      ref: 'User'
    },
    
}) 

module.exports = mongoose.model('novel', NovelSchema);
