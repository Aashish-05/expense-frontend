import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'https://expense-tracker-api-q7fq.onrender.com/api'
const CATEGORIES = ['All', 'Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Education', 'Other']
const CAT_ICONS = { Food:'🍜', Travel:'✈️', Bills:'💡', Shopping:'🛍️', Health:'💊', Entertainment:'🎮', Education:'📚', Other:'📦' }

export default function Dashboard() {
  const [expenses, setExpenses] = useState([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], description: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => { fetchExpenses() }, [filter])

  const fetchExpenses = async () => {
    try {
      const url = filter === 'All' ? `${API}/expenses` : `${API}/expenses?category=${filter}`
      const res = await axios.get(url, { headers })
      setExpenses(res.data.expenses)
      setTotal(res.data.totalAmount)
    } catch (err) {
      if (err.response?.status === 401) logout()
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.title || !form.amount) return setError('Title aur amount required hai.')
    setLoading(true)
    try {
      await axios.post(`${API}/expense`, form, { headers })
      setSuccess('✅ Expense add ho gaya!')
      setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], description: '' })
      fetchExpenses()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Error aaya.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete karna hai?')) return
    try {
      await axios.delete(`${API}/expense/${id}`, { headers })
      fetchExpenses()
    } catch (err) { alert('Delete failed.') }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <span style={styles.logo}>💰 ExpenseTracker</span>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <span style={{ fontSize:'0.9rem' }}>👤 {user.name}</span>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </nav>

      <div style={styles.container}>
        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={{ color:'#888', fontSize:'0.8rem' }}>TOTAL EXPENSES</div>
            <div style={{ fontSize:'2rem', fontWeight:'bold', color:'#6c63ff' }}>₹{parseFloat(total).toLocaleString('en-IN')}</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ color:'#888', fontSize:'0.8rem' }}>TOTAL ENTRIES</div>
            <div style={{ fontSize:'2rem', fontWeight:'bold', color:'#e85d5d' }}>{expenses.length}</div>
          </div>
        </div>

        <div style={styles.mainGrid}>
          {/* Add Expense Form */}
          <div style={styles.formCard}>
            <h3 style={{ marginBottom:'1rem' }}>➕ Naya Expense</h3>
            {error && <p style={styles.error}>{error}</p>}
            {success && <p style={styles.success}>{success}</p>}
            <form onSubmit={handleAdd}>
              <input style={styles.input} placeholder="Title (e.g. Chai, Bus)"
                value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <input style={styles.input} placeholder="Amount (₹)" type="number" min="0.01" step="0.01"
                value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              <select style={styles.input} value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}>
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>
                ))}
              </select>
              <input style={styles.input} type="date"
                value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              <input style={styles.input} placeholder="Note (optional)"
                value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <button style={styles.btn} type="submit" disabled={loading}>
                {loading ? 'Adding...' : '+ Add Expense'}
              </button>
            </form>
          </div>

          {/* Expense List */}
          <div>
            {/* Category Filters */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'1rem' }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)}
                  style={{ ...styles.filterBtn, ...(filter === cat ? styles.filterActive : {}) }}>
                  {CAT_ICONS[cat] || '📋'} {cat}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={styles.listCard}>
              <h3 style={{ padding:'1rem', borderBottom:'1px solid #eee', margin:0 }}>
                {filter === 'All' ? 'Sabhi Expenses' : `${filter} Expenses`} ({expenses.length})
              </h3>
              {expenses.length === 0 ? (
                <div style={{ textAlign:'center', padding:'3rem', color:'#aaa' }}>
                  <div style={{ fontSize:'3rem' }}>💸</div>
                  <p>Koi expense nahi mila</p>
                </div>
              ) : (
                expenses.map(exp => (
                  <div key={exp._id} style={styles.expenseItem}>
                    <div style={styles.expIcon}>{CAT_ICONS[exp.category] || '📦'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:'600' }}>{exp.title}</div>
                      <div style={{ fontSize:'0.8rem', color:'#888' }}>
                        {exp.category} • {new Date(exp.date).toLocaleDateString('en-IN')}
                        {exp.description && ` • ${exp.description}`}
                      </div>
                    </div>
                    <div style={{ fontWeight:'bold', color:'#e85d5d', marginRight:'1rem' }}>
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </div>
                    <button onClick={() => handleDelete(exp._id)} style={styles.deleteBtn}>✕</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight:'100vh', background:'#f0f2f5', fontFamily:'sans-serif' },
  nav: { background:'white', padding:'0 2rem', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', position:'sticky', top:0, zIndex:10 },
  logo: { fontSize:'1.2rem', fontWeight:'bold', color:'#6c63ff' },
  logoutBtn: { background:'transparent', border:'1px solid #ddd', padding:'0.4rem 0.9rem', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem' },
  container: { maxWidth:'1100px', margin:'0 auto', padding:'2rem 1.5rem' },
  statsRow: { display:'flex', gap:'1rem', marginBottom:'2rem', flexWrap:'wrap' },
  statCard: { background:'white', padding:'1.5rem', borderRadius:'12px', flex:1, minWidth:'180px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  mainGrid: { display:'grid', gridTemplateColumns:'320px 1fr', gap:'1.5rem' },
  formCard: { background:'white', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', alignSelf:'start', position:'sticky', top:'76px' },
  input: { width:'100%', padding:'0.7rem', marginBottom:'0.85rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'0.9rem', boxSizing:'border-box', outline:'none' },
  btn: { width:'100%', padding:'0.85rem', background:'#6c63ff', color:'white', border:'none', borderRadius:'8px', fontSize:'1rem', cursor:'pointer' },
  error: { color:'red', fontSize:'0.82rem', marginBottom:'0.75rem' },
  success: { color:'green', fontSize:'0.82rem', marginBottom:'0.75rem' },
  filterBtn: { background:'white', border:'1px solid #ddd', padding:'0.35rem 0.85rem', borderRadius:'20px', cursor:'pointer', fontSize:'0.78rem' },
  filterActive: { background:'#6c63ff', color:'white', borderColor:'#6c63ff' },
  listCard: { background:'white', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', overflow:'hidden' },
  expenseItem: { display:'flex', alignItems:'center', padding:'0.9rem 1rem', borderBottom:'1px solid #f0f0f0', gap:'0.75rem' },
  expIcon: { width:'40px', height:'40px', background:'#f5f5ff', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem' },
  deleteBtn: { background:'transparent', border:'1px solid #ffcdd2', color:'#e85d5d', padding:'0.3rem 0.6rem', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem' }
}