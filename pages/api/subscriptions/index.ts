import { prisma } from "../_lib/prisma-client"
import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  const { userId } = req.query

  if (req.method === "GET") {
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" })
    }
    const subscriptions = await prisma.userSubscription.findMany({
      where: { userId: userId as string }
    })
    return res.status(200).json(subscriptions)
  }

  if (req.method === "POST") {
    const { userId, serviceName, price, startDate, endDate } = req.body
    const newSubscription = await prisma.userSubscription.create({
      data: {
        userId,
        serviceName,
        price: Number(price),
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    })
    return res.status(201).json(newSubscription)
  }

  res.setHeader("Allow", ["GET", "POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
} 