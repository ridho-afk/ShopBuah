const Users = require('../models/userModel')
const Payments = require('../models/paymentModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const {google} = require('googleapis')
const {OAuth2} = google.auth
const fetch = require('node-fetch')

const client = new OAuth2(process.env.MAILING_SERVICE_CLIENT_ID)

const userCtrl = {
    register: async (req, res) =>{
        try {
            const {name, email, password} = req.body;

            const user = await Users.findOne({email})
            if(user) return res.status(400).json({msg: "The email already exists."})

            if(password.length < 6) 
                return res.status(400).json({msg: "Password is at least 6 characters long."})

            // Password Encryption
            const passwordHash = await bcrypt.hash(password, 10)
            const newUser = new Users({
                name, email, password: passwordHash
            })

            // Save mongodb
            await newUser.save()

            // Then create jsonwebtoken to authentication
            const accesstoken = createAccessToken({id: newUser._id})
            const refreshtoken = createRefreshToken({id: newUser._id})

            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7*24*60*60*1000 // 7d
            })

            res.json({accesstoken})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    login: async (req, res) =>{
        try {
            const {email, password} = req.body;

            const user = await Users.findOne({email})
            if(!user) return res.status(400).json({msg: "User does not exist."})

            const isMatch = await bcrypt.compare(password, user.password)
            if(!isMatch) return res.status(400).json({msg: "Incorrect password."})

            // If login success , create access token and refresh token
            const accesstoken = createAccessToken({id: user._id})
            const refreshtoken = createRefreshToken({id: user._id})

            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7*24*60*60*1000 // 7d
            })

            res.json({accesstoken})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    logout: async (req, res) =>{
        try {
            res.clearCookie('refreshtoken', {path: '/user/refresh_token'})
            return res.json({msg: "Logged out"})
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    refreshToken: (req, res) =>{
        try {
            const rf_token = req.cookies.refreshtoken;
            if(!rf_token) return res.status(400).json({msg: "Please Login or Register"})

            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) =>{
                if(err) return res.status(400).json({msg: "Please Login or Register"})

                const accesstoken = createAccessToken({id: user.id})

                res.json({accesstoken})
            })

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
        
    },
    getUser: async (req, res) =>{
        try {
            const user = await Users.findById(req.user.id).select('-password')
            if(!user) return res.status(400).json({msg: "User does not exist."})

            res.json(user)
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    addCart: async (req, res) =>{
        try {
            const user = await Users.findById(req.user.id)
            if(!user) return res.status(400).json({msg: "User does not exist."})

            await Users.findOneAndUpdate({_id: req.user.id}, {
                cart: req.body.cart
            })

            return res.json({msg: "Added to cart"})
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    history: async(req, res) =>{
        try {
            const history = await Payments.find({user_id: req.user.id})

            res.json(history)
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    googlelogin: async(req, res) =>{
        try {
                const {tokenId} = req.body
    
                const verify = await client.verifyIdToken({idToken: tokenId, audience: process.env.MAILING_SERVICE_CLIENT_ID})
                
                const {email_verified,email, name} = verify.payload
    
                const password = email + process.env.GOOGLE_SECRET
    
                const passwordHash = await bcrypt.hash(password, 12)
    
                if(!email_verified) return res.status(400).json({msg: "Email verification failed."})
    
                const user = await Users.findOne({email})
    
                if(user){
                    const isMatch = await bcrypt.compare(password, user.password)
                    if(!isMatch) return res.status(400).json({msg: "Password is incorrect."})
    
                    const refresh_token = createRefreshToken({id: user._id})
                    res.cookie('refreshtoken', refresh_token, {
                        httpOnly: true,
                        path: '/user/refresh_token',
                        maxAge: 7*24*60*60*1000 // 7 days
                    })
    
                    res.json({msg: "Login success!"})
                }else{
                    const newUser = new Users({
                        name, email, password: passwordHash
                    })
    
                    await newUser.save()
                    
                    const refresh_token = createRefreshToken({id: newUser._id})
                    res.cookie('refreshtoken', refresh_token, {
                        httpOnly: true,
                        path: '/user/refresh_token',
                        maxAge: 7*24*60*60*1000 // 7 days
                    })
    
                    res.json({msg: "Login success!"})
                }
    
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    }
 }


const createAccessToken = (user) =>{
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '11m'})
}
const createRefreshToken = (user) =>{
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'})
}

module.exports = userCtrl

