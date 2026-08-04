import { Router } from 'express'
import User from '../models/User.js'

const router = Router()

router.post('/', async (req, res) => {
	try {
		const { username, email, password } = req.body

		if (!username || !email || !password) {
			res.status(400).json({
				message: 'username、email 和 password 都是必填欄位',
			})
			return
		}

		const existingUser = await User.findOne({ email })

		if (existingUser) {
			res.status(409).json({
				message: '這個 Email 已經註冊',
			})
			return
		}

		const user = await User.create({
			username,
			email,
			password,
		})

		res.status(201).json({
			message: '使用者建立成功',
			user: {
				id: user._id,
				username: user.username,
				email: user.email,
				role: user.role,
			},
		})
	} catch (error) {
		console.error('Failed to create user:', error)

		res.status(500).json({
			message: '建立使用者失敗',
		})
	}
})

export default router
