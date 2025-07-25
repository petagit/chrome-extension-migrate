import { useUser } from "@clerk/chrome-extension"
import React, { useCallback, useEffect, useState } from "react"
import { Toaster, toast } from "react-hot-toast"
import { BillUploadDialog } from "~/BillUploadDialog"
import { AddSubscriptionDialog } from "~features/AddSubscriptionDialog"
import EditSubscriptionDialog from "~features/EditSubscriptionDialog" // Import the new dialog
import api from "~lib/api"

// Define the type for a subscription to match the Prisma schema
type Subscription = {
  id: string
  serviceName: string
  price: number | string
  endDate: string // Changed from nextBilling to endDate
  notes?: string
  userId?: string
  category?: string
  cancellationUrl?: string;
}

const NewSubscriptionList = ({
  refresh,
  setRefresh
}: {
  refresh: boolean
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [recentlyDeleted, setRecentlyDeleted] = useState<Subscription | null>(
    null
  )
  const { user } = useUser()

  // Fetch subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user) return
      setLoading(true)
      try {
        const data = await api.getSubscriptions(user.id)
        setSubscriptions(data as any)
      } catch (error) {
        console.error("Failed to fetch subscriptions:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSubscriptions()
  }, [user, refresh])

  // Undo a delete
  const handleUndo = useCallback(async () => {
    if (!recentlyDeleted) return

    const subToRestore = { ...recentlyDeleted }
    // The backend will assign a new ID, so we don't need the old one.
    delete subToRestore.id
    // The userId will be inferred by the backend from the session.
    delete subToRestore.userId

    const promise = api
      .addSubscription({
        ...subToRestore,
        userId: user.id,
        price: Number(subToRestore.price),
        startDate: new Date().toISOString(),
        endDate: new Date(subToRestore.endDate).toISOString()
      })
      .then(() => {
      setRefresh((r) => !r) // Refresh list to get the new item
      setRecentlyDeleted(null) // Clear recently deleted
    })

    toast.promise(promise, {
      loading: "Restoring subscription...",
      success: "Subscription restored!",
      error: (err) => `Error: ${err.message}`
    })
  }, [recentlyDeleted, refresh, user.id])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        event.preventDefault()
        handleUndo()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleUndo])

  // Delete a subscription
  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!user) return

    const originalSubscriptions = subscriptions
    const subToDelete = originalSubscriptions.find(
      (sub) => sub.id === subscriptionId
    )

    if (!subToDelete) return

    // Optimistically update UI
    setSubscriptions((prev) => prev.filter((sub) => sub.id !== subscriptionId))
    setRecentlyDeleted(subToDelete)

    // Notify user
    toast.success("Subscription deleted. Press Cmd/Ctrl+Z to undo.", {
      duration: 5000
    })

    // Clear the 'recentlyDeleted' after a timeout, so undo is not possible indefinitely
    setTimeout(() => {
      setRecentlyDeleted(null)
    }, 5000)

    try {
      await api.removeSubscription(subscriptionId, user.id)
      // On success, the optimistic UI update is correct.
    } catch (error) {
      // On failure, revert the UI and show an error.
      setSubscriptions(originalSubscriptions)
      setRecentlyDeleted(null)
      toast.error(`Error deleting subscription: ${error.message}`)
    }
  }

  // Update a subscription
  const handleUpdateSubscription = async (subscription: Subscription) => {
    if (!user) return

    const promise = api
      .updateSubscription(subscription.id, {
        ...subscription,
        price: Number(subscription.price)
      })
      .then(() => {
        setRefresh(!refresh)
    })

    toast.promise(promise, {
      loading: "Updating subscription...",
      success: "Subscription updated successfully!",
      error: (err) => `Error: ${err.message}`
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg">Loading your subscriptions...</p>
      </div>
    )
  }

  // NOTE: Static calculations are replaced by dynamic data
  const totals = {
    monthly: subscriptions
      .reduce((acc, sub) => acc + Number(sub.price), 0)
      .toFixed(2),
    yearly: (
      subscriptions.reduce((acc, sub) => acc + Number(sub.price), 0) * 12
    ).toFixed(2),
    active: subscriptions.length
  }

  return (
    <div className="p-4 bg-gray-50 text-gray-800 w-full font-sans">
      <Toaster position="top-center" />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-blue-500">monthly spending</p>
          <p className="text-2xl font-bold">${totals.monthly}</p>
        </div>
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p className="text-green-500">Yearly spending</p>
          <p className="text-2xl font-bold">${totals.yearly}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <p>Active Subscriptions</p>
          <p className="text-2xl font-bold">{totals.active}</p>
        </div>
      </div>

      {/* Your Subscriptions Section */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Subscriptions</h2>
          <div className="flex items-center">
            <span className="mr-2 text-gray-600">Sort by</span>
            <select className="border rounded-lg px-2 py-1">
              <option>Name (A→Z)</option>
            </select>
          </div>
        </div>
        <ul>
          <li className="flex items-center justify-between py-3 border-b font-bold">
            <div className="flex-1">Service</div>
            <div className="flex-1 text-center">Price</div>
            <div className="flex-1 text-center">Next Billing</div>
            <div className="flex-1 text-center">Category</div>
            <div className="w-20"></div> {/* Placeholder for buttons */}
          </li>
          {subscriptions.map((sub) => (
            <li
              key={sub.id}
              className="flex items-center justify-between py-3 border-b last:border-b-0">
              <div className="flex items-center flex-1">
                <div>
                  <p className="font-bold">{sub.serviceName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 flex-1 justify-center">
                <span>${Number(sub.price).toFixed(2)}/mo</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 flex-1 justify-center">
                <span>
                  {new Date(sub.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 flex-1 justify-center">
                <span>{sub.category}</span>
              </div>
              <div className="flex items-center space-x-2 w-20">
                <button
                  onClick={() => handleDeleteSubscription(sub.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Banner */}
      <div className="bg-yellow-100 mt-4 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg relative mb-6 flex justify-between items-center">
        <span>
          <span role="img" aria-label="warning">
            👋
          </span>{" "}
          You are currently on the Free Plan - Upgrade to premium to add more
          subscriptions
        </span>
        <a href="https://www.cancelmysub.app/pricing" target="_blank" rel="noopener noreferrer">
          <button className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg">
            Upgrade to Premium
          </button>
        </a>
      </div>

      {/* Footer Section */}
      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-gray-500">
           {totals.active} of 5 available subscription slots
        </p>
        <div className="flex space-x-4">
          <AddSubscriptionDialog onSubscriptionAdded={() => setRefresh(!refresh)} />
          <BillUploadDialog onSubscriptionsAdded={() => setRefresh(!refresh)} disabled={true} />
        </div>
      </div>
    </div>
  )
}

export default NewSubscriptionList 