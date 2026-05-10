'use client'

import { useEffect, useState, useCallback } from 'react'
import { Product } from '@/lib/types'
import NavBar from '@/components/NavBar'
import { Plus, Save, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

function VariantsSection({ productId }: { productId: string }) {
  const [variants, setVariants] = useState<Array<{id: string; label: string; color: string|null; size: string|null}>>([])
  const [showAdd, setShowAdd] = useState(false)
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/products/variants?product_id=${productId}`)
      .then(r => r.json())
      .then(d => setVariants(d.variants ?? []))
  }, [productId])

  const label = [color, size].filter(Boolean).join(' - ') || ''

  async function addVariant() {
    if (!label) return
    setSaving(true)
    const res = await fetch('/api/admin/products/variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, color: color || null, size: size || null, label }),
    })
    const { variant } = await res.json()
    if (variant) setVariants(v => [...v, variant])
    setColor(''); setSize(''); setShowAdd(false); setSaving(false)
  }

  async function removeVariant(id: string) {
    await fetch('/api/admin/products/variants', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setVariants(v => v.filter(x => x.id !== id))
  }

  return (
    <div className="mt-4 pt-4 border-t border-[#2D4535]/10">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-medium text-[#2D4535]">Variantes</h5>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-[#B8935A] hover:text-[#2D4535] transition-colors">
          + Agregar
        </button>
      </div>
      {showAdd && (
        <div className="flex gap-2 mb-3 flex-wrap">
          <input value={color} onChange={e => setColor(e.target.value)} placeholder="Color (ej: Marrón)"
            className="px-3 py-1.5 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] w-36" />
          <input value={size} onChange={e => setSize(e.target.value)} placeholder="Talle (ej: M)"
            className="px-3 py-1.5 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] w-24" />
          {label && <span className="text-xs text-[#2D4535]/50 self-center">→ &quot;{label}&quot;</span>}
          <button onClick={addVariant} disabled={!label || saving}
            className="px-3 py-1.5 rounded-lg bg-[#2D4535] text-[#F0E8D8] text-xs hover:bg-[#3d5c47] disabled:opacity-50 transition-colors">
            {saving ? '...' : 'Guardar'}
          </button>
          <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg border border-[#2D4535]/20 text-xs text-[#2D4535]">Cancelar</button>
        </div>
      )}
      {variants.length === 0 && !showAdd && (
        <p className="text-xs text-[#2D4535]/40 italic">Sin variantes — aplica a todos los colores/talles</p>
      )}
      <div className="flex flex-wrap gap-2">
        {variants.map(v => (
          <span key={v.id} className="flex items-center gap-1 bg-[#F0E8D8] text-[#2D4535] text-xs px-2.5 py-1 rounded-full">
            {v.label}
            <button onClick={() => removeVariant(v.id)} className="text-[#2D4535]/40 hover:text-red-500 ml-1">×</button>
          </span>
        ))}
      </div>
    </div>
  )
}

const EMPTY_PRODUCT: Omit<Product, 'id' | 'created_at'> = {
  code: '',
  name: '',
  description: '',
  image_url: '',
  weight_kg: null,
  unit: 'unidad',
  active: true,
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [adminClient, setAdminClient] = useState<any>(null)
  const [editing, setEditing] = useState<Partial<Product> | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const router = useRouter()

  const fetchData = useCallback(async () => {
    // Verify admin via orders endpoint
    const adminCheck = await fetch('/api/admin/orders')
    if (adminCheck.status === 403 || adminCheck.status === 401) {
      router.push('/catalog')
      return
    }
    const { admin } = await adminCheck.json()
    setAdminClient(admin)

    const res = await fetch('/api/admin/products')
    if (!res.ok) return
    const { products: data } = await res.json()
    setProducts(data ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveProduct() {
    if (!editing) return
    setSaving(true)

    const payload = {
      code: editing.code ?? '',
      name: editing.name ?? '',
      description: editing.description || null,
      image_url: editing.image_url || null,
      weight_kg: editing.weight_kg || null,
      unit: editing.unit || 'unidad',
      active: editing.active ?? true,
    }

    if (editing.id) {
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...payload }),
      })
      setProducts(prev => prev.map(p => p.id === editing.id ? { ...p, ...payload } : p))
    } else {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const { product } = await res.json()
      if (product) setProducts(prev => [...prev, product])
    }

    setSaving(false)
    setEditing(null)
  }

  async function toggleActive(product: Product) {
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, active: !product.active }),
    })
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: !p.active } : p))
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-[#2D4535]/50 text-sm">Cargando...</div></div>
  }

  const activeCount = products.filter(p => p.active).length

  return (
    <div className="min-h-screen">
      <NavBar client={adminClient} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#2D4535]">Productos</h1>
            <p className="text-sm text-[#2D4535]/60 mt-1">
              {activeCount} activos · {products.length - activeCount} ocultos
            </p>
          </div>
          <button
            onClick={() => setEditing({ ...EMPTY_PRODUCT })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D4535] text-[#F0E8D8] text-sm hover:bg-[#3d5c47] transition-colors"
          >
            <Plus size={16} />
            Nuevo producto
          </button>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="bg-white rounded-2xl border border-[#B8935A]/30 p-5 mb-5 space-y-3">
            <h3 className="font-medium text-[#2D4535]">{editing.id ? 'Editar producto' : 'Nuevo producto'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#2D4535]/60 block mb-1">Código *</label>
                <input
                  value={editing.code ?? ''}
                  onChange={e => setEditing(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="MAT-001"
                  className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                />
              </div>
              <div>
                <label className="text-xs text-[#2D4535]/60 block mb-1">Unidad</label>
                <input
                  value={editing.unit ?? 'unidad'}
                  onChange={e => setEditing(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="unidad, caja, pack..."
                  className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#2D4535]/60 block mb-1">Nombre *</label>
              <input
                value={editing.name ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Mate Tradicional Calabaza"
                className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
              />
            </div>
            <div>
              <label className="text-xs text-[#2D4535]/60 block mb-1">Descripción</label>
              <textarea
                rows={2}
                value={editing.description ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del producto..."
                className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#2D4535]/60 block mb-1">URL de imagen</label>
                <input
                  value={editing.image_url ?? ''}
                  onChange={e => setEditing(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                />
              </div>
              <div>
                <label className="text-xs text-[#2D4535]/60 block mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  value={editing.weight_kg ?? ''}
                  onChange={e => setEditing(prev => ({ ...prev, weight_kg: parseFloat(e.target.value) || null }))}
                  placeholder="0.150"
                  className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={saveProduct}
                disabled={saving || !editing.code || !editing.name}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D4535] text-[#F0E8D8] text-sm hover:bg-[#3d5c47] disabled:opacity-50 transition-colors"
              >
                <Save size={14} />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl border border-[#2D4535]/20 text-[#2D4535] text-sm hover:bg-[#2D4535]/5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Products table */}
        <div className="bg-white rounded-2xl border border-[#2D4535]/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2D4535]/10">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#2D4535]/50">Código</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#2D4535]/50">Producto</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#2D4535]/50 hidden sm:table-cell">Unidad</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#2D4535]/50 hidden sm:table-cell">Peso</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-[#2D4535]/50">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D4535]/5">
              {products.map(product => (
                <>
                  <tr key={product.id} className={`hover:bg-[#2D4535]/3 transition-colors ${!product.active ? 'opacity-40' : ''}`}>
                    <td className="px-5 py-3 font-mono text-xs text-[#2D4535]/60">{product.code}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {!product.active && (
                          <span className="text-xs bg-[#2D4535]/10 text-[#2D4535]/50 px-1.5 py-0.5 rounded-full">oculto</span>
                        )}
                        <span className="font-medium text-[#2D4535]">{product.name}</span>
                      </div>
                      {product.description && (
                        <p className="text-xs text-[#2D4535]/40 truncate max-w-xs">{product.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#2D4535]/60 hidden sm:table-cell">{product.unit}</td>
                    <td className="px-5 py-3 text-[#2D4535]/60 hidden sm:table-cell">{product.weight_kg ? `${product.weight_kg} kg` : '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleActive(product)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            product.active
                              ? 'text-[#2D4535]/40 hover:text-[#2D4535] hover:bg-[#2D4535]/5'
                              : 'text-[#B8935A] bg-[#B8935A]/10 hover:bg-[#B8935A]/20'
                          }`}
                          title={product.active ? 'Ocultar del catálogo' : 'Mostrar en catálogo'}
                        >
                          {product.active ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button
                          onClick={() => setEditing(product)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#2D4535]/20 text-[#2D4535] hover:bg-[#2D4535]/5 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setExpandedProductId(expandedProductId === product.id ? null : product.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#2D4535]/20 text-[#2D4535] hover:bg-[#2D4535]/5 transition-colors"
                        >
                          Variantes
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedProductId === product.id && (
                    <tr key={`${product.id}-variants`}>
                      <td colSpan={5} className="px-5 pb-4">
                        <VariantsSection productId={product.id} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
