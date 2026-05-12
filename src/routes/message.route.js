import Router from 'express'
import {authMiddleware} from '../middlewares/auth.middleware.js'
import { createCoversation, getCoversations, sendMessage , getMessages} from '../controllers/message.controller.js'

const router = Router()

router.post('/create-conversation', authMiddleware, createCoversation)
router.get('/get-conversations', authMiddleware, getCoversations)
router.post('/send-message', authMiddleware, sendMessage)   
router.post('/get-message', authMiddleware, getMessages)   

export default router