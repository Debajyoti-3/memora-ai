import express from 'express'
import {
    signupUser, loginUser, logoutUser, deleteAccount
} from '../controllers/user.controller.js'
import {authMiddleware } from "../middlewares/auth.middleware.js"

const router = express.Router();

router.post('/signup', signupUser)

router.post('/login', loginUser)

router.post('/logout', logoutUser)

router.post('/delete-account', authMiddleware, deleteAccount)

export default router
