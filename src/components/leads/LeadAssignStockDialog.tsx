import React, { useState, useEffect } from "react";
import { X, PackagePlus, AlertCircle, History } from "lucide-react";
import axios from "axios";
import { baseUrl, getAuthToken } from "@/config";
import { ApiLead } from "./types";
import toast from "react-hot-toast";
import { useAppDispatch } from '@/redux/hooks';
import { fetchProducts } from '@/redux/slices/productSlice';

type Category = { _id: string; name: string };
type Product = { _id: string; name: string; currentStock: number; categoryId: string | { _id: string }; unit?: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  lead: ApiLead | null;
  onSuccess: () => void;
};

export default function LeadAssignStockDialog({ isOpen, onClose, lead, onSuccess }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number | "">>({});
  const [note, setNote] = useState<string>("");

  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Fetch full lead details to get assignedStock populated
  const [fullLead, setFullLead] = useState<ApiLead | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategoriesAndProducts();
      if (lead?._id) {
        fetchLeadDetails(lead._id);
      }
    } else {
      resetForm();
    }
  }, [isOpen, lead]);

  const fetchCategoriesAndProducts = async () => {
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [catRes, prodRes] = await Promise.all([
        axios.get(baseUrl.category, { headers }),
        axios.get(baseUrl.product, { headers })
      ]);

      if (catRes.data.data) {
        setCategories(catRes.data.data);
      }
      if (prodRes.data.data) {
        setProducts(prodRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      toast.error("Failed to load inventory data");
    }
  };

  const fetchLeadDetails = async (id: string) => {
    setFetching(true);
    try {
      const token = getAuthToken();
      const res = await axios.get(`${baseUrl.findLeadById}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "Success") {
        setFullLead(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching lead details:", err);
    } finally {
      setFetching(false);
    }
  };

  const resetForm = () => {
    setQuantities({});
    setNote("");
    setFullLead(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const assignments = Object.entries(quantities)
      .map(([productId, qty]) => ({ productId, quantity: Number(qty) }))
      .filter(a => a.quantity > 0);

    if (assignments.length === 0) {
      toast.error("Please enter a quantity for at least one product.");
      return;
    }

    // Validation
    for (const assignment of assignments) {
      const selProd = products.find(p => p._id === assignment.productId);
      if (selProd && selProd.currentStock < assignment.quantity) {
        toast.error(`Insufficient stock for ${selProd.name}! Only ${selProd.currentStock} available.`);
        return;
      }
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      let successCount = 0;

      // Sequential requests for simplicity and safety against stock race conditions
      for (const assignment of assignments) {
        const selProd = products.find(p => p._id === assignment.productId);
        const categoryId = selProd ? (typeof selProd.categoryId === 'object' ? selProd.categoryId._id : selProd.categoryId) : "";

        const payload = {
          categoryId,
          productId: assignment.productId,
          quantity: assignment.quantity,
          note: note || "-"
        };

        const res = await axios.post(baseUrl.assignStock(lead!._id), payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.status === "Success") {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully assigned ${successCount} product(s)!`);
        onSuccess(); // Trigger parent refresh
        fetchLeadDetails(lead!._id); // Refresh local lead data for history
        setQuantities({});
        setNote("");
        fetchCategoriesAndProducts(); // Refresh stock
        dispatch(fetchProducts()); // Refresh global redux stock
        onClose(); // Close the modal
      }
    } catch (error: any) {
      console.error("Error assigning stock:", error);
      toast.error(error.response?.data?.message || "Failed to assign stock");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#A63C71]/10 text-[#A63C71] rounded-lg">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Assign Stock to Lead</h2>
              <p className="text-sm text-gray-500">{lead?.fullName} {lead?.leadrefrance ? `(${lead.leadrefranceName || lead.leadrefrance})` : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Content Area - Stacked Layout */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Top: New Assignment Form */}
          <div className="w-full">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(() => {
                  const history = fullLead?.assignedStock || [];
                  const assignedTotals: Record<string, number> = {};
                  history.forEach((item: any) => {
                    const prodId = typeof item.product === 'object' ? item.product._id : item.product;
                    assignedTotals[prodId] = (assignedTotals[prodId] || 0) + (item.quantity || 0);
                  });

                  return products.map((p, index) => {
                    const val = quantities[p._id] !== undefined ? quantities[p._id] : "";
                    const numVal = typeof val === "number" ? val : 0;
                    const remaining = p.currentStock - numVal;
                    const totalAssigned = assignedTotals[p._id] || 0;

                    return (
                      <div key={p._id} className="border border-gray-200 rounded-lg p-2.5 bg-white shadow-sm hover:border-[#A63C71] transition-colors flex flex-col h-[115px]">
                        <div className="flex justify-between items-start mb-2 gap-1 overflow-hidden">
                          <label className="text-[13px] font-semibold text-gray-800 leading-tight line-clamp-2" title={p.name}>{p.name}</label>
                          {totalAssigned > 0 && (
                            <span className="text-[10px] font-bold text-[#A63C71] bg-[#A63C71]/10 px-1.5 py-0.5 rounded whitespace-nowrap" title="Total previously assigned">
                              Total: {totalAssigned}
                            </span>
                          )}
                        </div>
                      
                      <div className="mt-auto flex border border-gray-300 rounded overflow-hidden shadow-inner h-[40px] focus-within:ring-1 focus-within:ring-[#A63C71] focus-within:border-transparent">
                        <div className="w-[60%] relative flex items-center justify-center">
                          <input
                            type="number"
                            id={`stock-input-${index}`}
                            min="0"
                            max={p.currentStock}
                            value={val}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const nextInput = document.getElementById(`stock-input-${index + 1}`);
                                if (nextInput) {
                                  nextInput.focus();
                                } else {
                                  document.getElementById('stock-note-input')?.focus();
                                }
                              }
                            }}
                            onChange={(e) => {
                              let inputVal = e.target.value === "" ? "" : Number(e.target.value);
                              if (typeof inputVal === "number" && inputVal > p.currentStock) {
                                inputVal = p.currentStock; // Force limit
                              }
                              setQuantities({ ...quantities, [p._id]: inputVal } as Record<string, number | "">);
                            }}
                            className="w-full h-full px-2 py-1 !outline-none focus:!outline-none !ring-0 focus:!ring-0 !border-0 focus:!border-0 !shadow-none rounded-none text-lg text-center font-bold text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent relative z-10"
                            placeholder={p.unit && p.unit !== 'Qty' ? p.unit : 'Qty'}
                          />
                          {val !== "" && p.unit && p.unit !== 'Qty' && (
                            <span className="absolute bottom-0 right-1 text-[9px] text-[#A63C71]/60 font-bold pointer-events-none z-0">
                              {p.unit}
                            </span>
                          )}
                        </div>
                        <div className={`w-[40%] border-l border-gray-300 px-1 py-1 flex flex-col items-center justify-center text-[11px] font-bold leading-tight ${numVal > 0 ? 'bg-[#A63C71]/10 text-[#A63C71]' : 'bg-gray-50 text-gray-600'}`}>
                          <span>Rem</span>
                          <span>{remaining}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
                })()}
                {products.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4 col-span-full">No products available.</p>
                )}
              </div>

              <div className="mt-4 bg-gray-50 p-4 border border-gray-100 rounded-lg flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    id="stock-note-input"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A63C71] focus:border-[#A63C71]"
                    placeholder="Installation notes..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || Object.values(quantities).filter((v) => typeof v === "number" && v > 0).length === 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#A63C71] hover:bg-[#8B325E] text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <PackagePlus className="h-4 w-4" /> Assign Stock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
