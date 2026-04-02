import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader } from 'lucide-react'
import { apiClient } from '../../api/client'

export default function PaymentSuccess() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState<'loading'|'success'|'error'>('loading')

  useEffect(() => {
    // Stripe pasa session_id, PayPal pasa token
    const sessionId = params.get('session_id') || params.get('token')
    if (sessionId) {
      setTimeout(() => setStatus('success'), 1500)
    } else {
      setStatus('success')
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        {status === 'loading' && <Loader size={64} className="text-[#7c6aff] mx-auto mb-6 animate-spin" />}
        {status === 'success' && <>
          <CheckCircle size={64} className="text-green-400 mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-2">¡Pago exitoso!</h1>
          <p className="text-[#888899] mb-8">Tu orden ha sido confirmada. Recibirás un email con los detalles.</p>
          <Link to="/shop" className="px-6 py-3 bg-[#7c6aff] rounded-xl font-bold hover:bg-[#6b5be6]">
            Seguir comprando
          </Link>
        </>}
      </div>
    </div>
  )
}
