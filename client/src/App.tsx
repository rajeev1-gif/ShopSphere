import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { api, type Product } from './api';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<Product[]>([]);
  const [user, setUser] = useState(localStorage.getItem('shopsphere_name') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Product[]>('/products')
      .then(({ data }) => setProducts(data))
      .catch(() => setError('Could not connect to the API. Start the .NET backend and PostgreSQL, then refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category))], [products]);
  const filtered = products.filter(p =>
    (category === 'All' || p.category === category) &&
    `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product: Product) {
    setCart(current => [...current, product]);
  }

  function logout() {
    localStorage.removeItem('shopsphere_token');
    localStorage.removeItem('shopsphere_name');
    setUser('');
  }

  return (
    <div className="app-shell">
      <div className="announcement">Thoughtful essentials for everyday living <span>— Free shipping over $100</span></div>
      <header className="site-header">
        <Link to="/" className="brand"><span className="brand-mark">s.</span> shopsphere</Link>
        <nav className="main-nav">
          <a href="#shop">Shop all</a><a href="#shop">New arrivals</a><a href="#about">Our story</a>
        </nav>
        <div className="header-actions">
          <label className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products"/></label>
          {user ? <button className="text-button" onClick={logout}><UserRound size={17}/> {user.split(' ')[0]} · Logout</button> :
            <Link className="text-button" to="/login"><UserRound size={17}/> Sign in</Link>}
          <button className="cart-button" aria-label="Shopping cart"><ShoppingBag size={19}/><span>{cart.length}</span></button>
        </div>
      </header>

      <Routes>
        <Route path="/login" element={<AuthPage mode="login" onAuthenticated={name => setUser(name)} />} />
        <Route path="/register" element={<AuthPage mode="register" onAuthenticated={name => setUser(name)} />} />
        <Route path="*" element={
          <>
            <main>
              <section className="hero">
                <div className="hero-copy">
                  <p className="eyebrow">THE EVERYDAY EDIT · 2026</p>
                  <h1>Good things.<br/><em>Made simple.</em></h1>
                  <p className="hero-description">Considered essentials for your home, your work, and everywhere life takes you.</p>
                  <a href="#shop" className="primary-button">Explore the collection <ArrowRight size={17}/></a>
                  <div className="hero-note"><span className="tiny-dot"/> Curated for everyday living</div>
                </div>
                <div className="hero-image">
                  <img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=1200" alt="Warm minimalist living space"/>
                  <div className="image-caption"><span>THE HOME COLLECTION</span><strong>Find your everyday favourite.</strong></div>
                </div>
                <div className="hero-vertical">LESS, BUT BETTER — EST. 2026</div>
              </section>

              <section className="trust-strip">
                <div><strong>Thoughtfully selected</strong><span>Products with purpose</span></div>
                <div><strong>Easy, secure checkout</strong><span>A smoother shopping experience</span></div>
                <div><strong>Here when you need us</strong><span>Customer-first support</span></div>
              </section>

              <section id="shop" className="products-section">
                <div className="section-heading"><div><p className="eyebrow">A FEW GOOD THINGS</p><h2>Shop the collection</h2></div><span>{filtered.length} products <ChevronDown size={15}/></span></div>
                <div className="category-row">{categories.map(c => <button key={c} className={category === c ? 'category active' : 'category'} onClick={() => setCategory(c)}>{c}</button>)}</div>
                {loading && <p className="notice">Loading collection…</p>}
                {error && <p className="notice error">{error}</p>}
                {!loading && !error && filtered.length === 0 && <p className="notice">No products match your search.</p>}
                <div className="product-grid">
                  {filtered.map((product, i) => <article className="product-card" key={product.id}>
                    <div className="product-image"><img src={product.imageUrl} alt={product.name} loading="lazy"/><span className="product-number">0{i + 1}</span><button onClick={() => addToCart(product)} className="quick-add">Add to bag <ArrowRight size={15}/></button></div>
                    <div className="product-meta"><span>{product.category}</span><span>{product.stock > 0 ? 'In stock' : 'Sold out'}</span></div>
                    <div className="product-title-row"><h3>{product.name}</h3><strong>${product.price.toFixed(2)}</strong></div>
                    <p className="product-description">{product.description}</p>
                  </article>)}
                </div>
              </section>

              <section id="about" className="about-band"><p className="eyebrow">A MORE CONSIDERED WAY TO SHOP</p><h2>Useful things. Beautifully chosen.</h2><p>Small details make everyday life better. We look for pieces that earn their place.</p><a href="#shop">Discover the collection <ArrowRight size={16}/></a></section>
            </main>
            <footer><Link to="/" className="brand"><span className="brand-mark">s.</span> shopsphere</Link><span>Prototype storefront · Demo data only</span><span>© 2026 ShopSphere</span></footer>
          </>
        } />
      </Routes>
      {cart.length > 0 && <div className="cart-toast"><Check size={16}/> {cart[cart.length - 1].name} added · {cart.length} item(s) in bag <button onClick={() => setCart([])} aria-label="Clear cart"><X size={15}/></button></div>}
    </div>
  );
}

function AuthPage({ mode, onAuthenticated }: { mode: 'login' | 'register'; onAuthenticated: (name: string) => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage('');
    try {
      if (isRegister) {
        await api.post('/auth/register', { displayName: name, email, password });
        setMessage('Account created. You can now sign in.');
        navigate('/login');
      } else {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('shopsphere_token', data.accessToken);
        localStorage.setItem('shopsphere_name', data.displayName);
        onAuthenticated(data.displayName);
        navigate('/');
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        setMessage(response?.data?.message || 'Unable to complete the request. Check your details and try again.');
      } else setMessage('Cannot reach the API. Please try again shortly.');
    } finally { setBusy(false); }
  }

  return <main className="auth-layout">
    <div className="auth-art"><img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=1200" alt="Calm, warm living space"/><div><p className="eyebrow">THE EVERYDAY EDIT</p><h2>Make room for<br/><em>good things.</em></h2></div></div>
    <form className="auth-form" onSubmit={submit}>
      <p className="eyebrow">{isRegister ? 'JOIN OUR COMMUNITY' : 'WELCOME BACK'}</p>
      <h1>{isRegister ? 'Create an account' : 'Sign in'}</h1>
      <p className="auth-subtitle">{isRegister ? 'Create an account to make your next visit feel like yours.' : 'Sign in to continue to your ShopSphere experience.'}</p>
      {isRegister && <label>Full name<input required minLength={2} value={name} onChange={e => setName(e.target.value)} placeholder="Your name"/></label>}
      <label>Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label>Password<input required type="password" minLength={8} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'}/></label>
      {message && <p className="form-message" role="status">{message}</p>}
      <button className="primary-button full" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={17}/></button>
      <p className="switch-auth">{isRegister ? 'Already have an account?' : "Don't have an account?"} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create one'}</Link></p>
      <p className="secure-note"><Check size={15}/> Your information is protected with secure authentication.</p>
    </form>
  </main>;
}

export default App;
