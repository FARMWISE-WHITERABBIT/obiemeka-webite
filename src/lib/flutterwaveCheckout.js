let loading

function loadCheckout() {
  if (typeof window.FlutterwaveCheckout === 'function') return Promise.resolve()
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.flutterwave.com/v3.js'
      script.async = true
      script.onload = () => {
        if (typeof window.FlutterwaveCheckout === 'function') resolve()
        else reject(new Error('Flutterwave could not open.'))
      }
      script.onerror = () => reject(new Error('Flutterwave could not load.'))
      document.head.appendChild(script)
    }).catch(error => {
      loading = undefined
      throw error
    })
  }
  return loading
}

export async function openFlutterwaveCheckout({ checkoutUrl, inlineCheckout }) {
  if (!inlineCheckout) {
    window.location.assign(checkoutUrl)
    return null
  }
  try {
    await loadCheckout()
  } catch {
    window.location.assign(checkoutUrl)
    return null
  }

  return new Promise((resolve, reject) => {
    let modal
    try {
      modal = window.FlutterwaveCheckout({
        ...inlineCheckout,
        callback(payment) {
          resolve(payment?.transaction_id ? payment : null)
          modal?.close()
        },
        onclose() { resolve(null) },
      })
    } catch (error) {
      reject(error)
    }
  })
}
