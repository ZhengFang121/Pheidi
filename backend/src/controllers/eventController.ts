import type { Router } from 'express'
import mongoose, { isValidObjectId, Types } from 'mongoose'

import Event, { type IEvent } from '../models/Event.js'
import User from '../models/User.js'
import { resolveEventStatus, validateEventFormData } from '../services/eventService.js'

const eventListFields =
  '_id title summary location startAt endAt distance capacity createdBy participants'
const eventDetailFields = `${eventListFields} content notes`

interface PopulatedCreator {
  _id: Types.ObjectId
  username: string
}

interface AuthenticatedUser {
  userId: string
  role: 'player' | 'admin'
}

type PopulatedEvent = Omit<IEvent, 'createdBy'> & {
  _id: Types.ObjectId
  createdBy: PopulatedCreator | null
}

const toEventResponse = (event: PopulatedEvent, userId: string, includeDetails = false) => {
  const participants = event.participants ?? []
  const participantCount = participants.length

  return {
    id: event._id.toString(),
    title: event.title,
    summary: event.summary,
    location: event.location,
    startAt: event.startAt,
    endAt: event.endAt,
    distance: event.distance,
    capacity: event.capacity,
    participantCount,
    isParticipant: participants.some((participantId) => participantId.toString() === userId),
    status: resolveEventStatus({
      endAt: event.endAt,
      capacity: event.capacity,
      participantCount,
    }),
    createdBy: {
      id: event.createdBy?._id.toString() ?? '',
      username: event.createdBy?.username ?? '已刪除的跑者',
    },
    ...(includeDetails
      ? {
          content: event.content,
          notes: event.notes ?? [],
        }
      : {}),
  }
}

const isEventManager = (event: Pick<IEvent, 'createdBy'>, user: AuthenticatedUser) =>
  user.role === 'admin' || event.createdBy.toString() === user.userId

const getEventId = (eventId: string | undefined) => {
  return eventId && isValidObjectId(eventId) ? eventId : null
}

