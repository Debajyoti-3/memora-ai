import  jwt  from "jsonwebtoken";
import {User} from "../models/user.model.js"

export const authMiddleware = async (req, res, next) => {
    try {
        const extractedToken = req.cookies.token

        if(!extractedToken){
            return res.status(401).json({message: 'Unauthorized - No Token Provided'});

        }
       const decoded = jwt.verify(extractedToken, process.env.JWT_SECRET_KEY)

       if(!decoded){
        return res.status(401).json({message: 'Unauthorized - Token is Invalid'});
       }

       const user = await User.findById(decoded.userId) // as userId is payload in jwt.sign()

       if(!user){
        return res.status(404).json({message:"User not found"})
       }

       req.user = user

       next()

    } catch (error) {
        console.log('Error in Auth Middleware', error.message)
        res.status(500).json({messge:'Internal Server Error'})
    }
}