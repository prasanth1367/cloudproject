const joi = require("joi");
const ExpressError = require('./utils/ExpressError');

module.exports.validateNovel = (req,res,next) => {
    const novelSchema = joi.object({
        novel: joi.object({
            title: joi.string().required(),
            description: joi.string().required(),
            images: joi.array(),
        }).required()
      })
        const {error} = novelSchema.validate(req.body)
        if(error){
            throw new ExpressError(error, 400)
        }

}

