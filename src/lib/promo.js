export const PROMO_CLOSED_KEY = 'ddos_promo_closed'

export function isPromoClosed() {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(PROMO_CLOSED_KEY) === '1'
  } catch (e) {
    return false
  }
}

export function closePromo() {
  try {
    sessionStorage.setItem(PROMO_CLOSED_KEY, '1')
  } catch (e) {
    /* private browsing */
  }
  window.location.reload()
}
