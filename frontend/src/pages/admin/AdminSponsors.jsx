import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import { Building2, Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminSponsors = () => {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);

  const [formData, setFormData] = useState({
    brandName: '',
    contactName: '',
    email: '',
    category: 'Electronics',
    totalBudget: 50000,
    website: 'https://brand.com',
    logoUrl: 'https://picsum.photos/seed/brand/200/200'
  });

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSponsors({ limit: 100 });
      if (res.success) setSponsors(res.data);
    } catch (err) {
      toast.error('Failed to load sponsors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const handleOpenCreate = () => {
    setEditingSponsor(null);
    setFormData({
      brandName: '',
      contactName: '',
      email: '',
      category: 'Electronics',
      totalBudget: 50000,
      website: 'https://brand.com',
      logoUrl: 'https://picsum.photos/seed/brand/200/200'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSponsor(s);
    setFormData({
      brandName: s.brandName,
      contactName: s.contactName || '',
      email: s.email,
      category: s.category,
      totalBudget: s.totalBudget,
      website: s.website || '',
      logoUrl: s.logoUrl || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        totalBudget: parseFloat(formData.totalBudget)
      };

      if (editingSponsor) {
        await adminApi.updateSponsor(editingSponsor._id, payload);
        toast.success('Sponsor updated!');
      } else {
        await adminApi.createSponsor(payload);
        toast.success('Sponsor created!');
      }
      setShowModal(false);
      fetchSponsors();
    } catch (err) {
      toast.error(err.error || 'Failed to save sponsor.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sponsor?')) return;
    try {
      await adminApi.deleteSponsor(id);
      toast.success('Sponsor deleted.');
      fetchSponsors();
    } catch (err) {
      toast.error('Failed to delete sponsor.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Sponsors & Brand Partners
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage advertising sponsors and their committed platform campaign budgets.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Brand Sponsor</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading sponsors...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sponsors.map((s) => {
            const remaining = Math.max(0, s.totalBudget - s.spentBudget);
            const spentPercent = Math.min(100, (s.spentBudget / s.totalBudget) * 100);

            return (
              <div
                key={s._id}
                className="p-5 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <img
                      src={s.logoUrl || 'https://picsum.photos/100/100'}
                      alt=""
                      className="w-10 h-10 rounded-2xl object-cover bg-white border border-oxygen-lightBorder dark:border-oxygen-darkBorder"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {s.brandName}
                      </h4>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                        {s.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 truncate">Contact: {s.contactName} ({s.email})</p>
                </div>

                {/* Budget meter */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle/40 border border-oxygen-lightBorder dark:border-oxygen-darkBorder space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Committed Budget</span>
                    <span className="text-slate-900 dark:text-white">₹{s.totalBudget?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: `${spentPercent}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Spent: ₹{s.spentBudget?.toLocaleString('en-IN')}</span>
                    <span>Remaining: ₹{remaining.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-oxygen-lightBorder dark:border-oxygen-darkBorder">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-oxygen-darkSubtle text-slate-600 dark:text-slate-300"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="p-2 rounded-xl hover:bg-red-50 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
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
              className="w-full max-w-md p-6 sm:p-8 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingSponsor ? 'Edit Sponsor' : 'Add Brand Sponsor'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Category *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Total Budget (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.totalBudget}
                      onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                      className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
                  >
                    Save Sponsor
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
