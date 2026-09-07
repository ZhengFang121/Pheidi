import 'dotenv/config'

import bcrypt from 'bcrypt'
import mongoose from 'mongoose'

import { connectDatabase } from '../configs/database.js'
import RunnerProgress from '../models/RunnerProgress.js'
import User from '../models/User.js'
import { ensureRunnerProgress } from '../services/runnerProgressService.js'
import { isDuplicateKeyError } from '../utils/mongoose.js'

const demoPassword = 'Runner2026!'

const demoUsers = [
  { username: 'Ethan', email: 'ethan@runner.com', createdAt: '2026-08-18T09:20:00+08:00' },
  { username: 'Liam', email: 'liam@runner.com', createdAt: '2026-08-18T17:35:00+08:00' },
  { username: 'Noah', email: 'noah@runner.com', createdAt: '2026-08-20T11:45:00+08:00' },
  { username: 'Lucas', email: 'lucas@runner.com', createdAt: '2026-08-21T20:15:00+08:00' },
  { username: 'Owen', email: 'owen@runner.com', createdAt: '2026-08-22T14:10:00+08:00' },
  { username: 'Finn', email: 'finn@runner.com', createdAt: '2026-08-23T08:50:00+08:00' },
  { username: 'Ryan', email: 'ryan@runner.com', createdAt: '2026-08-24T10:30:00+08:00' },
  { username: 'Theo', email: 'theo@runner.com', createdAt: '2026-08-24T15:40:00+08:00' },
  { username: 'Mason', email: 'mason@runner.com', createdAt: '2026-08-24T19:25:00+08:00' },
  { username: 'Dylan', email: 'dylan@runner.com', createdAt: '2026-08-27T12:05:00+08:00' },
  { username: 'Chloe', email: 'chloe@runner.com', createdAt: '2026-08-28T18:10:00+08:00' },
  { username: 'Sophie', email: 'sophie@runner.com', createdAt: '2026-08-30T09:55:00+08:00' },
  { username: 'Emma', email: 'emma@runner.com', createdAt: '2026-08-31T16:20:00+08:00' },
  { username: 'Ella', email: 'ella@runner.com', createdAt: '2026-09-02T08:35:00+08:00' },
  { username: 'Ivy', email: 'ivy@runner.com', createdAt: '2026-09-02T13:15:00+08:00' },
  { username: 'Zoe', email: 'zoe@runner.com', createdAt: '2026-09-02T20:05:00+08:00' },
  { username: 'Grace', email: 'grace@runner.com', createdAt: '2026-09-04T11:10:00+08:00' },
  { username: 'Avery', email: 'avery@runner.com', createdAt: '2026-09-05T14:45:00+08:00' },
  { username: 'Riley', email: 'riley@runner.com', createdAt: '2026-09-06T17:20:00+08:00' },
  { username: 'Casey', email: 'casey@runner.com', createdAt: '2026-09-07T19:10:00+08:00' },
] as const

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown seed error'

const verifyDemoUsers = async () => {
  const emails = demoUsers.map(({ email }) => email)
  const users = await User.find({ email: mongoose.trusted({ $in: emails }) })
    .select('+password username email role createdAt')
    .lean()
  const userByEmail = new Map(users.map((user) => [user.email, user]))
  const errors: string[] = []

  for (const expected of demoUsers) {
    const user = userByEmail.get(expected.email)

    if (!user) {
      errors.push(`${expected.email}: user is missing`)
      continue
    }

    if (user.username !== expected.username) errors.push(`${expected.email}: username mismatch`)
    if (user.role !== 'player') errors.push(`${expected.email}: role is not player`)
    if (user.createdAt?.getTime() !== new Date(expected.createdAt).getTime()) {
      errors.push(`${expected.email}: createdAt mismatch`)
    }
    if (!/^\$2[aby]\$\d{2}\$/.test(user.password)) {
      errors.push(`${expected.email}: password is not a bcrypt hash`)
    } else if (!(await bcrypt.compare(demoPassword, user.password))) {
      errors.push(`${expected.email}: password hash does not match the demo password`)
    }
  }

  const progressCount = await RunnerProgress.countDocuments({
    user: mongoose.trusted({ $in: users.map(({ _id }) => _id) }),
  })

  if (progressCount !== demoUsers.length) {
    errors.push(`runner progress count is ${progressCount}; expected ${demoUsers.length}`)
  }

  if (users.length !== demoUsers.length) {
    errors.push(`demo user count is ${users.length}; expected ${demoUsers.length}`)
  }

  if (errors.length) throw new Error(`Demo user verification failed:\n- ${errors.join('\n- ')}`)

  console.log(`Verified: ${users.length} demo users, bcrypt passwords, and runner progress records`)
  for (const expected of demoUsers) {
    const user = userByEmail.get(expected.email)

    if (user?.createdAt) {
      console.log(`Verified user: ${user.username} | ${user.email} | ${user.createdAt.toISOString()}`)
    }
  }
}

const seedDemoUsers = async () => {
  await connectDatabase()

  let created = 0
  let skipped = 0
  let failed = 0

  try {
    for (const demoUser of demoUsers) {
      const existingUser = await User.findOne({ email: demoUser.email }).select('_id')

      if (existingUser) {
        await ensureRunnerProgress(existingUser._id.toString())
        skipped += 1
        console.log(`Skipped: ${demoUser.email}`)
        continue
      }

      const user = new User({
        username: demoUser.username,
        email: demoUser.email,
        password: demoPassword,
        role: 'player',
        createdAt: new Date(demoUser.createdAt),
      })

      try {
        await user.save()
        await ensureRunnerProgress(user._id.toString())
        created += 1
        console.log(`Created: ${demoUser.email}`)
      } catch (error: unknown) {
        if (isDuplicateKeyError(error)) {
          await ensureRunnerProgress(
            (await User.findOne({ email: demoUser.email }).orFail())._id.toString(),
          )
          skipped += 1
          console.log(`Skipped: ${demoUser.email}`)
          continue
        }

        await RunnerProgress.deleteOne({ user: user._id })
        await User.deleteOne({ _id: user._id })
        failed += 1
        console.error(`Failed: ${demoUser.email} (${getErrorMessage(error)})`)
      }
    }

    if (failed === 0) await verifyDemoUsers()

    console.log(`Created: ${created}`)
    console.log(`Skipped: ${skipped}`)
    console.log(`Failed: ${failed}`)

    if (failed > 0) process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

seedDemoUsers().catch(async (error: unknown) => {
  console.error(getErrorMessage(error))

  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()

  process.exitCode = 1
})
