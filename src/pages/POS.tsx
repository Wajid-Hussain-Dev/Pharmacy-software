import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Receipt,
  User,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../components/AuthContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const POS = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'medicines'), (snapshot) => {
      setMedicines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'medicines'));

    return () => unsubscribe();
  }, []);

  const addToCart = (medicine: any) => {
    if (medicine.quantity <= 0) {
      toast.error('Out of stock');
      return;
    }

    const existingItem = cart.find(item => item.id === medicine.id);
    if (existingItem) {
      if (existingItem.cartQuantity >= medicine.quantity) {
        toast.error('Cannot add more than available stock');
        return;
      }
      setCart(cart.map(item => 
        item.id === medicine.id 
          ? { ...item, cartQuantity: item.cartQuantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { ...medicine, cartQuantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.cartQuantity + delta;
        if (newQty > 0 && newQty <= item.quantity) {
          return { ...item, cartQuantity: newQty };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.sellingPrice * item.cartQuantity), 0);
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax - discount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const saleData = {
        items: cart.map(item => ({
          medicineId: item.id,
          name: item.name,
          quantity: item.cartQuantity,
          price: item.sellingPrice
        })),
        totalAmount: subtotal,
        discount,
        tax,
        finalAmount: total,
        cashierId: user?.uid,
        timestamp: new Date().toISOString()
      };

      // 1. Create sale record
      const saleRef = await addDoc(collection(db, 'sales'), saleData);

      // 2. Update inventory
      for (const item of cart) {
        const medicineRef = doc(db, 'medicines', item.id);
        await updateDoc(medicineRef, {
          quantity: increment(-item.cartQuantity)
        });
      }

      toast.success('Sale completed successfully');
      generateInvoice(saleData, saleRef.id);
      setCart([]);
      setDiscount(0);
    } catch (error) {
      console.error(error);
      toast.error('Failed to complete sale');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInvoice = (saleData: any, saleId: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('PharmaFlow Pro', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('123 Pharmacy St, Medical City', 105, 28, { align: 'center' });
    doc.text('Phone: +1 234 567 890', 105, 33, { align: 'center' });
    
    doc.line(20, 40, 190, 40);
    
    // Invoice Info
    doc.text(`Invoice #: ${saleId.slice(-8).toUpperCase()}`, 20, 50);
    doc.text(`Date: ${new Date(saleData.timestamp).toLocaleString()}`, 20, 55);
    doc.text(`Cashier ID: ${saleData.cashierId.slice(-6)}`, 20, 60);
    
    // Table
    (doc as any).autoTable({
      startY: 70,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: saleData.items.map((item: any) => [
        item.name,
        item.quantity,
        formatCurrency(item.price),
        formatCurrency(item.price * item.quantity)
      ]),
      theme: 'striped',
      headStyles: { fillStyle: '#3b82f6' }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Totals
    doc.text(`Subtotal: ${formatCurrency(saleData.totalAmount)}`, 140, finalY);
    doc.text(`Tax (5%): ${formatCurrency(saleData.tax)}`, 140, finalY + 5);
    doc.text(`Discount: -${formatCurrency(saleData.discount)}`, 140, finalY + 10);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${formatCurrency(saleData.finalAmount)}`, 140, finalY + 18);
    
    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 105, finalY + 30, { align: 'center' });
    
    doc.save(`invoice-${saleId.slice(-8)}.pdf`);
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-120px)]">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search medicines by name or generic name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
          {filteredMedicines.map((medicine) => (
            <button
              key={medicine.id}
              onClick={() => addToCart(medicine)}
              disabled={medicine.quantity <= 0}
              className={cn(
                "bg-white p-4 rounded-2xl border border-gray-100 text-left transition-all hover:shadow-md hover:border-blue-200 group",
                medicine.quantity <= 0 && "opacity-50 grayscale cursor-not-allowed"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-md">
                  {medicine.category || 'General'}
                </span>
                <span className={cn(
                  "text-xs font-bold",
                  medicine.quantity < 20 ? "text-red-500" : "text-green-500"
                )}>
                  {medicine.quantity} in stock
                </span>
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{medicine.name}</h3>
              <p className="text-xs text-gray-500 mb-3 truncate">{medicine.genericName}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-lg font-black text-gray-900">{formatCurrency(medicine.sellingPrice)}</span>
                <div className="p-2 bg-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={16} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart / Checkout */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Current Order</h2>
          </div>
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            {cart.length} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.sellingPrice)} / unit</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1 hover:text-blue-600 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{item.cartQuantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1 hover:text-blue-600 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 py-20">
              <ShoppingCart size={48} strokeWidth={1} />
              <p className="text-sm">Your cart is empty</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax (5%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-600">Discount</span>
            <div className="relative w-24">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input
                type="number"
                className="w-full pl-5 pr-2 py-1 border border-gray-200 rounded-lg text-right text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="pt-3 border-t border-gray-200 flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Amount</p>
              <p className="text-3xl font-black text-gray-900">{formatCurrency(total)}</p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
            >
              <Receipt size={20} />
              {isProcessing ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