export const registerEventHandlers = (router: Router) => {
  router.get('/', async (req, res) => {
    try {
      const events = await Event.find({
        endAt: mongoose.trusted({ $gt: new Date() }),
        createdBy: mongoose.trusted({ $exists: true }),
      })
        .select(eventListFields)
        .populate('createdBy', 'username')
        .sort({ startAt: 1 })
        .lean()

      res.status(200).json({
        message: '取得近期跑步活動成功',
        events: events.map((event) =>
          toEventResponse(event as unknown as PopulatedEvent, req.user!.userId),
        ),
      })
    } catch (error: unknown) {
      console.error('Failed to get running event list:', error)
      res.status(500).json({ message: '取得跑步活動失敗' })
    }
  })

  router.get('/:eventId', async (req, res) => {
    try {
      const eventId = getEventId(req.params.eventId)

      if (!eventId) {
        res.status(404).json({ message: '找不到這個活動' })
        return
      }

      const event = await Event.findOne({
        _id: eventId,
        createdBy: mongoose.trusted({ $exists: true }),
      })
        .select(eventDetailFields)
        .populate('createdBy', 'username')
        .lean()

      if (!event) {
        res.status(404).json({ message: '找不到這個活動' })
        return
      }

      res.status(200).json({
        message: '取得跑步活動成功',
        event: toEventResponse(event as unknown as PopulatedEvent, req.user!.userId, true),
      })
    } catch (error: unknown) {
      console.error('Failed to get running event:', error)
      res.status(500).json({ message: '取得跑步活動失敗' })
    }
  })

  router.post('/', async (req, res) => {
    try {
      const validationResult = validateEventFormData(req.body, { requireFutureStart: true })

      if (!validationResult.isValid) {
        res.status(400).json({ message: validationResult.message })
        return
      }

      const creatorExists = await User.exists({ _id: req.user!.userId })

      if (!creatorExists) {
        res.status(404).json({ message: '找不到目前登入的使用者' })
        return
      }

      const event = await Event.create({
        ...validationResult.data,
        createdBy: req.user!.userId,
        participants: [],
      })

      await event.populate('createdBy', 'username')

      res.status(201).json({
        message: '活動建立成功',
        event: toEventResponse(
          event.toObject() as unknown as PopulatedEvent,
          req.user!.userId,
          true,
        ),
      })
    } catch (error: unknown) {
      console.error('Failed to create running event:', error)
      res.status(500).json({ message: '建立活動失敗' })
    }
  })

  router.patch('/:eventId', async (req, res) => {
    try {
      const eventId = getEventId(req.params.eventId)

      if (!eventId) {
        res.status(404).json({ message: '找不到這個活動' })
        return
      }

      const event = await Event.findOne({
        _id: eventId,
        createdBy: mongoose.trusted({ $exists: true }),
      })

      if (!event) {
        res.status(404).json({ message: '找不到這個活動' })
        return
      }

      if (!isEventManager(event, req.user!)) {
        res.status(403).json({ message: '只有活動發起人或管理員可以編輯活動' })
        return
      }

      const validationResult = validateEventFormData(req.body)

      if (!validationResult.isValid) {
        res.status(400).json({ message: validationResult.message })
        return
      }

      if (
        validationResult.data.capacity !== undefined &&
        validationResult.data.capacity < event.participants.length
      ) {
        res.status(400).json({ message: '參加人數上限不能低於目前參加人數' })
        return
      }

      event.title = validationResult.data.title
      event.summary = validationResult.data.summary
      event.content = validationResult.data.content
      event.location = validationResult.data.location
      event.startAt = validationResult.data.startAt
      event.endAt = validationResult.data.endAt
      event.distance = validationResult.data.distance
      event.capacity = validationResult.data.capacity
      event.notes = validationResult.data.notes

      await event.save()
      await event.populate('createdBy', 'username')

      res.status(200).json({
        message: '活動更新成功',
        event: toEventResponse(
          event.toObject() as unknown as PopulatedEvent,
          req.user!.userId,
          true,
        ),
      })
    } catch (error: unknown) {
      console.error('Failed to update running event:', error)
      res.status(500).json({ message: '更新活動失敗' })
    }
  })

  router.delete('/:eventId', async (req, res) => {
    try {
      const eventId = getEventId(req.params.eventId)

      if (!eventId) {
        res.status(404).json({ message: '找不到這個活動' })
        return
      }

      const event = await Event.findOne({
        _id: eventId,
        createdBy: mongoose.trusted({ $exists: true }),
      }).select('createdBy')

      if (!event) {
        res.status(404).json({ message: '找不到這個活動' })
        return
      }

      if (!isEventManager(event, req.user!)) {
        res.status(403).json({ message: '只有活動發起人或管理員可以刪除活動' })
        return
      }

      await event.deleteOne()
      res.status(200).json({ message: '活動刪除成功' })
    } catch (error: unknown) {
      console.error('Failed to delete running event:', error)
      res.status(500).json({ message: '刪除活動失敗' })
    }
  })

  router.post('/:eventId/join', async (req, res) => {
    try {
      const eventId = getEventId(req.params.eventId)

      if (!eventId) {
        res.status(404).json({ message: '找不到這個活動' })
        return
      }

      const userId = new Types.ObjectId(req.user!.userId)
      const userExists = await User.exists({ _id: userId })

      if (!userExists) {
        res.status(404).json({ message: '找不到目前登入的使用者' })
        return
      }

      const event = await Event.findOneAndUpdate(
        {
          _id: eventId,
          createdBy: mongoose.trusted({ $exists: true }),
          endAt: mongoose.trusted({ $gt: new Date() }),
          participants: mongoose.trusted({ $ne: userId }),
          $expr: mongoose.trusted({
            $lt: [
              { $size: { $ifNull: ['$participants', []] } },
              { $ifNull: ['$capacity', 2_147_483_647] },
            ],
          }),
        },
        { $addToSet: { participants: userId } },
        { new: true },
      )
        .select(eventDetailFields)
        .populate('createdBy', 'username')
        .lean()

      if (!event) {
        const currentEvent = await Event.findOne({
          _id: eventId,
          createdBy: mongoose.trusted({ $exists: true }),
        }).select('endAt capacity participants')

        if (!currentEvent) {
          res.status(404).json({ message: '找不到這個活動' })
        } else if (currentEvent.endAt.getTime() <= Date.now()) {
          res.status(409).json({ message: '活動已結束，無法參加' })
        } else if (
          currentEvent.participants.some((participantId) => participantId.equals(userId))
        ) {
          res.status(409).json({ message: '你已經參加這個活動' })
        } else if (
          currentEvent.capacity !== undefined &&
          currentEvent.participants.length >= currentEvent.capacity
        ) {
          res.status(409).json({ message: '活動已額滿' })
        } else {
          res.status(409).json({ message: '參加狀態已變更，請重新載入後再試' })
        }

        return
      }

      res.status(200).json({
        message: '參加活動成功',
        event: toEventResponse(event as unknown as PopulatedEvent, req.user!.userId, true),
      })
    } catch (error: unknown) {
      console.error('Failed to join running event:', error)
      res.status(500).json({ message: '參加活動失敗' })
    }
  })

  router.delete('/:eventId/join', async (req, res) => {
    try {
      const eventId = getEventId(req.params.eventId)

      if (!eventId) {
        res.status(404).json({ message: '找不到這個活動' })
        return
      }

      const userId = new Types.ObjectId(req.user!.userId)
      const event = await Event.findOneAndUpdate(
        {
          _id: eventId,
          createdBy: mongoose.trusted({ $exists: true }),
          participants: userId,
        },
        { $pull: { participants: userId } },
        { new: true },
      )
        .select(eventDetailFields)
        .populate('createdBy', 'username')
        .lean()

      if (!event) {
        const eventExists = await Event.exists({
          _id: eventId,
          createdBy: mongoose.trusted({ $exists: true }),
        })

        res.status(eventExists ? 409 : 404).json({
          message: eventExists ? '你尚未參加這個活動' : '找不到這個活動',
        })
        return
      }

      res.status(200).json({
        message: '已取消參加活動',
        event: toEventResponse(event as unknown as PopulatedEvent, req.user!.userId, true),
      })
    } catch (error: unknown) {
      console.error('Failed to leave running event:', error)
      res.status(500).json({ message: '取消參加活動失敗' })
    }
  })
}
