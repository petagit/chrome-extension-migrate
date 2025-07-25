import { prisma } from "../_lib/prisma-client"
import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "PUT, DELETE, OPTIONS")
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  )

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  const { id } = req.query
  const { userId, ...data } = req.body

  if (req.method === "PUT") {
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Subscription ID is required" })
    }
    const updatedSubscription = await prisma.userSubscription.update({
      where: { id: id },
      data: {
        ...data,
        price: data.price ? Number(data.price) : undefined,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) })
      }
    })
    return res.status(200).json(updatedSubscription)
  }

  if (req.method === "DELETE") {
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Subscription ID is required" })
    }
    const deleteResult = await prisma.userSubscription.deleteMany({
      where: {
        id: id,
        userId: userId
      }
    })

    if (deleteResult.count === 0) {
      return res
        .status(404)
        .json({
          error: "Subscription not found or user does not have permission"
        })
    }

    return res.status(200).json({ message: "Subscription removed" })
  }

  res.setHeader("Allow", ["PUT", "DELETE"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
} 