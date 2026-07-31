import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Smartphone, 
  QrCode, 
  Percent, 
  User, 
  CreditCard, 
  Coins, 
  Sparkles, 
  Printer,
  CheckCircle2,
  AlertCircle,
  Tag,
  Gift,
  Zap,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

const generateBillNumber = () => {
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `APEX-TEMP-${dateStr}-${rand}`;
};

const Billing = () => {
  const { user } = useAuth();
  const { 
    joinSession, 
    scannedProduct, 
    unregisteredBarcode, 
    scannerConnected 
  } = useSocket();

  // Session Room Code for Mobile Link
  const [sessionCode, setSessionCode] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  // Cart State
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Customer/CRM State
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [customerError, setCustomerError] = useState('');

  // Discount & Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [manualDiscountRate, setManualDiscountRate] = useState(0);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [splitDetails, setSplitDetails] = useState({ cashAmount: 0, cardAmount: 0, upiAmount: 0 });
  const [loyaltyRedeemPoints, setLoyaltyRedeemPoints] = useState(0);

  // AI Recommendation State
  const [recommendations, setRecommendations] = useState([]);
  const [upsells, setUpsells] = useState([]);

  // Print References
  const printComponentRef = useRef(null);

  // Generate Room Code on Load and Join Socket Room
  useEffect(() => {
    let code = sessionStorage.getItem('billing_session_code');
    if (!code) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem('billing_session_code', code);
    }
    setSessionCode(code);
    joinSession(code);
  }, []);

  // Listen to Socket Barcode Scans
  useEffect(() => {
    if (scannedProduct) {
      handleProductSelect(scannedProduct);
    }
  }, [scannedProduct]);

  useEffect(() => {
    if (unregisteredBarcode) {
      alert(`Barcode ${unregisteredBarcode} not found in database catalog!`);
    }
  }, [unregisteredBarcode]);

  // Fetch AI Recommendations based on cart items
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (cart.length === 0) {
        setRecommendations([]);
        setUpsells([]);
        return;
      }
      try {
        const productIds = cart.map(item => item._id);
        const { data } = await axios.post('/api/products', { ids: productIds }); // Mocking recommendation trigger
        // Let's call our AI recommendation engine endpoints
        const recResponse = await axios.get(`/api/customers/search?q=1`); // general trigger
        // We will mock standard suggestions based on first cart item for UI elegance
        const firstCartItem = cart[0];
        
        // Frequently bought together mock
        if (firstCartItem.name.includes('Milk')) {
          setRecommendations([{ _id: 'rec1', name: 'Flour (Wheat) 10kg', sellingPrice: 8.50, category: 'Groceries' }]);
        } else if (firstCartItem.name.includes('Coffee')) {
          setRecommendations([{ _id: 'rec2', name: 'Choco Delight Bar', sellingPrice: 1.50, category: 'Snacks' }]);
        } else {
          setRecommendations([{ _id: 'rec3', name: 'Fresh Milk 1L', sellingPrice: 2.20, category: 'Dairy' }]);
        }
      } catch (err) {
        console.error('Recommendation fetch failed:', err);
      }
    };
    fetchRecommendations();
  }, [cart]);

  // Search Products from Catalog
  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (!val) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await axios.get(`/api/products?search=${val}`);
      if (data.success) {
        setSearchResults(data.products);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductSelect = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item._id === product._id);
      if (existing) {
        return prevCart.map(item => 
          item._id === product._id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) => 
      prevCart.map(item => {
        if (item._id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  // Search CRM Customer Details
  const handleCustomerSearch = async () => {
    if (!customerPhone) return;
    setCustomerError('');
    try {
      const { data } = await axios.get(`/api/customers/search?q=${customerPhone}`);
      if (data.success && data.customers.length > 0) {
        // Fetch detailed profile for first matched customer
        const detailRes = await axios.get(`/api/customers/${data.customers[0]._id}`);
        setCustomer(detailRes.data.customer);
      } else {
        setCustomerError('Customer not registered.');
        setCustomer(null);
      }
    } catch (err) {
      setCustomerError('Could not find customer profile');
    }
  };

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError('');
    try {
      // Find coupons in seeded db
      const { data } = await axios.get('/api/billing/history'); // triggering billing router
      // Since it's a demo, we will calculate coupon validations locally based on code
      if (couponCode.toUpperCase() === 'WELCOME10') {
        setAppliedCoupon({ code: 'WELCOME10', discountType: 'Percentage', discountValue: 10, minPurchase: 20 });
      } else if (couponCode.toUpperCase() === 'FLAT5') {
        setAppliedCoupon({ code: 'FLAT5', discountType: 'Flat', discountValue: 5, minPurchase: 35 });
      } else {
        setCouponError('Invalid or expired coupon code.');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError('Error verifying coupon.');
    }
  };

  // Calculations
  const calculateCartTotals = () => {
    let subtotal = 0;
    let discountAmount = 0;
    let gstAmount = 0;

    cart.forEach(item => {
      const base = item.sellingPrice * item.quantity;
      const disc = (base * item.discount) / 100;
      const gst = ((base - disc) * item.gst) / 100;

      subtotal += base;
      discountAmount += disc;
      gstAmount += gst;
    });

    let totalBeforeCoupon = subtotal - discountAmount + gstAmount;

    // Apply Coupon
    let couponDiscount = 0;
    if (appliedCoupon && totalBeforeCoupon >= appliedCoupon.minPurchase) {
      if (appliedCoupon.discountType === 'Percentage') {
        couponDiscount = (totalBeforeCoupon * appliedCoupon.discountValue) / 100;
      } else {
        couponDiscount = appliedCoupon.discountValue;
      }
    }

    // Apply Manual Discount
    let manualDiscount = (totalBeforeCoupon * manualDiscountRate) / 100;

    // Apply Loyalty Redeemed Points Value
    let loyaltyDiscount = loyaltyRedeemPoints * 0.10; // $0.10 value per point

    let grandTotal = totalBeforeCoupon - couponDiscount - manualDiscount - loyaltyDiscount;
    grandTotal = Math.max(0, grandTotal);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number((discountAmount + manualDiscount).toFixed(2)),
      gstAmount: Number(gstAmount.toFixed(2)),
      couponDiscount: Number(couponDiscount.toFixed(2)),
      loyaltyDiscount: Number(loyaltyDiscount.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2))
    };
  };

  const totals = calculateCartTotals();

  // Print Handle
  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
  });

  // Submit / Checkout transaction
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Split validations
    if (paymentMethod === 'Split') {
      const totalSplit = Number(splitDetails.cashAmount) + Number(splitDetails.cardAmount) + Number(splitDetails.upiAmount);
      if (Math.abs(totalSplit - totals.grandTotal) > 0.05) {
        alert(`Split total (${totalSplit}) does not match grand total (${totals.grandTotal})`);
        return;
      }
    }

    const payload = {
      customerId: customer?._id,
      customerPhone: customer?.phone || customerPhone || undefined,
      items: cart.map(item => ({
        productId: item._id,
        quantity: item.quantity,
        price: item.sellingPrice,
        gstRate: item.gst,
        discountRate: item.discount
      })),
      paymentMethod,
      splitDetails: paymentMethod === 'Split' ? splitDetails : undefined,
      couponCode: appliedCoupon?.code,
      loyaltyPointsRedeemed: loyaltyRedeemPoints
    };

    try {
      const { data } = await axios.post('/api/billing/checkout', payload);
      if (data.success) {
        alert(`Invoice ${data.bill.billNumber} created successfully!`);
        // Reset states
        setCart([]);
        setCustomer(null);
        setCustomerPhone('');
        setCouponCode('');
        setAppliedCoupon(null);
        setLoyaltyRedeemPoints(0);
        setPaymentMethod('Cash');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Checkout failed.');
    }
  };

  const scannerLinkUrl = `${window.location.origin}/scanner?room=${sessionCode}`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 select-none min-h-[calc(100vh-140px)]">
      {/* Left Panel POS Details */}
      <div className="xl:col-span-3 flex flex-col justify-between glass-card p-5 rounded-[20px] border border-brand-border overflow-hidden h-full">
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          {/* Top Bar: Product Search & Device Pairing */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
            <div className="relative flex-1 max-w-xl">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search supermarket catalog by name or scan barcode..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-white focus:border-brand-primary outline-none transition-all text-xs font-semibold text-brand-dark shadow-sm"
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-brand-border rounded-2xl shadow-xl z-50 divide-y divide-brand-border max-h-64 overflow-y-auto custom-scrollbar">
                  {searchResults.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => handleProductSelect(p)}
                      className="px-4 py-3 hover:bg-brand-primary/5 text-xs font-semibold flex justify-between items-center cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-brand-dark font-bold">{p.name}</p>
                        <p className="text-[10px] text-brand-muted font-mono mt-0.5">BC: {p.barcode} | Category: {p.category}</p>
                      </div>
                      <span className="text-brand-primary font-bold text-sm bg-brand-primary/10 px-2.5 py-1 rounded-lg">₹{p.sellingPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Scan link */}
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border ${
                scannerConnected 
                  ? 'bg-brand-success/15 text-brand-success border-brand-success/30' 
                  : 'bg-brand-warning/15 text-brand-dark border-brand-warning/30'
              }`}>
                <Smartphone size={14} />
                {scannerConnected ? 'Mobile Scanner Linked' : 'Barcode Scanner Ready'}
              </span>
              <button 
                onClick={() => setShowQrModal(true)}
                className="bg-white border border-brand-border hover:border-brand-primary p-2 rounded-xl text-brand-dark transition-all shadow-sm flex items-center gap-1 text-xs font-bold"
                title="Pair Mobile Camera Scanner"
              >
                <QrCode size={18} className="text-brand-primary" />
                <span className="hidden sm:inline">QR Pair</span>
              </button>
            </div>
          </div>

          {/* Cart Table Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-[11px] font-bold text-brand-muted uppercase tracking-wider bg-brand-bg/40 sticky top-0 backdrop-blur-sm">
                  <th className="py-2.5 px-3 w-2/5 rounded-l-xl">Product Items</th>
                  <th className="py-2.5 text-center w-1/5">Quantity</th>
                  <th className="py-2.5 text-right w-1/5">Unit Price</th>
                  <th className="py-2.5 text-right w-1/5">Subtotal</th>
                  <th className="py-2.5 text-center w-12 rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs font-medium">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-4 bg-brand-primary/10 rounded-full text-brand-primary">
                          <ShoppingBag size={32} />
                        </div>
                        <p className="text-sm font-bold text-brand-dark">Current Bill Cart is Empty</p>
                        <p className="text-xs text-brand-muted max-w-sm">
                          Use the barcode scanner or search items above to add products to this checkout bill.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item._id} className="hover:bg-brand-primary/5 transition-colors">
                      <td className="py-3 px-3">
                        <p className="text-brand-dark font-bold leading-snug">{item.name}</p>
                        <span className="text-[10px] text-brand-muted font-mono bg-brand-bg px-2 py-0.5 rounded border border-brand-border inline-block mt-0.5">
                          BC: {item.barcode}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => updateQuantity(item._id, -1)}
                            className="h-7 w-7 bg-white border border-brand-border hover:border-brand-primary rounded-lg flex items-center justify-center text-brand-dark active:scale-95 transition shadow-sm font-bold"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-brand-dark">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item._id, 1)}
                            className="h-7 w-7 bg-white border border-brand-border hover:border-brand-primary rounded-lg flex items-center justify-center text-brand-dark active:scale-95 transition shadow-sm font-bold"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 text-right text-brand-muted font-semibold">₹{item.sellingPrice.toFixed(2)}</td>
                      <td className="py-3 text-right text-brand-dark font-bold text-sm">
                        ₹{(item.sellingPrice * item.quantity).toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <button 
                          onClick={() => removeItem(item._id)}
                          className="text-brand-muted hover:text-brand-danger p-1.5 rounded-lg hover:bg-brand-danger/10 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Workstation Options Bar */}
        <div className="border-t border-brand-border pt-4 mt-4 space-y-3 no-print">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Customer CRM section */}
            <div className="bg-brand-bg/70 border border-brand-border p-3.5 rounded-2xl space-y-2">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1">
                <User size={12} className="text-brand-primary" /> Customer Details CRM
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter Phone Number..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-brand-border bg-white text-xs font-semibold outline-none focus:border-brand-primary"
                />
                <button 
                  onClick={handleCustomerSearch}
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Lookup
                </button>
              </div>
              {customer && (
                <div className="text-[10px] font-semibold text-brand-dark leading-tight mt-2 flex justify-between items-center bg-white p-2.5 rounded-xl border border-brand-border shadow-sm">
                  <div>
                    <p className="text-brand-dark font-extrabold">{customer.name}</p>
                    <span className="text-brand-primary font-bold text-[9px] uppercase tracking-wider">{customer.tier} Tier</span>
                  </div>
                  <div className="text-right">
                    <p className="text-brand-dark font-bold">Points: {customer.loyaltyPoints}</p>
                    <button 
                      onClick={() => setLoyaltyRedeemPoints(Math.min(customer.loyaltyPoints, 50))}
                      className="text-[9px] text-brand-success hover:underline font-bold uppercase mt-0.5 block"
                    >
                      Redeem 50 pts
                    </button>
                  </div>
                </div>
              )}
              {customerError && <p className="text-[10px] text-brand-danger font-medium">{customerError}</p>}
            </div>

            {/* Coupons section */}
            <div className="bg-brand-bg/70 border border-brand-border p-3.5 rounded-2xl space-y-2">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1">
                <Tag size={12} className="text-brand-gold" /> Promo & Coupon Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon Code (e.g. WELCOME10)..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-brand-border bg-white text-xs font-semibold outline-none focus:border-brand-primary uppercase"
                />
                <button 
                  onClick={handleApplyCoupon}
                  className="bg-brand-secondary hover:bg-brand-secondary/90 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="text-[10px] font-bold text-brand-success leading-tight mt-2 flex justify-between items-center bg-brand-success/10 p-2.5 rounded-xl border border-brand-success/20">
                  <span>Applied: {appliedCoupon.code} ({appliedCoupon.discountValue}% OFF)</span>
                  <button onClick={() => setAppliedCoupon(null)} className="text-brand-danger hover:underline uppercase text-[9px] ml-2">Remove</button>
                </div>
              )}
              {couponError && <p className="text-[10px] text-brand-danger font-medium">{couponError}</p>}
            </div>

            {/* Payment Method Controls */}
            <div className="bg-brand-bg/70 border border-brand-border p-3.5 rounded-2xl space-y-2">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1">
                <CreditCard size={12} className="text-brand-primary" /> Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-brand-border bg-white text-xs font-bold text-brand-dark outline-none focus:border-brand-primary"
              >
                <option value="Cash">💵 Cash Payment</option>
                <option value="Card">💳 Credit / Debit Card</option>
                <option value="UPI">📱 UPI / QR Digital</option>
                <option value="Split">🔀 Split Payment</option>
              </select>

              {paymentMethod === 'Split' && (
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  <input
                    type="number"
                    value={splitDetails.cashAmount}
                    onChange={(e) => setSplitDetails({ ...splitDetails, cashAmount: e.target.value })}
                    placeholder="Cash ₹"
                    className="px-2 py-1 bg-white border border-brand-border rounded-lg text-[10px] font-bold"
                  />
                  <input
                    type="number"
                    value={splitDetails.cardAmount}
                    onChange={(e) => setSplitDetails({ ...splitDetails, cardAmount: e.target.value })}
                    placeholder="Card ₹"
                    className="px-2 py-1 bg-white border border-brand-border rounded-lg text-[10px] font-bold"
                  />
                  <input
                    type="number"
                    value={splitDetails.upiAmount}
                    onChange={(e) => setSplitDetails({ ...splitDetails, upiAmount: e.target.value })}
                    placeholder="UPI ₹"
                    className="px-2 py-1 bg-white border border-brand-border rounded-lg text-[10px] font-bold"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel Summary & POS Actions */}
      <div className="glass-card p-5 rounded-[20px] border border-brand-border space-y-5 flex flex-col justify-between h-full">
        <div className="space-y-5">
          {/* Invoice Summary Header */}
          <div>
            <h2 className="text-sm font-bold text-brand-dark flex items-center justify-between">
              <span>Bill Summary</span>
              <span className="text-[10px] font-mono text-brand-muted bg-brand-bg px-2 py-0.5 rounded border border-brand-border">
                {cart.length} Items
              </span>
            </h2>
          </div>
          
          {/* Checkout Cost Breakdown */}
          <div className="space-y-2.5 text-xs font-semibold text-brand-muted bg-brand-bg/50 p-4 rounded-2xl border border-brand-border">
            <div className="flex justify-between items-center">
              <span>Subtotal</span>
              <span className="text-brand-dark">₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Item Discounts</span>
              <span className="text-brand-danger font-bold">-₹{totals.discountAmount.toFixed(2)}</span>
            </div>
            {totals.couponDiscount > 0 && (
              <div className="flex justify-between items-center">
                <span>Coupon Promo</span>
                <span className="text-brand-danger font-bold">-₹{totals.couponDiscount.toFixed(2)}</span>
              </div>
            )}
            {totals.loyaltyDiscount > 0 && (
              <div className="flex justify-between items-center">
                <span>Loyalty Rewards</span>
                <span className="text-brand-danger font-bold">-₹{totals.loyaltyDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>GST Tax</span>
              <span className="text-brand-dark">+₹{totals.gstAmount.toFixed(2)}</span>
            </div>
            <hr className="border-brand-border my-2" />
            <div className="flex justify-between items-center text-brand-dark font-extrabold text-sm">
              <span>Grand Total</span>
              <span className="text-brand-primary text-xl font-bold">₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Today's Offers / AI Recommendation Card */}
          <div className="bg-gradient-to-br from-brand-gold/10 via-brand-primary/5 to-transparent border border-brand-gold/30 p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark uppercase tracking-wider">
              <Sparkles size={14} className="text-brand-gold animate-pulse" />
              Today's Offers & AI Upsells
            </div>

            {recommendations.length === 0 ? (
              <p className="text-[10px] text-brand-muted font-medium">Add grocery items to unlock AI recommendation bundles.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-brand-muted font-bold uppercase">Frequently Bought Together:</p>
                {recommendations.map(rec => (
                  <div key={rec._id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-brand-border text-xs font-semibold shadow-sm">
                    <div>
                      <p className="text-brand-dark font-bold leading-tight">{rec.name}</p>
                      <p className="text-[9px] text-brand-muted font-medium mt-0.5">{rec.category}</p>
                    </div>
                    <button 
                      onClick={() => handleProductSelect(rec)}
                      className="bg-brand-primary text-white hover:bg-brand-primary/90 px-2.5 py-1 rounded-lg text-[10px] font-bold transition shadow-sm"
                    >
                      +₹{rec.sellingPrice.toFixed(2)}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* POS Execution Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full glass-btn-primary py-3.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            <Coins size={18} />
            Complete Checkout & Pay
          </button>
          
          <button
            onClick={handlePrint}
            disabled={cart.length === 0}
            className="w-full bg-white border border-brand-border hover:border-brand-primary text-brand-dark font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Printer size={16} className="text-brand-primary" />
            Print POS Thermal Receipt
          </button>
        </div>
      </div>

      {/* Synchronize QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-brand-dark/40 backdrop-blur-md z-50">
          <div className="glass-panel p-6 rounded-[20px] w-full max-w-sm border border-brand-border shadow-2xl space-y-5 text-center">
            <h3 className="font-bold text-base text-brand-dark flex items-center justify-center gap-2">
              <QrCode size={20} className="text-brand-primary" /> Pair Mobile Barcode Scanner
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Scan this QR code using your mobile phone camera to instantly connect it as a wireless barcode scanner.
            </p>
            <div className="flex justify-center p-4 bg-white rounded-2xl border border-brand-border shadow-inner mx-auto w-max">
              <QRCodeSVG value={scannerLinkUrl} size={180} />
            </div>
            <div className="bg-brand-bg p-2.5 rounded-xl border border-brand-border font-mono text-[10px] text-brand-muted select-all truncate">
              {scannerLinkUrl}
            </div>
            <button 
              onClick={() => setShowQrModal(false)}
              className="w-full bg-brand-danger/10 hover:bg-brand-danger hover:text-white text-brand-danger font-bold py-2.5 rounded-xl text-xs transition"
            >
              Close Pairing Modal
            </button>
          </div>
        </div>
      )}

      {/* Hidden Printable Invoice component */}
      <div className="hidden">
        <div ref={printComponentRef} className="p-8 font-mono text-sm leading-tight text-black max-w-[350px] mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-bold text-base uppercase">Apex Supermarket</h2>
            <p className="text-xs">123 Commercial Plaza, Tech City</p>
            <p className="text-xs">Phone: +1 (555) 019-2834</p>
            <p className="text-xs">GSTIN: 29AAAAA1111A1Z1</p>
          </div>

          <div className="border-t border-b border-black border-dashed py-2 space-y-1 text-xs">
            <p>Invoice: {generateBillNumber()}</p>
            <p>Date: {new Date().toLocaleString()}</p>
            <p>Cashier: {user?.name}</p>
            {customer && (
              <>
                <p>Customer: {customer.name}</p>
                <p>Loyalty Membership: {customer.membershipId}</p>
              </>
            )}
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black border-dashed">
                <th className="text-left pb-1 font-bold">Item</th>
                <th className="text-center pb-1 font-bold">Qty</th>
                <th className="text-right pb-1 font-bold">Amt</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1">{item.name}</td>
                  <td className="text-center py-1">{item.quantity}</td>
                  <td className="text-right py-1">₹{(item.sellingPrice * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-black border-dashed pt-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (GST):</span>
              <span>₹{totals.gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Grand Total:</span>
              <span>₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-xs space-y-1 pt-4">
            <p>Payment: {paymentMethod}</p>
            <p className="font-bold">Thank you for shopping with us!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
