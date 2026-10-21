import jwt from "jsonwebtoken"

const authMiddleware = (req , res , next)=>{
    try {
        const authHeader =  req.headers.authorization

        if(!authHeader || !authHeader.startsWith("Bearer ")){
             return res.status(401).json({
                message: "No valid authorisation token provided "
            });
        }
        
        const token = authHeader.split(" ")[1];


        const decoded = jwt. verify(
            token, 
            process.env.JWT_SECRET
        )

        if(!decoded || !Number.isInteger(decoded.userId) || typeof decoded.role !== "string"){
            return res.status(401).json({
                message: "Invalid token payload",
            })
        }

        req.user = decoded
        
         next();


    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });
        
    }

}


export default authMiddleware;