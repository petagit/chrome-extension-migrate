const API_URL =
  process.env.PLASMO_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000"

class CancelMySubsAPI {
  async getSubscriptions(userId: string) {
    if (!userId) {
      throw new Error("User not authenticated")
    }
    const response = await fetch(`${API_URL}/api/subscriptions?userId=${userId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch subscriptions")
    }
    return response.json()
  }

  async addSubscription(data: {
    userId: string
    serviceName: string
    price: number
    startDate: string
    endDate: string
  }) {
    const response = await fetch(`${API_URL}/api/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      throw new Error("Failed to add subscription")
    }
    return response.json()
  }

  async removeSubscription(id: string, userId: string) {
    const response = await fetch(`${API_URL}/api/subscriptions/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    })
    if (!response.ok) {
      throw new Error("Failed to remove subscription")
    }
    return response.json()
  }

  async updateSubscription(
    id: string,
    data: {
      serviceName?: string
      price?: number
      startDate?: string
      endDate?: string
      category?: string
      cancellationUrl?: string
    }
  ) {
    const response = await fetch(`${API_URL}/api/subscriptions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      throw new Error("Failed to update subscription")
    }
    return response.json()
  }

  async detectSubscriptions(formData: FormData) {
    const response = await fetch(`${API_URL}/api/detect-subscriptions`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to detect subscriptions from API');
    }
    return response.json();
  }
}

const api = new CancelMySubsAPI()

export default api 