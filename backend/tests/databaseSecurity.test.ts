import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import express, { Router } from 'express'
import mongoose from 'mongoose'

import { connectDatabase } from '../src/configs/database.js'
import { registerUserHandlers } from '../src/controllers/userController.js'

const originalConnect = mongoose.connect
const originalMongoDbUri = process.env.MONGODB_URI

afterEach(() => {
  mongoose.connect = originalConnect
  mongoose.set('sanitizeFilter', false)

  if (originalMongoDbUri === undefined) {
    delete process.env.MONGODB_URI
  } else {
    process.env.MONGODB_URI = originalMongoDbUri
  }
})

describe('MongoDB filter security', () => {
  it('enables sanitizeFilter before connecting to MongoDB', async () => {
    let sanitizeFilterWasEnabled = false

    mongoose.connect = (async () => {
      sanitizeFilterWasEnabled = mongoose.get('sanitizeFilter') === true
      return mongoose
    }) as typeof mongoose.connect
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/pheidi-test'

    await connectDatabase()

    assert.equal(sanitizeFilterWasEnabled, true)
  })

  it('rejects query selector objects submitted to the login endpoint', async () => {
    const app = express()
    const router = Router()

    app.use(express.json())
    registerUserHandlers(router)
    app.use(router)

    const server = app.listen(0)

    try {
      const address = server.address()

      assert.ok(address && typeof address !== 'string')

      const response = await fetch(`http://127.0.0.1:${address.port}/login`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: { $ne: null },
          password: 'password123',
        }),
      })

      assert.equal(response.status, 400)
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })
    }
  })
})
