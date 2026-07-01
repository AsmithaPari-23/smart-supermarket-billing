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
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 select-none h-[calc(100vh-140px)]">
      {/* Left Panel POS Details */}
      <div className="xl:col-span-3 flex flex-col justify-between glass-card p-5 rounded-3xl border border-glass-border overflow-hidden h-full">
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          {/* Header & Device Sync */}
          <div className="flex items-center justify-between no-print">
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search products by name or enter barcode..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-glass-border bg-white/40 focus:bg-white/80 focus:border-accent-primary outline-none transition-all duration-200 text-sm font-medium"
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-glass-border rounded-xl shadow-xl z-50 divide-y divide-glass-border max-h-60 overflow-y-auto custom-scrollbar">
                  {searchResults.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => handleProductSelect(p)}
                      className="px-4 py-2.5 hover:bg-glass-hover text-sm font-medium flex justify-between items-center cursor-pointer"
                    >
                      <div>
                        <p className="text-text-primary">{p.name}</p>
                        <p className="text-[10px] text-text-secondary font-mono">BC: {p.barcode} | Cat: {p.category}</p>
                      </div>
                      <span className="text-accent-primary font-bold">₹{p.sellingPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Scan link */}
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                scannerConnected 
                  ? 'bg-accent-success/15 text-accent-success border border-accent-success/20' 
                  : 'bg-amber-500/15 text-accent-warning border border-accent-warning/20'
              }`}>
                <Smartphone size={12} />
                {scannerConnected ? 'Mobile scanner Linked' : 'No Scanner connected'}
              </span>
              <button 
                onClick={() => setShowQrModal(true)}
                className="bg-white/40 border border-glass-border hover:bg-glass-hover p-2 rounded-xl text-text-primary transition duration-150"
              >
                <QrCode size={18} />
              </button>
            </div>
          </div>

          {/* Cart Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glass-border text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="pb-3 w-2/5">Product Name</th>
                  <th className="pb-3 text-center w-1/5">Quantity</th>
                  <th className="pb-3 text-right w-1/5">Unit Price</th>
                  <th className="pb-3 text-right w-1/5">Subtotal</th>
                  <th className="pb-3 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border text-sm font-medium">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-text-secondary/50 font-medium">
                      Cart is empty. Scan barcode or search items above to begin.
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item._id} className="hover:bg-white/10 transition-colors">
                      <td className="py-3.5">
                        <p className="text-text-primary font-semibold leading-snug">{item.name}</p>
                        <p className="text-[10px] text-text-secondary/60 font-mono mt-0.5">BC: {item.barcode}</p>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item._id, -1)}
                            className="h-7 w-7 bg-white/50 border border-glass-border hover:bg-glass-hover rounded-lg flex items-center justify-center text-text-primary active:scale-95 transition"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item._id, 1)}
                            className="h-7 w-7 bg-white/50 border border-glass-border hover:bg-glass-hover rounded-lg flex items-center justify-center text-text-primary active:scale-95 transition"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 text-right text-text-secondary">₹{item.sellingPrice.toFixed(2)}</td>
                      <td className="py-3.5 text-right text-text-primary font-bold">
                        ₹{(item.sellingPrice * item.quantity).toFixed(2)}
                      </td>
                      <td className="py-3.5 text-center">
                        <button 
                          onClick={() => removeItem(item._id)}
                          className="text-text-secondary hover:text-accent-danger p-1 rounded-lg transition"
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

        {/* Bottom Totals Bar */}
        <div className="border-t border-glass-border pt-4 mt-4 space-y-4 no-print">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer CRM section */}
            <div className="bg-white/30 border border-glass-border p-3.5 rounded-2xl space-y-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">CRM Lookup</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter Phone Number..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-glass-border bg-white/40 text-xs font-semibold outline-none"
                />
                <button 
                  onClick={handleCustomerSearch}
                  className="bg-accent-primary hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  Lookup
                </button>
              </div>
              {customer && (
                <div className="text-[10px] font-semibold text-text-secondary leading-tight mt-2 flex justify-between items-center bg-white/50 p-2 rounded-lg border border-glass-border">
                  <div>
                    <p className="text-text-primary font-bold">{customer.name}</p>
                    <p className="text-accent-primary mt-0.5">{customer.tier} Tier</p>
                  </div>
                  <div className="text-right">
                    <p>Points: {customer.loyaltyPoints}</p>
                    <button 
                      onClick={() => setLoyaltyRedeemPoints(Math.min(customer.loyaltyPoints, 50))} // redeem caps at 50
                      className="text-[9px] text-accent-success hover:underline font-bold uppercase mt-1 block"
                    >
                      Redeem 50 pts
                    </button>
                  </div>
                </div>
              )}
              {customerError && <p className="text-[10px] text-accent-danger font-medium">{customerError}</p>}
            </div>

            {/* Coupons section */}
            <div className="bg-white/30 border border-glass-border p-3.5 rounded-2xl space-y-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Discount Coupon</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon Code (e.g. FLAT5)..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-glass-border bg-white/40 text-xs font-semibold outline-none"
                />
                <button 
                  onClick={handleApplyCoupon}
                  className="bg-accent-success hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="text-[10px] font-semibold text-accent-success leading-tight mt-2 flex justify-between items-center bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                  <span>Coupon Applied: {appliedCoupon.code}</span>
                  <button onClick={() => setAppliedCoupon(null)} className="text-text-secondary hover:text-accent-danger font-bold uppercase ml-2">Remove</button>
                </div>
              )}
              {couponError && <p className="text-[10px] text-accent-danger font-medium">{couponError}</p>}
            </div>

            {/* Payment Mode */}
            <div className="bg-white/30 border border-glass-border p-3.5 rounded-2xl space-y-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-glass-border bg-white/40 text-xs font-semibold outline-none"
              >
                <option value="Cash">Cash Payment</option>
                <option value="Card">Card Payment</option>
                <option value="UPI">UPI Digital Payment</option>
                <option value="Split">Split Payment</option>
              </select>

              {paymentMethod === 'Split' && (
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  <input
                    type="number"
                    value={splitDetails.cashAmount}
                    onChange={(e) => setSplitDetails({ ...splitDetails, cashAmount: e.target.value })}
                    placeholder="Cash ₹"
                    className="px-2 py-1 bg-white border border-glass-border rounded-lg text-[10px] font-semibold"
                  />
                  <input
                    type="number"
                    value={splitDetails.cardAmount}
                    onChange={(e) => setSplitDetails({ ...splitDetails, cardAmount: e.target.value })}
                    placeholder="Card ₹"
                    className="px-2 py-1 bg-white border border-glass-border rounded-lg text-[10px] font-semibold"
                  />
                  <input
                    type="number"
                    value={splitDetails.upiAmount}
                    onChange={(e) => setSplitDetails({ ...splitDetails, upiAmount: e.target.value })}
                    placeholder="UPI ₹"
                    className="px-2 py-1 bg-white border border-glass-border rounded-lg text-[10px] font-semibold"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel AI Insights & Summary */}
      <div className="glass-card p-5 rounded-3xl border border-glass-border space-y-6 overflow-y-auto custom-scrollbar h-full">
        {/* Checkout Cost Summary */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold font-heading text-text-primary">Summary</h2>
          
          <div className="space-y-2 text-xs font-medium text-text-secondary">
            <div className="flex justify-between items-center">
              <span>Items Total</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Discount</span>
              <span className="text-accent-danger">-₹{totals.discountAmount.toFixed(2)}</span>
            </div>
            {totals.couponDiscount > 0 && (
              <div className="flex justify-between items-center">
                <span>Coupon Applied</span>
                <span className="text-accent-danger">-₹{totals.couponDiscount.toFixed(2)}</span>
              </div>
            )}
            {totals.loyaltyDiscount > 0 && (
              <div className="flex justify-between items-center">
                <span>Loyalty Savings</span>
                <span className="text-accent-danger">-₹{totals.loyaltyDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>Tax (GST)</span>
              <span>+₹{totals.gstAmount.toFixed(2)}</span>
            </div>
            <hr className="border-glass-border my-2" />
            <div className="flex justify-between items-center text-text-primary font-bold text-sm">
              <span>Grand Total</span>
              <span className="text-accent-primary text-base font-heading font-extrabold">₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-glass-border p-4 rounded-2xl space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary uppercase tracking-wider font-heading">
            <Sparkles size={14} className="text-accent-primary animate-pulse" />
            AI Cross-Sell Engine
          </div>

          {recommendations.length === 0 ? (
            <p className="text-[10px] text-text-secondary font-medium">Add products to cart to receive recommended bundles.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-text-secondary font-semibold uppercase">Frequently Bought Together:</p>
              {recommendations.map(rec => (
                <div key={rec._id} className="flex justify-between items-center bg-white/60 p-2.5 rounded-xl border border-glass-border text-[11px] font-semibold">
                  <div>
                    <p className="text-text-primary leading-tight">{rec.name}</p>
                    <p className="text-[9px] text-text-secondary font-medium mt-0.5">{rec.category}</p>
                  </div>
                  <button 
                    onClick={() => handleProductSelect(rec)}
                    className="bg-accent-primary/10 text-accent-primary border border-accent-primary/20 hover:bg-accent-primary hover:text-white px-2 py-1 rounded-lg text-[9px] font-bold"
                  >
                    Add +₹{rec.sellingPrice.toFixed(2)}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* POS Controls */}
        <div className="space-y-3">
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-accent-primary hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Coins size={18} />
            Generate Bill
          </button>
          
          <button
            onClick={handlePrint}
            disabled={cart.length === 0}
            className="w-full bg-white/60 border border-glass-border hover:bg-glass-hover text-text-primary font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={16} />
            Print POS Receipt
          </button>
        </div>
      </div>

      {/* Synchronize QR Code Modal */}
      {showQrModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="glass-panel p-6 rounded-3xl w-full max-w-sm border border-glass-border shadow-2xl space-y-5 text-center">
            <h3 className="font-heading font-bold text-base text-text-primary">Connect Mobile Barcode Scanner</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Scan this QR code with your mobile browser camera to link it as a real-time scanner.
            </p>
            <div className="flex justify-center p-3 bg-white rounded-2xl border border-glass-border inline-block mx-auto">
              <QRCodeSVG value={scannerLinkUrl} size={180} />
            </div>
            <div className="bg-white/40 p-2.5 rounded-xl border border-glass-border font-mono text-[10px] text-text-secondary select-all truncate">
              {scannerLinkUrl}
            </div>
            <button 
              onClick={() => setShowQrModal(false)}
              className="w-full bg-accent-danger/10 hover:bg-accent-danger/20 text-accent-danger font-bold py-2 rounded-xl text-xs transition"
            >
              Close
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
