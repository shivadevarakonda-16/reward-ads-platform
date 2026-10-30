import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import { Package, Plus, Trash2, Edit2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    sponsorId: '',
    title: '',
    description: '',
    category: 'Electronics',
    price: 999,
    discountPrice: 799,
    availability: 'in_stock',
    productUrl: '',
    images: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getProducts({ limit: 100 });
      if (res.success) setProducts(res.data);
    } catch (err) {
      toast.error('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSponsors = async () => {
    try {
      const res = await adminApi.getSponsors({ limit: 100 });
      if (res.success) {
        setSponsors(res.data);
        if (res.data.length > 0 && !formData.sponsorId) {
          setFormData(prev => ({ ...prev, sponsorId: res.data[0]._id }));
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchProducts();
    fetchSponsors();
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      sponsorId: sponsors[0]?._id || '',
      title: '',
      description: '',
      category: 'Electronics',
      price: 999,
      discountPrice: 799,
      availability: 'in_stock',
      productUrl: '',
      images: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      sponsorId: prod.sponsorId?._id || prod.sponsorId,
      title: prod.title,
      description: prod.description || '',
      category: prod.category,
      price: prod.price,
      discountPrice: prod.discountPrice || '',
      availability: prod.availability,
      productUrl: prod.productUrl || '',
      images: prod.images?.[0] || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        images: [formData.images]
      };

      if (editingProduct) {
        await adminApi.updateProduct(editingProduct._id, payload);
        toast.success('Product updated successfully!');
      } else {
        await adminApi.createProduct(payload);
        toast.success('Product created successfully!');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.error || 'Failed to save product.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await adminApi.deleteProduct(id);
      toast.success('Product deleted.');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete product.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Product Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage sponsored products linked to ad campaigns and deals.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading catalog...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((prod) => (
            <div
              key={prod._id}
              className="p-4 rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft flex flex-col justify-between"
            >
              <div>
                <img
                  src={prod.images?.[0] || 'https://picsum.photos/400/300'}
                  alt={prod.title}
                  className="w-full h-36 object-cover rounded-2xl mb-3"
                />
                <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">
                  {prod.sponsorId?.brandName || 'Sponsor'}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                  {prod.title}
                </h4>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    ₹{prod.discountPrice || prod.price}
                  </span>
                  {prod.discountPrice && (
                    <span className="text-xs line-through text-slate-400">₹{prod.price}</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-oxygen-lightBorder dark:border-oxygen-darkBorder flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-oxygen-darkSubtle text-slate-600 dark:text-slate-400">
                  {prod.availability}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleOpenEdit(prod)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-oxygen-darkSubtle text-slate-600 dark:text-slate-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(prod._id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg p-6 sm:p-8 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Sponsor Brand *
                  </label>
                  <select
                    value={formData.sponsorId}
                    onChange={(e) => setFormData({ ...formData, sponsorId: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                  >
                    {sponsors.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.brandName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Regular Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Discounted Price (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.discountPrice}
                      onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                      className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
                  >
                    Save Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-3 rounded-full bg-slate-100 dark:bg-oxygen-darkSubtle text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
