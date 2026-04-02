import { Link } from 'react-router-dom'
import { XCircle } from 'lucide-react'

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <XCircle size={64} className="text-red-400 mx-auto mb-6" />
        <h1 className="text-3xl font-black mb-2">Pago cancelado</h1>
        <p className="text-[#888899] mb-8">No se realizó ningún cargo. Puedes intentarlo de nuevo.</p>
        <Link to="/checkout" className="px-6 py-3 bg-[#7c6aff] rounded-xl font-bold hover:bg-[#6b5be6]">
          Volver al checkout
        </Link>
      </div>
    </div>
  )
}
